import { AppIcon } from '~/components/app-icon';
import { cn } from '~/lib/cn';

interface IntegrityBadgeProps {
  verified: boolean;
  steps: number;
  brokenAt?: number;
  className?: string;
}

export function IntegrityBadge({ verified, steps, brokenAt, className }: IntegrityBadgeProps) {
  return (
    <div
      role="status"
      className={cn(
        'inline-flex items-center gap-2 text-small',
        verified ? 'text-success' : 'text-danger',
        className,
      )}
    >
      <AppIcon name={verified ? 'common.shield_check' : 'common.shield_alert'} size={20} />
      <span>
        {verified
          ? `Chain verified, ${steps} steps`
          : `Integrity check failed at step ${brokenAt ?? '?'}. Treat this case as unverified.`}
      </span>
    </div>
  );
}
