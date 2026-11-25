import { AppIcon } from '~/components/app-icon';
import type { IconKey } from '~/lib/icons';
import { shortId } from '~/lib/format';
import { cn } from '~/lib/cn';

interface EvidenceChipProps {
  icon?: IconKey;
  label: string;
  stepId: string;
  onClick?: () => void;
  className?: string;
}

export function EvidenceChip({
  icon = 'trace.transaction',
  label,
  stepId,
  onClick,
  className,
}: EvidenceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Evidence from ${label}, step ${stepId}. Jump to step.`}
      className={cn(
        'inline-flex h-7.25 items-center gap-1.5 rounded-full bg-accent-soft px-3 font-mono text-code text-accent-text transition-colors duration-fast ease-standard hover:brightness-95',
        className,
      )}
    >
      <AppIcon name={icon} size={16} />
      <span>
        {label} · {shortId(stepId)}
      </span>
    </button>
  );
}
