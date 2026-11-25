import type { ReactNode } from 'react';
import { Popover as Primitive } from 'radix-ui';
import { cn } from '~/lib/cn';

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function Popover({ trigger, children, align = 'end', className }: PopoverProps) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          align={align}
          sideOffset={8}
          className={cn(
            'ui-zoom z-50 w-80 rounded-xl border border-border bg-surface p-4 shadow-pop animate-in fade-in-0 zoom-in-98',
            className,
          )}
        >
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
