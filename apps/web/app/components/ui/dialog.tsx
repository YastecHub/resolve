import type { ReactNode } from 'react';
import { Dialog as Primitive } from 'radix-ui';
import { AppIcon } from '~/components/app-icon';
import type { IconKey } from '~/lib/icons';
import { Button } from './button';
import { Kbd } from './kbd';
import { cn } from '~/lib/cn';

export type DialogTone = 'default' | 'info' | 'warning' | 'danger';
export type DialogSize = 'sm' | 'md' | 'lg';

const TONES: Record<DialogTone, { badge: string; icon: IconKey | null }> = {
  default: { badge: '', icon: null },
  info: { badge: 'bg-info-soft text-info', icon: 'common.info' },
  warning: { badge: 'bg-warning-soft text-warning', icon: 'common.warning' },
  danger: { badge: 'bg-danger-soft text-danger', icon: 'common.shield_alert' },
};

const SIZES: Record<DialogSize, string> = {
  sm: 'md:max-w-100',
  md: 'md:max-w-120',
  lg: 'md:max-w-160',
};

interface SurfaceProps {
  tone?: DialogTone;
  icon?: IconKey;
  title: ReactNode;
  description?: ReactNode;
  close?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  hint?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function DialogSurface({
  tone = 'default',
  icon,
  title,
  description,
  close,
  children,
  actions,
  hint,
  compact = false,
  className,
}: SurfaceProps) {
  const config = TONES[tone];
  const badgeIcon = icon ?? config.icon;

  return (
    <div className={cn('flex max-h-full min-h-0 flex-col', className)}>
      <header className="flex items-start gap-4 px-6 pt-6 pb-4">
        {badgeIcon ? (
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              config.badge || 'bg-accent-soft text-accent-text',
            )}
          >
            <AppIcon name={badgeIcon} size={20} />
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {title}
          {description}
        </div>
        {close}
      </header>
      {children ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      ) : null}
      {actions ? (
        <footer className="flex items-center justify-between gap-3 border-t border-border bg-surface-2 px-6 py-4">
          <span
            className={cn(
              'hidden items-center gap-2 text-caption text-text-3',
              !compact && 'md:flex',
            )}
          >
            {hint ?? (
              <>
                <Kbd>Esc</Kbd> to cancel
              </>
            )}
          </span>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </footer>
      ) : null}
    </div>
  );
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tone?: DialogTone;
  icon?: IconKey;
  size?: DialogSize;
  children?: ReactNode;
  actions?: ReactNode;
  hint?: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  tone,
  icon,
  size = 'md',
  children,
  actions,
  hint,
  className,
}: DialogProps) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <Primitive.Overlay className="fixed inset-0 z-40 bg-scrim backdrop-blur-xs data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Primitive.Content
          className={cn(
            'ui-zoom fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-pop',
            'md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:max-h-[calc(100dvh-4rem)] md:w-[calc(100%-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8 md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:zoom-in-98',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            SIZES[size],
            className,
          )}
        >
          <DialogSurface
            tone={tone}
            icon={icon}
            title={
              <Primitive.Title className="font-display text-h2 font-bold">{title}</Primitive.Title>
            }
            description={
              description ? (
                <Primitive.Description className="text-small text-text-2">
                  {description}
                </Primitive.Description>
              ) : (
                <Primitive.Description className="sr-only">{title}</Primitive.Description>
              )
            }
            close={
              <Primitive.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close" className="-mt-1 -mr-2">
                  <AppIcon name="common.close" size={20} />
                </Button>
              </Primitive.Close>
            }
            actions={actions}
            hint={hint}
            compact={size === 'sm'}
          >
            {children}
          </DialogSurface>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
