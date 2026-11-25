import { useEffect, useState } from 'react';
import { AppIcon } from '~/components/app-icon';
import { shortId } from '~/lib/format';
import { cn } from '~/lib/cn';

export function CopyableId({
  id,
  className,
  plain = false,
}: {
  id: string;
  className?: string;
  plain?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await navigator.clipboard.writeText(id);
    setCopied(true);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={id}
      aria-label={copied ? `Copied ${id}` : `Copy ${id}`}
      className={cn(
        'group inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm font-mono text-code text-text-2 transition-colors duration-fast ease-standard hover:text-text',
        className,
      )}
    >
      {plain ? id : shortId(id)}
      <AppIcon
        name={copied ? 'common.check' : 'common.copy'}
        size={16}
        className={cn(
          'transition-opacity duration-fast',
          copied
            ? 'text-success opacity-100'
            : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
        )}
      />
      <span role="status" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}
