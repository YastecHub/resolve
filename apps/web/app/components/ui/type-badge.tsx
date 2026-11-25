import type { ClassifiedType } from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import { TYPE_ICONS, TYPE_LABELS } from '~/lib/labels';
import { cn } from '~/lib/cn';

export function TypeBadge({ type, className }: { type: ClassifiedType; className?: string }) {
  const danger = type === 'unauthorised_payment';
  return (
    <span
      className={cn(
        'inline-flex h-7.25 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-caption',
        danger ? 'border-danger bg-danger-soft text-danger' : 'border-border-strong text-text-2',
        className,
      )}
    >
      <AppIcon name={TYPE_ICONS[type]} size={16} />
      {TYPE_LABELS[type]}
    </span>
  );
}
