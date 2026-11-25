import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useTween } from '~/lib/use-tween';
import { cn } from '~/lib/cn';

interface KpiCardProps {
  label: string;
  value: number;
  format?: (value: number) => string;
  context?: ReactNode;
  chart?: ReactNode;
  to?: string;
  className?: string;
}

const defaultFormat = (value: number) => Math.round(value).toLocaleString('en-NG');

export function KpiCard({
  label,
  value,
  format = defaultFormat,
  context,
  chart,
  to,
  className,
}: KpiCardProps) {
  const tweened = useTween(value);
  const styles = cn(
    'flex flex-col gap-2 rounded-lg border border-border bg-surface p-5 shadow-card',
    to && 'transition-colors duration-fast ease-standard hover:border-border-strong',
    className,
  );
  const body = (
    <>
      <span className="eyebrow">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <span className="min-w-0 truncate font-display text-kpi tabular">{format(tweened)}</span>
        {chart}
      </div>
      {context ? <span className="text-small text-text-3">{context}</span> : null}
    </>
  );
  return to ? (
    <Link to={to} className={styles}>
      {body}
    </Link>
  ) : (
    <div className={styles}>{body}</div>
  );
}
