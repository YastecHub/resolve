import { Inject, Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { InvestigationService } from './investigation.service.js';
import { INVESTIGATIONS_QUEUE, type InvestigateJob } from './queue.constants.js';

@Processor(INVESTIGATIONS_QUEUE, { concurrency: 5 })
export class InvestigationProcessor extends WorkerHost {
  private readonly logger = new Logger('InvestigationProcessor');

  constructor(@Inject(InvestigationService) private readonly investigations: InvestigationService) {
    super();
  }

  async process(job: Job<InvestigateJob>): Promise<void> {
    await this.investigations.investigate(job.data.disputeId);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<InvestigateJob> | undefined, error: Error) {
    if (!job) return;
    this.logger.warn(
      JSON.stringify({
        msg: 'investigation attempt failed',
        disputeId: job.data.disputeId,
        attempt: job.attemptsMade,
      }),
    );
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.investigations.markFailed(job.data.disputeId, error.message);
    }
  }
}
