import type { RiskLevel } from '@resolve/shared';
import { RISK_LABELS } from '~/lib/labels';
import { cn } from '~/lib/cn';

const STYLES: Record<RiskLevel, string> = {
  low: 'bg-success-soft text-success',
  medium: 'bg-warning-soft text-warning',
  high: 'bg-danger-soft text-danger',
};

export function RiskPill({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7.25 items-center rounded-full px-3 text-caption',
        STYLES[level],
        className,
      )}
    >
      {RISK_LABELS[level]}
    </span>
  );
}
