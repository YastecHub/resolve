import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  lead?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  lead = false,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex items-end justify-between gap-4', className)}>
      <div className="flex flex-col gap-2">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className={cn('font-display font-bold', lead ? 'text-lead' : 'text-h1')}>{title}</h1>
        {subtitle ? <p className="text-body text-text-2">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
