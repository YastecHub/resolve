import type { ReactNode } from 'react';
import { AdireBand } from '~/components/adire';
import { AppIcon } from '~/components/app-icon';
import type { IconKey } from '~/lib/icons';
import { cn } from '~/lib/cn';

interface EmptyStateProps {
  icon: IconKey;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 px-6 py-12 text-center', className)}>
      <div className="relative flex h-16 w-40 items-center justify-center">
        <div className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 overflow-hidden rounded-full">
          <AdireBand cell={16} className="h-8" />
        </div>
        <span className="relative flex size-14 -rotate-6 items-center justify-center rounded-full border-4 border-surface bg-surface text-accent-text shadow-sticker">
          <AppIcon name={icon} size={24} />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-h3 font-bold">{title}</h3>
        <p className="max-w-sm text-small text-text-2">{description}</p>
      </div>
      {action}
    </div>
  );
}
