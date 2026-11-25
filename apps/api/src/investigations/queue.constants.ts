export const INVESTIGATIONS_QUEUE = 'investigations';
export const INVESTIGATE_JOB = 'investigate';

export interface InvestigateJob {
  disputeId: string;
}

/** BullMQ dedupes on job ID, so a retry needs a fresh one. Custom IDs can't contain ':'. */
export const jobIdFor = (disputeId: string, attempt?: number) =>
  attempt && attempt > 1 ? `${disputeId}-attempt-${attempt}` : disputeId;
