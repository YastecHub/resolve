import { useState, type ReactNode } from 'react';
import { AppIcon } from '~/components/app-icon';
import { Button } from '~/components/ui/button';
import { formatDurationMs } from '~/lib/format';
import type { IconKey } from '~/lib/icons';
import { cn } from '~/lib/cn';

export interface TraceStepData {
  id: string;
  kind: 'model' | 'tool' | 'error' | 'decision';
  title: string;
  summary?: string;
  icon?: IconKey;
  durationMs?: number;
  details?: Record<string, string>;
  raw?: unknown;
}

interface TraceStepProps {
  step: TraceStepData;
  highlighted?: boolean;
  last?: boolean;
  index?: number;
}

function Node({ step }: { step: TraceStepData }) {
  const icon: IconKey =
    step.kind === 'model'
      ? 'trace.model'
      : step.kind === 'error'
        ? 'trace.error'
        : step.kind === 'decision'
          ? 'trace.decision'
          : (step.icon ?? 'trace.transaction');

  if (step.kind === 'model') {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-(image:--ai-gradient) p-px">
        <span className="flex size-full items-center justify-center rounded-full bg-surface">
          <AppIcon name={icon} size={16} className="text-accent-text" />
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        'flex size-7 items-center justify-center rounded-full border',
        step.kind === 'error' && 'border-danger bg-danger-soft text-danger',
        step.kind === 'decision' && 'border-accent bg-accent-soft text-accent-text',
        step.kind === 'tool' && 'border-border-strong bg-surface-2 text-text-2',
      )}
    >
      <AppIcon name={icon} size={16} />
    </span>
  );
}

export function TraceStep({ step, highlighted = false, last = false, index = 0 }: TraceStepProps) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState(false);
  const expandable = Boolean(step.details || step.raw);
  const panelId = `${step.id}-details`;
  const json = step.raw === undefined ? '' : JSON.stringify(step.raw, null, 2);

  return (
    <li
      id={`step-${step.id}`}
      className="relative flex animate-rise gap-3 pb-5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {!last ? (
        <span aria-hidden="true" className="absolute top-7 bottom-0 left-3.5 w-px bg-border" />
      ) : null}
      <span className={cn('relative z-10 h-7 rounded-full', highlighted && 'animate-ring-pulse')}>
        <Node step={step} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
        <div className="flex items-center justify-between gap-3">
          {expandable ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((value) => !value)}
              className="flex min-w-0 items-center gap-1.5 rounded-sm text-left text-body text-text"
            >
              <span className="truncate">{step.title}</span>
              <AppIcon
                name="common.chevron"
                size={16}
                className={cn(
                  'text-text-3 transition-transform duration-fast',
                  open && 'rotate-180',
                )}
              />
            </button>
          ) : (
            <span className="truncate text-body text-text">{step.title}</span>
          )}
          {step.durationMs !== undefined ? (
            <span className="tabular shrink-0 font-mono text-code text-text-3">
              {formatDurationMs(step.durationMs)}
            </span>
          ) : null}
        </div>
        {step.summary ? (
          <p className={cn('text-small', step.kind === 'error' ? 'text-danger' : 'text-text-2')}>
            {step.summary}
          </p>
        ) : null}
        {open ? (
          <div
            id={panelId}
            className="mt-1 flex flex-col gap-2 rounded-md border border-border bg-surface-2 p-3"
          >
            {step.details ? (
              <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-small">
                {Object.entries(step.details).map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-text-3">{key}</dt>
                    <dd className="tabular text-text">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {step.raw !== undefined ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-fit"
                  onClick={() => setRaw((v) => !v)}
                >
                  {raw ? 'Hide raw JSON' : 'View raw JSON'}
                </Button>
                {raw ? (
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-md border border-border bg-surface p-3 text-text-2">
                      {json}
                    </pre>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      aria-label="Copy JSON"
                      onClick={() => navigator.clipboard.writeText(json)}
                    >
                      <AppIcon name="common.copy" size={16} />
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function RunningNode({ children = 'Investigating' }: { children?: ReactNode }) {
  return (
    <li className="flex items-center gap-3" aria-live="polite">
      <span className="flex size-7 items-center justify-center rounded-full bg-(image:--ai-gradient) p-px">
        <span className="flex size-full items-center justify-center rounded-full bg-surface">
          <AppIcon name="common.sparkle" size={16} className="text-accent-text" />
        </span>
      </span>
      <span className="flex items-center gap-1 text-small text-text-2">
        {children}
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            aria-hidden="true"
            className="size-1 animate-pulse-dot rounded-full bg-text-3"
            style={{ animationDelay: `${dot * 180}ms` }}
          />
        ))}
      </span>
    </li>
  );
}
