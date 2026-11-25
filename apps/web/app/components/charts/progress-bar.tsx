import { cn } from '~/lib/cn';

interface ProgressBarProps {
  value: number;
  label: string;
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

const TONE = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

export function ProgressBar({ value, label, tone = 'accent', className }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-slow ease-standard',
          TONE[tone],
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
