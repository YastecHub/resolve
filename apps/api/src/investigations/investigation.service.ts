import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { runAgentLoop } from '../agent/loop.js';
import { validateEvidence } from '../agent/evidence.js';
import { initialMessages } from '../agent/prompt.js';
import { createToolRunner } from '../agent/tools.js';
import type { Decision } from '../agent/decision.js';
import { AiService } from '../ai/ai.service.js';
import { AuditWriter } from '../audit/audit.writer.js';
import { CaseFilesService } from '../casefiles/casefiles.service.js';
import { newId } from '../common/ids.js';
import { executeResolution, ExecutionError } from '../executor/executor.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../infra/prisma.service.js';
import { applyPolicy } from '../policy/policy.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  INVESTIGATE_JOB,
  INVESTIGATIONS_QUEUE,
  jobIdFor,
  type InvestigateJob,
} from './queue.constants.js';

@Injectable()
export class InvestigationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(AiService) private readonly ai: AiService,
    @Inject(AuditWriter) private readonly audit: AuditWriter,
    @Inject(CaseFilesService) private readonly caseFiles: CaseFilesService,
    @InjectQueue(INVESTIGATIONS_QUEUE) private readonly queue: Queue<InvestigateJob>,
  ) {}

  async enqueue(disputeId: string, attempt?: number) {
    await this.queue.add(INVESTIGATE_JOB, { disputeId }, { jobId: jobIdFor(disputeId, attempt) });
  }

  /** One worker run. Throws to let BullMQ retry; the final failure is handled by `markFailed`. */
  async investigate(disputeId: string): Promise<void> {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute || !['queued', 'investigating'].includes(dispute.status)) return;

    const config = await this.settings.get();
    const { profile, provider } = await this.ai.active();
    const attempt = (await this.prisma.investigation.count({ where: { disputeId } })) + 1;
    const investigation = await this.prisma.investigation.create({
      data: {
        id: newId('inv'),
        disputeId,
        attempt,
        profile: profile.name,
        providerKind: profile.kind,
        model: profile.model,
      },
    });
    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'investigating', latestInvestigationId: investigation.id },
    });

    try {
      const ctx = {
        prisma: this.prisma,
        dispute: {
          id: dispute.id,
          transactionId: dispute.transactionId,
          customerId: dispute.customerId,
        },
        now: Date.now(),
        duplicateWindowMinutes: config.agent.duplicateWindowMinutes,
      };
      const result = await runAgentLoop(
        initialMessages(
          {
            id: dispute.id,
            transactionId: dispute.transactionId,
            customerId: dispute.customerId,
            reasonCode: dispute.reasonCode,
            amountMinor: Number(dispute.amountMinor),
            customerNotes: dispute.customerNotes,
          },
          config.agent.duplicateWindowMinutes,
        ),
        {
          provider,
          tools: createToolRunner(ctx),
          appendStep: (step) => this.audit.appendStep(investigation.id, step),
          maxSteps: config.agent.maxSteps,
        },
      );
      const decision = result.decision;
      const steps = await this.audit.listSteps(investigation.id);
      const evidence = validateEvidence(decision, steps);
      const policy = applyPolicy({
        decision,
        evidenceValid: evidence.valid,
        dispute: { amountMinor: Number(dispute.amountMinor) },
        config: config.policy,
      });

      await this.prisma.investigation.update({
        where: { id: investigation.id },
        data: {
          ...decisionColumns(decision),
          status: 'completed',
          evidenceValid: evidence.valid,
          evidenceProblems: evidence.problems as Prisma.InputJsonValue,
          policyDisposition: policy.disposition,
          policyReasons: policy.reasons as Prisma.InputJsonValue,
          tokensIn: result.usage.input,
          tokensOut: result.usage.output,
          finishedAt: new Date(),
        },
      });

      const action = decision.recommended_action;
      let review = policy.disposition !== 'auto_resolve' || action === 'manual_review';
      if (!review) {
        try {
          await this.prisma.$transaction((tx) =>
            executeResolution(tx, {
              disputeId,
              action: action as 'reverse_debit' | 'refund_duplicate' | 'none',
              actor: 'agent',
              duplicateWindowMinutes: config.agent.duplicateWindowMinutes,
            }),
          );
        } catch (error) {
          if (!(error instanceof ExecutionError)) throw error;
          review = true;
          await this.prisma.investigation.update({
            where: { id: investigation.id },
            data: {
              policyDisposition: 'needs_review',
              policyReasons: [...policy.reasons, 'execution_blocked'] as Prisma.InputJsonValue,
            },
          });
        }
      }
      if (review) {
        await this.prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: 'awaiting_review',
            classifiedType: decision.classified_type,
            lastError: null,
          },
        });
      } else {
        await this.prisma.dispute.update({
          where: { id: disputeId },
          data: { classifiedType: decision.classified_type },
        });
      }
      await this.caseFiles.write(disputeId);
    } catch (error) {
      await this.prisma.investigation.update({
        where: { id: investigation.id },
        data: {
          status: 'failed',
          error: (error as Error).message.slice(0, 500),
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async markFailed(disputeId: string, message: string) {
    await this.prisma.dispute.updateMany({
      where: { id: disputeId, status: { in: ['queued', 'investigating'] } },
      data: { status: 'failed', lastError: message.slice(0, 500) },
    });
  }
}

function decisionColumns(decision: Decision) {
  return {
    outcome: decision.outcome,
    confidence: decision.confidence,
    riskLevel: decision.risk_level,
    fraudSuspected: decision.fraud_suspected,
    classifiedType: decision.classified_type,
    recommendedAction: decision.recommended_action,
    reasoning: decision.reasoning,
    evidence: decision.evidence as unknown as Prisma.InputJsonValue,
    customerMessage: decision.customer_message,
  };
}
