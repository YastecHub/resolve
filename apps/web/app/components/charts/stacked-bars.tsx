import { cn } from '~/lib/cn';

export interface StackSegment {
  key: string;
  label: string;
  tone: 'success' | 'warning' | 'info' | 'accent' | 'plum' | 'neutral' | 'danger';
}

export interface StackRow {
  label: string;
  values: Record<string, number>;
}

const TONE = {
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  accent: 'bg-accent',
  plum: 'bg-plum',
  neutral: 'bg-text-3',
  danger: 'bg-danger',
} as const;

interface StackedBarsProps {
  segments: readonly StackSegment[];
  rows: readonly StackRow[];
  className?: string;
}

export function StackedBars({ segments, rows, className }: StackedBarsProps) {
  const max = Math.max(
    1,
    ...rows.map((row) => segments.reduce((sum, s) => sum + (row.values[s.key] ?? 0), 0)),
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legend">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-caption text-text-2">
            <span aria-hidden="true" className={cn('size-2 rounded-full', TONE[segment.tone])} />
            {segment.label}
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const total = segments.reduce((sum, s) => sum + (row.values[s.key] ?? 0), 0);
          return (
            <li
              key={row.label}
              className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3"
              aria-label={`${row.label}: ${segments.map((s) => `${row.values[s.key] ?? 0} ${s.label}`).join(', ')}`}
            >
              <span className="truncate text-small text-text-2">{row.label}</span>
              <span
                className="flex h-3 overflow-hidden rounded-full bg-surface-2"
                style={{ width: `${(total / max) * 100}%` }}
              >
                {segments.map((segment) => {
                  const value = row.values[segment.key] ?? 0;
                  return value > 0 ? (
                    <span
                      key={segment.key}
                      title={`${segment.label}: ${value}`}
                      className={cn(
                        'h-full border-r border-surface last:border-r-0',
                        TONE[segment.tone],
                      )}
                      style={{ width: `${(value / total) * 100}%` }}
                    />
                  ) : null;
                })}
              </span>
              <span className="tabular text-right text-small text-text">{total}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
