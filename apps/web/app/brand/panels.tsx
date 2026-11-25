import type { ReactNode } from 'react';
import { cn } from '~/lib/cn';

interface PanelsProps {
  children: ReactNode;
  className?: string;
  tone?: 'surface' | 'accent';
}

export function LightDark({ children, className, tone = 'surface' }: PanelsProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {(['light', 'dark'] as const).map((theme) => (
        <div
          key={theme}
          className={cn(
            theme,
            'flex flex-col gap-3 rounded-lg border border-border p-5',
            tone === 'surface' ? 'bg-surface text-text' : 'bg-accent text-accent-contrast',
          )}
        >
          <span className="text-caption capitalize opacity-70">{theme}</span>
          <div className={cn('flex flex-1 flex-wrap items-center justify-center gap-6', className)}>
            {children}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <p className="text-small text-text-3">{children}</p>;
}
