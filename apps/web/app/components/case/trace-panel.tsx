import { IntegrityBadge } from '~/components/trace/integrity-badge';
import { RunningNode, TraceStep } from '~/components/trace/trace-step';
import { Skeleton } from '~/components/ui/skeleton';
import { toTraceStep } from '~/lib/case-view';
import type { TraceStepRow, VerifyResponse } from '~/api/types';

interface TracePanelProps {
  steps: readonly TraceStepRow[];
  done: boolean;
  queued: boolean;
  highlightedId: string | null;
  verify: { data?: VerifyResponse; isLoading: boolean; isError: boolean };
}

export function TracePanel({ steps, done, queued, highlightedId, verify }: TracePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {steps.length === 0 && !queued && !done ? (
        <div role="status" className="flex flex-col gap-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : null}
      <ol className="flex flex-col">
        {steps.map((row) => (
          <TraceStep key={row.id} step={toTraceStep(row)} highlighted={highlightedId === row.id} />
        ))}
        {!done ? (
          <RunningNode>{queued ? 'Waiting in the queue' : 'Investigating'}</RunningNode>
        ) : null}
      </ol>
      {done && steps.length > 0 ? (
        verify.isLoading ? (
          <span className="text-small text-text-3" role="status">
            Verifying the chain…
          </span>
        ) : verify.data ? (
          <IntegrityBadge
            verified={verify.data.valid}
            steps={verify.data.checked}
            brokenAt={verify.data.brokenAtSeq}
          />
        ) : verify.isError ? (
          <span className="text-small text-text-3">Couldn't verify the chain right now.</span>
        ) : null
      ) : null}
    </div>
  );
}
