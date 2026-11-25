import type { ComponentProps } from 'react';
import { cn } from '~/lib/cn';

export function Checkbox({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'size-4.5 shrink-0 rounded-sm border border-control-border bg-surface accent-accent',
        className,
      )}
      {...props}
    />
  );
}
