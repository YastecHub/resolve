import type { StaffRole } from '@resolve/shared';
import { ROLE_LABELS } from '~/lib/labels';
import { cn } from '~/lib/cn';

const STYLES: Record<StaffRole, string> = {
  admin: 'bg-accent-soft text-accent-text',
  analyst: 'bg-info-soft text-info',
  viewer: 'bg-surface-3 text-text-2',
};

export function RolePill({ role, className }: { role: StaffRole; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-caption whitespace-nowrap',
        STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
