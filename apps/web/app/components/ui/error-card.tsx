import { useEffect, useId, useState, type ReactNode } from 'react';
import { AppIcon } from '~/components/app-icon';
import { Button } from './button';
import { cn } from '~/lib/cn';

interface ErrorCardProps {
  title?: string;
  message?: string;
  code?: string;
  requestId?: string;
  occurredAt?: string;
  onRetry?: () => void;
  retrying?: boolean;
  action?: ReactNode;
  layout?: 'inline' | 'centered';
  className?: string;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="contents">
      <dt className="text-text-3">{label}</dt>
      <dd className="font-mono text-code break-all text-text">{value}</dd>
    </div>
  );
}

export function ErrorCard({
  title = 'Something went wrong',
  message = 'Something went wrong on our side. Try again.',
  code,
  requestId,
  occurredAt,
  onRetry,
  retrying = false,
  action,
  layout = 'inline',
  className,
}: ErrorCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelId = useId();
  const centered = layout === 'centered';
  const hasDetails = Boolean(code || requestId || occurredAt);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyDetails = async () => {
    const lines = [
      code && `Error code: ${code}`,
      requestId && `Request ID: ${requestId}`,
      occurredAt && `Time: ${occurredAt}`,
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex rounded-lg border border-border bg-surface shadow-card',
        centered ? 'flex-col items-center gap-4 px-6 py-12 text-center' : 'flex-col gap-4 p-5',
        className,
      )}
    >
      <div className={cn('flex gap-4', centered ? 'flex-col items-center' : 'items-start')}>
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger',
            centered ? 'size-12' : 'size-10',
          )}
        >
          <AppIcon name="trace.error" size={centered ? 24 : 20} />
        </span>
        <div className={cn('flex min-w-0 flex-col gap-1', centered && 'items-center')}>
          <h3 className="text-h3">{title}</h3>
          <p className={cn('text-small text-text-2', centered && 'max-w-sm')}>{message}</p>
          {code ? <span className="text-caption text-text-3">Error code: {code}</span> : null}
        </div>
      </div>
      {onRetry || action || hasDetails ? (
        <div className={cn('flex flex-wrap items-center gap-2', centered && 'justify-center')}>
          {onRetry ? (
            <Button
              variant="primary"
              size="sm"
              loading={retrying}
              loadingLabel="Trying…"
              onClick={onRetry}
            >
              Try again
            </Button>
          ) : null}
          {action}
          {hasDetails ? (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((value) => !value)}
            >
              Details
              <AppIcon
                name="common.chevron"
                size={16}
                className={cn('transition-transform duration-fast', open && 'rotate-180')}
              />
            </Button>
          ) : null}
        </div>
      ) : null}
      {hasDetails && open ? (
        <div
          id={panelId}
          className={cn(
            'flex w-full animate-rise flex-col gap-3 rounded-md border border-border bg-surface-2 p-4 text-left',
            centered && 'max-w-md',
          )}
        >
          <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1.5 text-small">
            {code ? <DetailRow label="Error code" value={code} /> : null}
            {requestId ? <DetailRow label="Request ID" value={requestId} /> : null}
            {occurredAt ? <DetailRow label="Time" value={occurredAt} /> : null}
          </dl>
          <Button size="sm" className="w-fit" onClick={copyDetails}>
            <AppIcon name={copied ? 'common.check' : 'common.copy'} size={16} />
            {copied ? 'Copied' : 'Copy details'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
