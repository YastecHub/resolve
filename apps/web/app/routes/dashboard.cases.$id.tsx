import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { formatNaira, type ResolutionAction } from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import { ActionDialogsHost } from '~/components/case/action-dialogs-host';
import { EvidencePanel } from '~/components/case/evidence-panel';
import { MessageEditor } from '~/components/case/message-editor';
import { SummaryPanel } from '~/components/case/summary-panel';
import { TracePanel } from '~/components/case/trace-panel';
import { DecisionCard, type DecisionAction } from '~/components/decision-card';
import { Button, buttonStyles } from '~/components/ui/button';
import { CopyableId } from '~/components/ui/copyable-id';
import { EmptyState } from '~/components/ui/empty-state';
import { ErrorCard } from '~/components/ui/error-card';
import { SectionCard } from '~/components/ui/section-card';
import { SkeletonCard } from '~/components/ui/skeleton';
import { SlaRing } from '~/components/ui/sla-ring';
import { StatusPill } from '~/components/ui/status-pill';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { TYPE_LABELS } from '~/lib/labels';
import { ACTIONABLE, approveBlockedReason, toDecisionData, toResolution } from '~/lib/case-view';
import { paths } from '~/lib/paths';
import { useMediaQuery } from '~/lib/use-media-query';
import { usePermissions } from '~/lib/use-permissions';
import { fetchCaseFile } from '~/api/hooks';
import {
  useApprove,
  useConfig,
  useDispute,
  useEditMessage,
  useEscalate,
  useOverride,
  useRetry,
  useTrace,
  useVerify,
} from '~/api/hooks';
import { ApiError } from '@resolve/api-client';

export function meta() {
  return [{ title: 'Case · Resolve' }];
}

function errorText(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong on our side. Try again.';
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

export default function CaseDetail() {
  const { id = '' } = useParams();
  const wide = useMediaQuery('(min-width: 1100px)');
  const detail = useDispute(id);
  const trace = useTrace(id);
  const config = useConfig();
  const steps = trace.data?.steps ?? [];
  const done = trace.data?.done ?? false;
  const verify = useVerify(id, done && steps.length > 0);

  const recommendedReject = detail.data?.investigation?.outcome === 'reject';
  const approve = useApprove(id, recommendedReject ? 'rejected' : 'resolved');
  const override = useOverride(id);
  const escalate = useEscalate(id);
  const editMessage = useEditMessage(id);
  const retry = useRetry(id);

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [tab, setTab] = useState('investigation');
  const [exporting, setExporting] = useState(false);
  const highlightTimer = useRef<number>(0);

  const status = detail.data?.dispute.status;
  const permissions = usePermissions();
  const canAct = permissions.can('cases.act');
  const actionable = !!status && ACTIONABLE.has(status) && canAct;
  const inReview = !!status && ACTIONABLE.has(status);

  const jumpToStep = useCallback(
    (stepId: string) => {
      const scroll = () => {
        setHighlightedId(stepId);
        document
          .getElementById(`step-${stepId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.clearTimeout(highlightTimer.current);
        highlightTimer.current = window.setTimeout(() => setHighlightedId(null), 1300);
      };
      if (!wide && tab !== 'investigation') {
        setTab('investigation');
        window.setTimeout(scroll, 80);
      } else scroll();
    },
    [wide, tab],
  );

  const disabledReasons = useMemo(() => {
    if (!detail.data) return {};
    if (!canAct) {
      const reason = 'Your role can view cases but not act on them.';
      return { approve: reason, override: reason, escalate: reason };
    }
    return {
      approve: approveBlockedReason(detail.data),
      escalate: status === 'escalated' ? 'This case is already escalated.' : undefined,
    };
  }, [detail.data, status, canAct]);

  const pending: DecisionAction | null = approve.isPending
    ? 'approve'
    : override.isPending
      ? 'override'
      : escalate.isPending
        ? 'escalate'
        : null;

  const onAction = useCallback(
    (action: DecisionAction) => {
      if (action === 'approve') {
        if (disabledReasons.approve) return;
        approve.mutate(undefined, {
          onSuccess: () => toast.success('Done. The customer message is ready to send.'),
          onError: (error) => toast.error(errorText(error)),
        });
      } else if (action === 'override') setOverrideOpen(true);
      else if (!disabledReasons.escalate) setEscalateOpen(true);
    },
    [approve, disabledReasons.approve, disabledReasons.escalate],
  );

  useEffect(() => {
    if (!actionable) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const key = event.key.toLowerCase();
      if (key === 'a') onAction('approve');
      else if (key === 'o') onAction('override');
      else if (key === 'e') onAction('escalate');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actionable, onAction]);

  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);

  const exportCaseFile = async () => {
    setExporting(true);
    try {
      const file = await fetchCaseFile(id);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `case-${id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setExporting(false);
    }
  };

  if (detail.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-9" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[17.5rem_minmax(0,1fr)_18.75rem]">
          <SkeletonCard className="h-96" />
          <SkeletonCard className="h-96" />
          <SkeletonCard className="h-96" />
        </div>
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    const notFound = detail.error instanceof ApiError && detail.error.status === 404;
    return notFound ? (
      <div className="rounded-lg border border-border bg-surface shadow-card">
        <EmptyState
          icon="nav.cases"
          title="Case not found"
          description="It may have been removed, or the link is wrong."
          action={
            <Link to={paths.cases} className={buttonStyles({ variant: 'primary' })}>
              Back to cases
            </Link>
          }
        />
      </div>
    ) : (
      <ErrorCard
        title="Couldn't load this case"
        message={errorText(detail.error)}
        onRetry={() => void detail.refetch()}
        retrying={detail.isFetching}
      />
    );
  }

  const d = detail.data;
  const decision = toDecisionData(d, config.data?.confidenceThreshold ?? 0.9);
  const resolution = toResolution(d);
  const cardState =
    status === 'failed'
      ? 'failed'
      : status === 'queued' || status === 'investigating' || !decision
        ? 'investigating'
        : inReview
          ? 'needs_review'
          : 'resolved';
  const open = !['resolved', 'rejected'].includes(d.dispute.status);

  const decisionColumn = (
    <div className="flex min-w-0 flex-col gap-6">
      <DecisionCard
        state={cardState}
        decision={decision ?? undefined}
        resolution={resolution ?? undefined}
        disabledReasons={disabledReasons}
        pending={pending}
        onAction={onAction}
        onRetry={
          canAct
            ? () =>
                retry.mutate(undefined, {
                  onSuccess: () => toast.success('Investigation restarted.'),
                  onError: (error) => toast.error(errorText(error)),
                })
            : undefined
        }
        retrying={retry.isPending}
      />
      <SectionCard
        title="Reasoning trace"
        description={
          steps.length > 0 ? `${steps.length} ${steps.length === 1 ? 'step' : 'steps'}` : undefined
        }
        action={
          !done ? (
            <span className="inline-flex items-center gap-2 text-caption text-accent-text">
              <span
                className="size-1.5 animate-pulse-dot rounded-full bg-accent"
                aria-hidden="true"
              />
              Live
            </span>
          ) : null
        }
      >
        <TracePanel
          steps={steps}
          done={done}
          queued={status === 'queued'}
          highlightedId={highlightedId}
          verify={{ data: verify.data, isLoading: verify.isLoading, isError: verify.isError }}
        />
      </SectionCard>
    </div>
  );

  const sideColumn = (
    <div className="flex min-w-0 flex-col gap-6">
      <SectionCard title="Cited evidence" description="Click to jump to the step">
        <EvidencePanel
          evidence={d.investigation?.evidence ?? []}
          steps={steps}
          onJump={jumpToStep}
        />
      </SectionCard>
      <SectionCard title="Customer message" description="Plain English, no internal jargon">
        <MessageEditor
          message={d.investigation?.customerMessage ?? null}
          editable={actionable}
          saving={editMessage.isPending}
          onSave={(message) =>
            editMessage.mutate(message, {
              onSuccess: () => toast.success('Message saved.'),
              onError: (error) => toast.error(errorText(error)),
            })
          }
        />
      </SectionCard>
    </div>
  );

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to={paths.cases}
            className="inline-flex items-center gap-1 rounded-sm text-small text-text-2 transition-colors duration-fast ease-standard hover:text-text"
          >
            <AppIcon name="common.chevron" size={16} className="rotate-90" />
            Cases
          </Link>
          <CopyableId id={d.dispute.id} className="text-body" />
          <StatusPill status={d.dispute.status} resolvedBy={d.dispute.resolvedBy ?? undefined} />
          {open ? <SlaRing dueAt={d.dispute.slaDueAt} /> : null}
        </div>
        <Button loading={exporting} loadingLabel="Exporting…" onClick={() => void exportCaseFile()}>
          <AppIcon name="common.download" size={16} />
          Export case file
        </Button>
      </header>

      <section className="mb-8 flex max-w-4xl flex-col gap-3">
        <p className="eyebrow">
          Case ·{' '}
          {d.investigation?.classifiedType
            ? TYPE_LABELS[d.investigation.classifiedType]
            : 'Not classified yet'}
        </p>
        <h1 className="font-display text-lead font-bold">
          {d.customer.name} is disputing {formatNaira(d.transaction.amountMinor)}
          {(d.transaction.merchantName ?? d.transaction.counterpartyName)
            ? ` with ${d.transaction.merchantName ?? d.transaction.counterpartyName}`
            : ''}
          {(
            d.transaction.merchantName ??
            d.transaction.counterpartyName ??
            d.customer.name
          ).endsWith('.')
            ? ''
            : '.'}
        </h1>
        {d.dispute.customerNotes ? (
          <figure className="flex flex-col gap-1">
            <blockquote className="font-display text-h2 font-medium text-text-2 italic">
              “{d.dispute.customerNotes}”
            </blockquote>
            <figcaption className="eyebrow">In their words · not verified</figcaption>
          </figure>
        ) : null}
      </section>

      {wide ? (
        <div className="grid grid-cols-[17.5rem_minmax(0,1fr)_18.75rem] items-start gap-6 min-[1536px]:grid-cols-[20rem_minmax(0,1fr)_21.25rem]">
          <SummaryPanel detail={d} />
          {decisionColumn}
          {sideColumn}
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList label="Case sections">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="investigation">Investigation</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="pt-6">
            <SummaryPanel detail={d} />
          </TabsContent>
          <TabsContent value="investigation" className="pt-6">
            {decisionColumn}
          </TabsContent>
          <TabsContent value="evidence" className="pt-6">
            {sideColumn}
          </TabsContent>
        </Tabs>
      )}

      <ActionDialogsHost
        overrideOpen={overrideOpen}
        escalateOpen={escalateOpen}
        onOverrideOpenChange={setOverrideOpen}
        onEscalateOpenChange={setEscalateOpen}
        overridePending={override.isPending}
        escalatePending={escalate.isPending}
        overrideError={override.error ? errorText(override.error) : undefined}
        escalateError={escalate.error ? errorText(escalate.error) : undefined}
        onOverride={(body: { action: ResolutionAction; reason: string }) =>
          override.mutate(body, {
            onSuccess: () => {
              setOverrideOpen(false);
              toast.success('Done. The decision is recorded in the audit trail.');
            },
            onError: (error) => {
              if (error instanceof ApiError && error.status === 409) {
                setOverrideOpen(false);
                toast.error(error.message);
              }
            },
          })
        }
        onEscalate={(reason) =>
          escalate.mutate(reason, {
            onSuccess: () => {
              setEscalateOpen(false);
              toast.success('Sent to a senior analyst.');
            },
            onError: (error) => {
              if (error instanceof ApiError && error.status === 409) {
                setEscalateOpen(false);
                toast.error(error.message);
              }
            },
          })
        }
      />
    </>
  );
}
