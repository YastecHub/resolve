import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { verifyChain } from '../audit/chain.js';
import {
  toAnalystAction,
  toCustomerSummary,
  toInvestigationSummary,
  toSummary,
  toTransactionSummary,
} from '../disputes/dispute.mapper.js';
import { PrismaService } from '../infra/prisma.service.js';
import type { CaseFileDto } from '../trace/trace.dto.js';
import { toTraceStep } from '../trace/trace.mapper.js';

const SAFE_ID = /^dsp_[A-Za-z0-9]+$/;

@Injectable()
export class CaseFilesService {
  private readonly dir = process.env.CASE_FILES_DIR ?? '/data/case-files';

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /** Builds the case file from the database. Null when the dispute doesn't exist. */
  async build(disputeId: string): Promise<CaseFileDto | null> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transaction: { include: { merchant: true } },
        customer: true,
        latestInvestigation: { include: { steps: { orderBy: { seq: 'asc' } } } },
        analystActions: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!dispute) return null;
    const investigation = dispute.latestInvestigation;
    return {
      dispute: toSummary(dispute),
      transaction: toTransactionSummary(dispute.transaction),
      customer: toCustomerSummary(dispute.customer),
      investigation: investigation ? toInvestigationSummary(investigation) : null,
      analystActions: dispute.analystActions.map(toAnalystAction),
      steps: investigation?.steps.map(toTraceStep) ?? [],
      chainVerification: investigation ? verifyChain(investigation.steps) : null,
      generatedAt: new Date().toISOString(),
    };
  }

  /** Rebuilds and stores the case file. Called on every investigation and resolution. */
  async write(disputeId: string): Promise<CaseFileDto | null> {
    const file = await this.build(disputeId);
    if (!file || !SAFE_ID.test(disputeId)) return file;
    await mkdir(this.dir, { recursive: true });
    const target = join(this.dir, `${disputeId}.json`);
    const temp = `${target}.tmp`;
    await writeFile(temp, JSON.stringify(file, null, 2));
    await rename(temp, target);
    return file;
  }

  /** The stored file, or a freshly built and stored one if it's missing. */
  async read(disputeId: string): Promise<CaseFileDto | null> {
    if (SAFE_ID.test(disputeId)) {
      try {
        return JSON.parse(
          await readFile(join(this.dir, `${disputeId}.json`), 'utf8'),
        ) as CaseFileDto;
      } catch {
        // fall through to rebuild
      }
    }
    return this.write(disputeId);
  }
}
