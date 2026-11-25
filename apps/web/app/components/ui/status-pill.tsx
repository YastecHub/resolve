import type { DisputeStatus, Resolver } from '@resolve/shared';
import { STATUS_LABELS } from '~/lib/labels';
import { cn } from '~/lib/cn';

const STYLES: Record<DisputeStatus, string> = {
  queued: 'bg-surface-3 text-text-2',
  investigating: 'bg-plum-soft text-plum',
  awaiting_review: 'bg-warning-soft text-warning',
  escalated: 'bg-info-soft text-info',
  resolved: 'bg-success-soft text-success',
  rejected: 'border border-border-strong bg-surface-3 text-text',
  failed: 'bg-danger-soft text-danger',
};

interface StatusPillProps {
  status: DisputeStatus;
  resolvedBy?: Resolver;
  className?: string;
}

export function StatusPill({ status, resolvedBy, className }: StatusPillProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)}>
      <span
        className={cn(
          'inline-flex h-7.25 items-center gap-2 rounded-full pr-4 pl-3 text-caption transition-colors duration-base ease-standard',
          STYLES[status],
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 rounded-full bg-current',
            status === 'investigating' && 'animate-pulse-dot',
          )}
        />
        {STATUS_LABELS[status]}
      </span>
      {status === 'resolved' && resolvedBy ? (
        <span className="text-caption text-text-3">by {resolvedBy}</span>
      ) : null}
    </span>
  );
}
