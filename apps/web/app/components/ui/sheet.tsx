import type { ReactNode } from 'react';
import { Dialog as Primitive } from 'radix-ui';
import { AppIcon } from '~/components/app-icon';
import { Button } from './button';
import { cn } from '~/lib/cn';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-40 bg-scrim backdrop-blur-xs data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Primitive.Content
          className={cn(
            'ui-zoom fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-pop',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-8 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            className,
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="flex flex-col gap-1">
              <Primitive.Title className="font-display text-h2 font-bold">{title}</Primitive.Title>
              <Primitive.Description className={description ? 'text-small text-text-2' : 'sr-only'}>
                {description ?? title}
              </Primitive.Description>
            </div>
            <Primitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close" className="-mt-1 -mr-2">
                <AppIcon name="common.close" size={20} />
              </Button>
            </Primitive.Close>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
            {children}
          </div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
