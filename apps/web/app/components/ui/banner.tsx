import type { ReactNode } from 'react';
import { AppIcon } from '~/components/app-icon';
import type { IconKey } from '~/lib/icons';
import { Button } from './button';
import { cn } from '~/lib/cn';

const VARIANTS = {
  info: { icon: 'common.info', style: 'border-info/25 bg-info-soft', tone: 'text-info' },
  success: {
    icon: 'common.shield_check',
    style: 'border-success/25 bg-success-soft',
    tone: 'text-success',
  },
  warning: {
    icon: 'common.warning',
    style: 'border-warning/25 bg-warning-soft',
    tone: 'text-warning',
  },
  danger: {
    icon: 'common.shield_alert',
    style: 'border-danger/25 bg-danger-soft',
    tone: 'text-danger',
  },
} as const satisfies Record<string, { icon: IconKey; style: string; tone: string }>;

export type BannerVariant = keyof typeof VARIANTS;

interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Banner({
  variant = 'info',
  title,
  children,
  action,
  onDismiss,
  className,
}: BannerProps) {
  const config = VARIANTS[variant];
  const stacked = Boolean(title && children);

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex w-full gap-3 rounded-lg border px-4 py-3 text-small',
        stacked ? 'items-start' : 'items-center',
        config.style,
        className,
      )}
    >
      <AppIcon name={config.icon} size={20} className={cn(config.tone, stacked && 'mt-0.5')} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title ? <p className="text-body font-medium text-text">{title}</p> : null}
        {children ? <div className={title ? 'text-text-2' : 'text-text'}>{children}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      {onDismiss ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="-my-1 -mr-2 shrink-0"
        >
          <AppIcon name="common.close" size={16} />
        </Button>
      ) : null}
    </div>
  );
}
