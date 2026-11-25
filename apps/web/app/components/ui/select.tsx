import type { ComponentProps } from 'react';
import { AppIcon } from '~/components/app-icon';
import { cn } from '~/lib/cn';

interface SelectProps extends Omit<ComponentProps<'select'>, 'size'> {
  size?: 'md' | 'sm';
}

export function Select({ size = 'md', className, children, ...props }: SelectProps) {
  return (
    <span className="relative inline-flex">
      <select
        className={cn(
          'appearance-none rounded-md border border-control-border bg-surface pr-9 pl-3 text-small text-text transition-[border-color,box-shadow] duration-fast ease-standard hover:border-text-3 focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25 focus-visible:outline-none disabled:bg-surface-2 disabled:text-text-3',
          size === 'md' ? 'h-9' : 'h-8',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <AppIcon
        name="common.chevron"
        size={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-3"
      />
    </span>
  );
}
