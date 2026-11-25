import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <section className={cn('rounded-lg border border-border bg-surface shadow-card', className)}>
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-display text-h3 font-bold">{title}</h3>
          {description ? <p className="text-small text-text-3">{description}</p> : null}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
