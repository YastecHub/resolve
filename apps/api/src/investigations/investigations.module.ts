import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { AuditWriter } from '../audit/audit.writer.js';
import { CaseFilesService } from '../casefiles/casefiles.service.js';
import { InvestigationProcessor } from './investigation.processor.js';
import { InvestigationService } from './investigation.service.js';
import { INVESTIGATIONS_QUEUE } from './queue.constants.js';

const runWorker = process.env.RUN_WORKER !== 'false';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    }),
    BullModule.registerQueue({
      name: INVESTIGATIONS_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }),
  ],
  providers: [
    InvestigationService,
    AuditWriter,
    CaseFilesService,
    ...(runWorker ? [InvestigationProcessor] : []),
  ],
  exports: [InvestigationService, AuditWriter, CaseFilesService, BullModule],
})
export class InvestigationsModule {}
