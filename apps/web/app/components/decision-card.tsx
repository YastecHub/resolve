import type {
  AgentOutcome,
  AiProfileKind,
  ClassifiedType,
  PolicyReasonCode,
  RecommendedAction,
  RiskLevel,
} from '@resolve/shared';
import { AppIcon } from '~/components/app-icon';
import { ResolutionBlock, type ResolutionData } from '~/components/resolution-block';
import { Button } from '~/components/ui/button';
import { ConfidenceArc } from '~/components/ui/confidence-meter';
import { Kbd } from '~/components/ui/kbd';
import { RiskPill } from '~/components/ui/risk-pill';
import { Skeleton } from '~/components/ui/skeleton';
import { Tooltip } from '~/components/ui/tooltip';
import { TypeBadge } from '~/components/ui/type-badge';
import { decisionHeadline, POLICY_REASON_SENTENCES } from '~/lib/labels';
import { cn } from '~/lib/cn';

export interface DecisionData {
  outcome: AgentOutcome;
  action: RecommendedAction;
  type: ClassifiedType;
  confidence: number;
  threshold?: number;
  risk: RiskLevel;
  fraudSuspected: boolean;
  reasons: readonly PolicyReasonCode[];
  model: string;
  providerKind?: AiProfileKind;
  durationSeconds: number;
}

export type DecisionAction = 'approve' | 'override' | 'escalate';

interface DecisionCardProps {
  state: 'investigating' | 'needs_review' | 'resolved' | 'failed';
  decision?: DecisionData;
  resolution?: ResolutionData;
  disabledReasons?: Partial<Record<DecisionAction, string>>;
  pending?: DecisionAction | null;
  onAction?: (action: DecisionAction) => void;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface shadow-card',
        className,
      )}
    >
      <div aria-hidden="true" className="h-0.5 bg-(image:--ai-gradient)" />
      {children}
    </section>
  );
}

const LABELS: Record<DecisionAction, { label: string; loading: string; key: string }> = {
  approve: { label: 'Approve', loading: 'Approving…', key: 'A' },
  override: { label: 'Override', loading: 'Overriding…', key: 'O' },
  escalate: { label: 'Escalate', loading: 'Escalating…', key: 'E' },
};

export function DecisionCard({
  state,
  decision,
  resolution,
  disabledReasons = {},
  pending = null,
  onAction,
  onRetry,
  retrying = false,
  className,
}: DecisionCardProps) {
  if (state === 'failed') {
    return (
      <Frame className={className}>
        <div role="alert" className="flex flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <AppIcon name="trace.error" size={20} />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-h2">The investigation didn't finish</h2>
              <p className="text-small text-text-2">
                The model provider returned an error before the agent reached a decision. Retry to
                run it again.
              </p>
            </div>
          </div>
          {onRetry ? (
            <Button
              variant="primary"
              className="w-fit"
              loading={retrying}
              loadingLabel="Retrying…"
              onClick={onRetry}
            >
              Retry investigation
            </Button>
          ) : null}
        </div>
      </Frame>
    );
  }

  if (state === 'investigating' || !decision) {
    return (
      <Frame className={className}>
        <div role="status" className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 text-small text-text-2">
            <AppIcon name="common.sparkle" size={20} className="text-accent-text" />
            Agent is working. Steps appear as they happen.
          </div>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-6">
            <Skeleton className="h-14 w-24" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          </div>
        </div>
      </Frame>
    );
  }

  const wrap = (action: DecisionAction, button: React.ReactNode) => {
    const reason = disabledReasons[action];
    return reason ? (
      <Tooltip content={reason}>
        <span tabIndex={0} className="inline-flex">
          {button}
        </span>
      </Tooltip>
    ) : (
      button
    );
  };

  const actionButton = (action: DecisionAction, variant: 'primary' | 'secondary' | 'ghost') => {
    const { label, loading, key } = LABELS[action];
    return wrap(
      action,
      <Button
        variant={variant}
        disabled={Boolean(disabledReasons[action]) || (pending !== null && pending !== action)}
        loading={pending === action}
        loadingLabel={loading}
        onClick={() => onAction?.(action)}
      >
        {label}{' '}
        <Kbd
          className={
            variant === 'primary'
              ? 'border-transparent bg-accent-contrast/15 text-accent-contrast'
              : undefined
          }
        >
          {key}
        </Kbd>
      </Button>,
    );
  };

  return (
    <Frame className={className}>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2 text-small text-text-2">
          <AppIcon name="common.sparkle" size={20} className="text-accent-text" />
          Agent recommendation
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-h2">{decisionHeadline(decision.outcome, decision.action)}</h2>
          <div>
            <TypeBadge type={decision.type} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <ConfidenceArc value={decision.confidence} threshold={decision.threshold} />
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-small">
            <dt className="text-text-3">Recommended action</dt>
            <dd className="text-text capitalize">{decision.action.replace('_', ' ')}</dd>
            <dt className="text-text-3">Risk</dt>
            <dd>
              <RiskPill level={decision.risk} />
            </dd>
            {decision.fraudSuspected ? (
              <>
                <dt className="text-text-3">Fraud</dt>
                <dd className="flex items-center gap-1.5 text-danger">
                  <AppIcon name="common.shield_alert" size={16} />
                  Suspected
                </dd>
              </>
            ) : null}
          </dl>
        </div>
        {state === 'needs_review' && decision.reasons.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-md bg-surface-2 p-4">
            <h3 className="text-h3">Why this needs review</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-small text-text-2">
              {decision.reasons.map((reason) => (
                <li key={reason}>{POLICY_REASON_SENTENCES[reason]}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="text-caption text-text-3">
          Investigated by {decision.model} ·{' '}
          {decision.providerKind
            ? `${decision.providerKind === 'onprem' ? 'On-premise' : 'Hosted'} · `
            : ''}
          {decision.durationSeconds}s
        </p>
      </div>
      {state === 'resolved' && resolution ? <ResolutionBlock resolution={resolution} /> : null}
      {state === 'needs_review' ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface px-5 py-3">
          {actionButton('approve', 'primary')}
          {actionButton('override', 'secondary')}
          {actionButton('escalate', 'ghost')}
        </div>
      ) : null}
    </Frame>
  );
}
