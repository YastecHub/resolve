import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  minorToNaira,
  nairaToMinor,
  type AiProfileKind,
  type ExecutionMode,
} from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import { Banner } from '~/components/ui/banner';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { ErrorCard } from '~/components/ui/error-card';
import { Field, Input } from '~/components/ui/field';
import { RadioGroup, RadioItem, Slider } from '~/components/ui/form-controls';
import { PageHeader } from '~/components/ui/page-header';
import { SectionCard } from '~/components/ui/section-card';
import { SegmentedControl } from '~/components/ui/segmented-control';
import { SkeletonCard } from '~/components/ui/skeleton';
import { cn } from '~/lib/cn';
import {
  useConfig,
  useMe,
  useProfiles,
  useSaveConfig,
  useSetProfile,
  useTestProfile,
} from '~/design/screens/data/hooks';
import { ApiError } from '@resolve/api-client';

export function meta() {
  return [{ title: 'Settings · Resolve' }];
}

interface Draft {
  threshold: number;
  valueCap: string;
  mode: ExecutionMode;
  maxSteps: string;
}

const KIND_COPY: Record<AiProfileKind, { tone: 'success' | 'warning'; text: string }> = {
  onprem: {
    tone: 'success',
    text: 'Customer data stays inside your infrastructure.',
  },
  hosted: {
    tone: 'warning',
    text: 'Masked case data is sent to the model provider through AI Gateway.',
  },
};

function errorText(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong on our side. Try again.';
}

function digits(value: string) {
  return value.replace(/\D/g, '');
}

function groupDigits(value: string) {
  return digits(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function Settings() {
  const me = useMe();
  const profiles = useProfiles();
  const config = useConfig();
  const setProfile = useSetProfile();
  const testProfile = useTestProfile();
  const saveConfig = useSaveConfig();
  const isAdmin = me.data?.role === 'admin';

  const [confirmHosted, setConfirmHosted] = useState(false);
  const [test, setTest] = useState<{ ok: boolean; latency?: number; error?: string } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  const saved = useMemo<Draft | null>(
    () =>
      config.data
        ? {
            threshold: Math.round(config.data.confidenceThreshold * 100),
            valueCap: groupDigits(String(minorToNaira(config.data.valueCapMinor))),
            mode: config.data.executionMode,
            maxSteps: String(config.data.maxSteps),
          }
        : null,
    [config.data],
  );

  useEffect(() => {
    if (saved) setDraft(saved);
  }, [saved]);

  const active = profiles.data?.find((profile) => profile.active);
  const dirty = !!saved && !!draft && JSON.stringify(saved) !== JSON.stringify(draft);

  if (profiles.isLoading || config.isLoading || !draft || !saved) {
    if (profiles.isError || config.isError) {
      return (
        <>
          <PageHeader eyebrow="Settings" title="Where cases run, and when they close themselves." />
          <ErrorCard
            title="Couldn't load settings"
            onRetry={() => {
              void profiles.refetch();
              void config.refetch();
            }}
          />
        </>
      );
    }
    return (
      <>
        <PageHeader
          eyebrow="Settings"
          title="Where cases run, and when they close themselves."
          subtitle="The AI model and the auto-resolve policy."
        />
        <div className="flex max-w-3xl flex-col gap-6">
          <SkeletonCard className="h-56" />
          <SkeletonCard className="h-96" />
        </div>
      </>
    );
  }

  const choose = (name: string) => {
    if (name === active?.name) return;
    if (name === 'hosted') {
      setConfirmHosted(true);
      return;
    }
    switchTo(name);
  };

  const switchTo = (name: string) =>
    setProfile.mutate(name, {
      onSuccess: () => {
        setConfirmHosted(false);
        setTest(null);
        toast.success(
          name === 'hosted' ? 'Switched to the hosted model.' : 'Switched to the on-premise model.',
        );
      },
      onError: (error) => toast.error(errorText(error)),
    });

  const runTest = () => {
    if (!active) return;
    testProfile.mutate(active.name, {
      onSuccess: (result) =>
        setTest({ ok: result.ok, latency: result.latencyMs, error: result.error }),
      onError: (error) => setTest({ ok: false, error: errorText(error) }),
    });
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Draft, string>> = {};
    if (Number(digits(draft.valueCap)) <= 0) next.valueCap = 'Enter an amount above zero.';
    const steps = Number(draft.maxSteps);
    if (!Number.isInteger(steps) || steps < 3 || steps > 15)
      next.maxSteps = 'Use a whole number from 3 to 15.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    saveConfig.mutate(
      {
        confidenceThreshold: draft.threshold / 100,
        valueCapMinor: nairaToMinor(Number(digits(draft.valueCap))),
        executionMode: draft.mode,
        maxSteps: Number(draft.maxSteps),
      },
      {
        onSuccess: () => toast.success('Policy saved. It applies to new investigations.'),
        onError: (error) => toast.error(errorText(error)),
      },
    );
  };

  const copy = active ? KIND_COPY[active.kind] : null;

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Where cases run, and when they close themselves."
        subtitle="The AI model and the auto-resolve policy."
      />
      <div className="flex max-w-3xl flex-col gap-6 pb-24">
        {!isAdmin ? (
          <Banner variant="info">
            <span className="inline-flex items-center gap-2">
              <AppIcon name="common.shield_check" size={16} />
              You can view these settings. Only admins can change them.
            </span>
          </Banner>
        ) : null}

        <SectionCard title="AI model" description="Where should investigations run?">
          <div className="flex flex-col gap-5">
            <SegmentedControl
              label="Model location"
              disabled={!isAdmin || setProfile.isPending}
              options={(profiles.data ?? []).map((profile) => ({
                value: profile.name,
                label: profile.label,
                icon:
                  profile.kind === 'onprem'
                    ? ('provider.onprem' as const)
                    : ('provider.hosted' as const),
              }))}
              value={active?.name ?? ''}
              onChange={choose}
            />
            {active && copy ? (
              <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      copy.tone === 'success'
                        ? 'bg-success-soft text-success'
                        : 'bg-warning-soft text-warning',
                    )}
                  >
                    <AppIcon
                      name={active.kind === 'onprem' ? 'provider.onprem' : 'provider.hosted'}
                      size={20}
                    />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-h3">
                      {active.label} · {active.model}
                    </h3>
                    <p className="text-small text-text-2">{copy.text}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 text-small">
                  <dt className="text-text-3">Endpoint</dt>
                  <dd className="font-mono text-code text-text">{active.endpoint}</dd>
                  <dt className="text-text-3">API key</dt>
                  <dd className="text-text">Set on the server. Never shown here.</dd>
                  <dt className="text-text-3">Last test</dt>
                  <dd className="text-text">
                    {test === null ? (
                      <span className="text-text-3">Not run yet</span>
                    ) : test.ok ? (
                      <span className="tabular inline-flex items-center gap-1.5 text-success">
                        <AppIcon name="common.check" size={16} />
                        {test.latency} ms
                      </span>
                    ) : (
                      <span className="text-danger">{test.error}</span>
                    )}
                  </dd>
                </dl>
                {isAdmin ? (
                  <Button
                    className="w-fit"
                    loading={testProfile.isPending}
                    loadingLabel="Testing…"
                    onClick={runTest}
                  >
                    Test connection
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Auto-resolve policy" description="Applies to every new investigation.">
          <fieldset disabled={!isAdmin} className="flex flex-col gap-6 disabled:opacity-80">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-small">
                <span className="text-text-2">Confidence threshold</span>
                <span className="tabular text-text">{draft.threshold}%</span>
              </div>
              <Slider
                aria-label="Confidence threshold"
                min={50}
                max={100}
                step={1}
                disabled={!isAdmin}
                value={[draft.threshold]}
                onValueChange={([value]) =>
                  setDraft({ ...draft, threshold: value ?? draft.threshold })
                }
              />
              <p className="text-small text-text-3">
                The agent resolves a case on its own only at or above this confidence.
              </p>
            </div>

            <Field
              label="Value limit"
              hint="Cases above this amount always go to a person."
              error={errors.valueCap}
            >
              {({ id, describedBy, invalid }) => (
                <div className="relative w-56">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-small text-text-3">
                    ₦
                  </span>
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    inputMode="numeric"
                    value={draft.valueCap}
                    onChange={(event) =>
                      setDraft({ ...draft, valueCap: groupDigits(event.target.value) })
                    }
                    className="tabular pl-7"
                  />
                </div>
              )}
            </Field>

            <div className="flex flex-col gap-2">
              <span className="text-caption text-text-2">Execution</span>
              <RadioGroup
                aria-label="Execution mode"
                value={draft.mode}
                onValueChange={(mode) => setDraft({ ...draft, mode: mode as ExecutionMode })}
                disabled={!isAdmin}
              >
                <RadioItem id="mode-execute" value="execute" label="Execute resolutions" />
                <RadioItem id="mode-recommend" value="recommend_only" label="Recommend only" />
              </RadioGroup>
            </div>

            <Field
              label="Agent step limit"
              hint="How many steps the agent may take before it must decide."
              error={errors.maxSteps}
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  inputMode="numeric"
                  value={draft.maxSteps}
                  onChange={(event) =>
                    setDraft({ ...draft, maxSteps: digits(event.target.value).slice(0, 2) })
                  }
                  className="tabular w-24"
                />
              )}
            </Field>
          </fieldset>
        </SectionCard>
      </div>

      {dirty && isAdmin ? (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="fixed bottom-6 left-1/2 z-30 flex w-[min(36rem,calc(100%-3rem))] -translate-x-1/2 animate-rise items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-3 shadow-pop"
        >
          <span className="text-small text-text">You have unsaved changes.</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={saveConfig.isPending}
              onClick={() => {
                setDraft(saved);
                setErrors({});
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              loading={saveConfig.isPending}
              loadingLabel="Saving…"
              onClick={save}
            >
              Save changes
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={confirmHosted}
        onOpenChange={setConfirmHosted}
        tone="warning"
        size="sm"
        title="Switch to a hosted model?"
        description="Masked case data will be sent to the model provider through AI Gateway."
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmHosted(false)}
              disabled={setProfile.isPending}
            >
              Keep on-premise
            </Button>
            <Button
              variant="primary"
              loading={setProfile.isPending}
              loadingLabel="Switching…"
              onClick={() => switchTo('hosted')}
            >
              Switch to hosted
            </Button>
          </>
        }
      />
    </>
  );
}
