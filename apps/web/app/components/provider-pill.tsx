import type { AiProfileKind } from '@resolve/shared';
import { Link } from 'react-router';
import { AppIcon } from '~/components/app-icon';
import { paths } from '~/lib/paths';
import { Button } from '~/components/ui/button';
import { Popover } from '~/components/ui/popover';
import { Tooltip } from '~/components/ui/tooltip';
import { cn } from '~/lib/cn';

export interface ProviderProfile {
  name: string;
  kind: AiProfileKind;
  model: string;
}

const COPY: Record<AiProfileKind, { label: string; tip: string; style: string; tone: string }> = {
  onprem: {
    label: 'On-premise',
    tip: 'Customer data stays inside your infrastructure.',
    style: 'bg-success-soft text-success',
    tone: 'text-success',
  },
  hosted: {
    label: 'Hosted',
    tip: 'Masked case data is sent to the model provider via AI Gateway.',
    style: 'border border-border bg-surface text-text shadow-sticker',
    tone: 'text-text-2',
  },
};

export interface ProviderTestResult {
  ok: boolean;
  latency?: number;
  error?: string;
}

interface ProviderPillProps {
  active: ProviderProfile;
  profiles?: readonly ProviderProfile[];
  onTest?: () => void;
  testing?: boolean;
  testResult?: ProviderTestResult | null;
  className?: string;
}

export function ProviderPill({
  active,
  profiles = [active],
  onTest,
  testing = false,
  testResult = null,
  className,
}: ProviderPillProps) {
  const copy = COPY[active.kind];
  const pill = (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full px-3 text-small font-medium transition-colors duration-base ease-standard',
        copy.style,
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
      <AppIcon name={active.kind === 'onprem' ? 'provider.onprem' : 'provider.hosted'} size={16} />
      {copy.label}
      <span className="font-mono text-caption text-text-3">{active.model}</span>
    </button>
  );

  return (
    <Popover
      trigger={<span className="inline-flex">{<Tooltip content={copy.tip}>{pill}</Tooltip>}</span>}
    >
      <div className="flex flex-col gap-3">
        <h3 className="text-h3">AI model</h3>
        <ul className="flex flex-col gap-1">
          {profiles.map((profile) => (
            <li
              key={profile.name}
              className={cn(
                'flex items-center justify-between gap-3 rounded-md px-3 py-2 text-small',
                profile.name === active.name ? 'bg-surface-2' : 'text-text-2',
              )}
            >
              <span className="flex items-center gap-2">
                <AppIcon
                  name={profile.kind === 'onprem' ? 'provider.onprem' : 'provider.hosted'}
                  size={16}
                  className={COPY[profile.kind].tone}
                />
                {COPY[profile.kind].label} · {profile.model}
              </span>
              {profile.name === active.name ? <AppIcon name="common.check" size={16} /> : null}
            </li>
          ))}
        </ul>
        {testResult ? (
          <p
            role="status"
            className={cn('text-small', testResult.ok ? 'text-success' : 'text-danger')}
          >
            {testResult.ok ? `Connected · ${testResult.latency} ms` : testResult.error}
          </p>
        ) : null}
        <div className="flex items-center justify-between">
          {onTest ? (
            <Button size="sm" loading={testing} loadingLabel="Testing…" onClick={onTest}>
              Test connection
            </Button>
          ) : (
            <span />
          )}
          <Link
            to={paths.settings}
            className="rounded-sm text-small text-accent-text underline underline-offset-4"
          >
            Open settings
          </Link>
        </div>
      </div>
    </Popover>
  );
}
