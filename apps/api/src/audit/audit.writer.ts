import { Inject, Injectable } from '@nestjs/common';
import { newId } from '../common/ids.js';
import { Prisma, type AgentStep } from '../generated/prisma/client.js';
import { PrismaService } from '../infra/prisma.service.js';
import type { StepInput } from '../agent/loop.js';
import {
  computeStepHash,
  GENESIS_HASH,
  limitForStorage,
  verifyChain,
  type ChainVerification,
} from './chain.js';

const MAX_APPEND_ATTEMPTS = 8;

/** Appends hash-chained steps. Never updates or deletes them. */
@Injectable()
export class AuditWriter {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async appendStep(investigationId: string, step: StepInput): Promise<AgentStep> {
    const input = limitForStorage(step.input);
    const output = limitForStorage(step.output);
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const last = await tx.agentStep.findFirst({
            where: { investigationId },
            orderBy: { seq: 'desc' },
            select: { seq: true, hash: true },
          });
          const seq = (last?.seq ?? 0) + 1;
          const prevHash = last?.hash ?? GENESIS_HASH;
          const hash = computeStepHash({
            prevHash,
            seq,
            kind: step.kind,
            toolName: step.toolName,
            input,
            output,
          });
          const created = await tx.agentStep.create({
            data: {
              id: newId('stp'),
              investigationId,
              seq,
              kind: step.kind,
              toolName: step.toolName,
              input: input as Prisma.InputJsonValue,
              output: output as Prisma.InputJsonValue,
              latencyMs: step.latencyMs,
              prevHash,
              hash,
            },
          });
          await tx.investigation.update({
            where: { id: investigationId },
            data: { stepsCount: seq },
          });
          return created;
        });
      } catch (error) {
        const clash =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!clash || attempt >= MAX_APPEND_ATTEMPTS) throw error;
      }
    }
  }

  listSteps(investigationId: string, afterSeq = 0): Promise<AgentStep[]> {
    return this.prisma.agentStep.findMany({
      where: { investigationId, seq: { gt: afterSeq } },
      orderBy: { seq: 'asc' },
    });
  }

  async verify(investigationId: string): Promise<ChainVerification> {
    return verifyChain(await this.listSteps(investigationId));
  }
}
