import { MS_PER_HOUR, SLA_HOURS } from '@resolve/shared';
import { cn } from '~/lib/cn';
import { Tooltip } from './tooltip';

const RADIUS = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function slaState(dueAt: number, now: number) {
  const total = SLA_HOURS * MS_PER_HOUR;
  const remaining = dueAt - now;
  const elapsed = Math.min(1, Math.max(0, 1 - remaining / total));
  const hours = Math.ceil(Math.abs(remaining) / MS_PER_HOUR);
  const tone = remaining <= 0 || elapsed > 0.85 ? 'danger' : elapsed >= 0.5 ? 'warning' : 'success';
  const label = remaining <= 0 ? `Overdue ${hours}h` : `${hours}h left`;
  return { elapsed, tone, label } as const;
}

const STROKE = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
} as const;
const TEXT = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' } as const;

interface SlaRingProps {
  dueAt: number;
  now?: number;
  showLabel?: boolean;
  className?: string;
}

export function SlaRing({ dueAt, now = Date.now(), showLabel = true, className }: SlaRingProps) {
  const { elapsed, tone, label } = slaState(dueAt, now);
  return (
    <Tooltip content={`Resolution window: ${SLA_HOURS} hours for failed PoS and web disputes.`}>
      <span
        className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)}
        role="img"
        aria-label={`Resolution window: ${label}`}
        tabIndex={0}
      >
        <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden="true">
          <circle
            cx="10"
            cy="10"
            r={RADIUS}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth="2.5"
          />
          <circle
            cx="10"
            cy="10"
            r={RADIUS}
            fill="none"
            stroke={STROKE[tone]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - elapsed)}
          />
        </svg>
        {showLabel ? (
          <span aria-hidden="true" className={cn('tabular text-small', TEXT[tone])}>
            {label}
          </span>
        ) : null}
      </span>
    </Tooltip>
  );
}
