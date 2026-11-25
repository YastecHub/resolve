import type { Resolver } from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import { Avatar } from '~/components/ui/avatar';
import { RelativeTime } from '~/components/ui/relative-time';
import { cn } from '~/lib/cn';

export interface ResolutionData {
  outcome: string;
  resolvedBy: Resolver;
  actor?: string;
  at: number;
  reason?: string;
  overridden?: boolean;
}

interface ResolutionBlockProps {
  resolution: ResolutionData;
  now?: number;
  className?: string;
}

export function ResolutionBlock({ resolution, now, className }: ResolutionBlockProps) {
  const byAgent = resolution.resolvedBy === 'agent';

  return (
    <div className={cn('flex flex-col gap-3 border-t border-border px-5 py-4', className)}>
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
          <AppIcon name="common.shield_check" size={20} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-body font-medium text-text">{resolution.outcome}</p>
            {resolution.overridden ? (
              <span className="rounded-full bg-warning-soft px-2 py-1 text-caption text-warning">
                Overrode the agent
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-text-2">
            {byAgent ? (
              <span className="inline-flex items-center gap-1.5">
                <AppIcon name="common.sparkle" size={16} className="text-accent-text" />
                Resolved by the agent
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Avatar name={resolution.actor ?? 'Analyst'} className="size-5 text-caption" />
                {resolution.actor ?? 'An analyst'}
              </span>
            )}
            <span aria-hidden="true" className="text-text-3">
              ·
            </span>
            <RelativeTime at={resolution.at} now={now} className="text-text-3" />
          </div>
        </div>
      </div>
      {resolution.reason ? (
        <div className="flex flex-col gap-1 rounded-md bg-surface-2 px-4 py-3">
          <span className="text-caption text-text-3">Reason</span>
          <p className="text-small text-text">{resolution.reason}</p>
        </div>
      ) : null}
    </div>
  );
}
