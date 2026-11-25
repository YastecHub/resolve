import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { AuthUser } from '../auth/auth.decorators.js';
import { newId } from '../common/ids.js';
import { DisputesService } from '../disputes/disputes.service.js';
import { PrismaService } from '../infra/prisma.service.js';
import { InvestigationService } from '../investigations/investigation.service.js';
import { INVESTIGATIONS_QUEUE } from '../investigations/queue.constants.js';
import { percentile } from '../metrics/percentile.js';
import { generateBank } from '../seed/bank.js';
import { writeBank } from '../seed/seed.js';
import type { EvalDto, EvalRowDto, SubmitDemoDto, SubmitDemoResultDto } from './demo.dto.js';

const rate = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 1000);

@Injectable()
export class DemoService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DisputesService) private readonly disputes: DisputesService,
    @Inject(InvestigationService) private readonly investigations: InvestigationService,
    @InjectQueue(INVESTIGATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  async submit(body: SubmitDemoDto): Promise<SubmitDemoResultDto> {
    const where = {
      consumedDisputeId: null,
      ...(body.types?.length ? { expectedClassifiedType: { in: body.types } } : {}),
    };
    const cases = await this.prisma.demoCase.findMany({
      where,
      orderBy: { id: 'asc' },
      ...(body.all ? {} : { take: body.count ?? 5 }),
    });
    const disputeIds: string[] = [];
    for (const demo of cases) {
      const dispute = await this.disputes.create({
        transactionId: demo.transactionId,
        reasonCode: demo.reasonCode,
        customerNotes: demo.customerNotes ?? undefined,
      });
      await this.prisma.demoCase.update({
        where: { id: demo.id },
        data: { consumedDisputeId: dispute.id },
      });
      await this.investigations.enqueue(dispute.id);
      disputeIds.push(dispute.id);
    }
    const remaining = await this.prisma.demoCase.count({ where: { consumedDisputeId: null } });
    return { created: disputeIds.length, disputeIds, remaining };
  }

  /**
   * The only code allowed to delete audit rows: wipes disputes and their trail and re-seeds
   * the bank. Staff, access events and config are kept, and the reset itself is logged.
   */
  async reset(actor: AuthUser): Promise<{ ok: true }> {
    await this.queue.obliterate({ force: true });
    await this.prisma.$executeRawUnsafe(
      'TRUNCATE agent_steps, analyst_actions, investigations, disputes, demo_cases, settlements, ledger_entries, transactions, devices, customers, merchants CASCADE',
    );
    await writeBank(this.prisma, generateBank());
    await this.prisma.accessEvent.create({
      data: {
        id: newId('acc'),
        actorEmail: actor.email,
        action: 'demo_reset',
        targetEmail: actor.email,
        detail: 'demo reset',
      },
    });
    return { ok: true };
  }

  async evaluate(): Promise<EvalDto> {
    const cases = await this.prisma.demoCase.findMany({ orderBy: { id: 'asc' } });
    const ids = cases.map((c) => c.consumedDisputeId).filter((id): id is string => id !== null);
    const disputes = await this.prisma.dispute.findMany({
      where: { id: { in: ids } },
      include: { latestInvestigation: true },
    });
    const byId = new Map(disputes.map((d) => [d.id, d]));

    const rows: EvalRowDto[] = cases.map((c) => {
      const d = c.consumedDisputeId ? byId.get(c.consumedDisputeId) : undefined;
      const inv = d?.latestInvestigation ?? null;
      const finished = inv?.status === 'completed';
      const actualType = finished ? inv!.classifiedType : null;
      const actualDisposition = finished ? inv!.policyDisposition : null;
      const typeMatch = actualType === c.expectedClassifiedType;
      const dispositionMatch = actualDisposition === c.expectedDisposition;
      return {
        demoCaseId: c.id,
        disputeId: c.consumedDisputeId,
        scenario: c.scenario,
        status: d?.status ?? null,
        pending: Boolean(d) && !finished,
        expectedType: c.expectedClassifiedType,
        actualType,
        expectedDisposition: c.expectedDisposition,
        actualDisposition,
        typeMatch,
        dispositionMatch,
        match: typeMatch && dispositionMatch,
        evidenceValid: inv?.evidenceValid ?? false,
        durationMs:
          finished && inv!.finishedAt ? inv!.finishedAt.getTime() - inv!.startedAt.getTime() : null,
      };
    });

    const evaluated = rows.filter((r) => r.disputeId && !r.pending);
    const durations = evaluated.map((r) => r.durationMs ?? 0).sort((a, b) => a - b);
    const scenarios = [...new Set(rows.map((r) => r.scenario))];
    const models = new Map<string, { profile: string; model: string; count: number }>();
    for (const d of disputes) {
      const inv = d.latestInvestigation;
      if (!inv) continue;
      const key = `${inv.profile}|${inv.model}`;
      const entry = models.get(key) ?? { profile: inv.profile, model: inv.model, count: 0 };
      entry.count++;
      models.set(key, entry);
    }

    return {
      rows,
      accuracy: rate(evaluated.filter((r) => r.match).length, evaluated.length),
      summary: {
        totalCases: rows.length,
        submitted: rows.filter((r) => r.disputeId).length,
        pending: rows.filter((r) => r.pending).length,
        evaluated: evaluated.length,
        classificationAccuracy: rate(evaluated.filter((r) => r.typeMatch).length, evaluated.length),
        dispositionAccuracy: rate(
          evaluated.filter((r) => r.dispositionMatch).length,
          evaluated.length,
        ),
        evidenceValidityRate: rate(
          evaluated.filter((r) => r.evidenceValid).length,
          evaluated.length,
        ),
        avgInvestigationMs: durations.length
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0,
        p95InvestigationMs: percentile(durations, 95),
        byScenario: scenarios.map((scenario) => {
          const done = evaluated.filter((r) => r.scenario === scenario);
          return {
            scenario,
            total: rows.filter((r) => r.scenario === scenario).length,
            classificationAccuracy: rate(done.filter((r) => r.typeMatch).length, done.length),
            dispositionAccuracy: rate(done.filter((r) => r.dispositionMatch).length, done.length),
          };
        }),
        models: [...models.values()],
      },
    };
  }
}
