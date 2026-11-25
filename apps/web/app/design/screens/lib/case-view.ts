import type { ResolutionAction } from '@resolve/shared';
import type { DecisionData } from '~/components/decision-card';
import type { ResolutionData } from '~/components/resolution-block';
import type { TraceStepData } from '~/components/trace/trace-step';
import type { IconKey } from '~/lib/icons';
import { stepDetails } from '~/design/screens/lib/step-details';
import type { DisputeDetail, TraceStepRow } from '~/design/screens/data/types';

const TOOL_ICONS: Record<string, IconKey> = {
  getTransaction: 'trace.transaction',
  getLedgerEntries: 'trace.ledger',
  getSettlementStatus: 'trace.settlement',
  getDeviceAndLocation: 'trace.device',
  getCustomerProfile: 'trace.customer',
  getCustomerHistory: 'trace.customer',
  getMerchantInfo: 'trace.merchant',
  findRelatedTransactions: 'trace.related',
};

const TOOL_LABELS: Record<string, string> = {
  getTransaction: 'Transaction',
  getLedgerEntries: 'Ledger',
  getSettlementStatus: 'Settlement',
  getDeviceAndLocation: 'Device',
  getCustomerProfile: 'Profile',
  getCustomerHistory: 'History',
  getMerchantInfo: 'Merchant',
  findRelatedTransactions: 'Related',
  submitDecision: 'Decision',
};

export function toolIcon(tool: string | null): IconKey {
  return (tool && TOOL_ICONS[tool]) || 'trace.transaction';
}

export function toolLabel(tool: string | null): string {
  return (tool && TOOL_LABELS[tool]) || 'Step';
}

export function toTraceStep(row: TraceStepRow): TraceStepData {
  const kind =
    row.kind === 'model'
      ? 'model'
      : !row.ok
        ? 'error'
        : row.toolName === 'submit_decision'
          ? 'decision'
          : 'tool';
  return {
    id: row.id,
    kind,
    title:
      row.kind === 'model'
        ? 'Model'
        : row.toolName === 'submit_decision'
          ? 'Decision submitted'
          : row.title,
    summary: row.summary,
    icon: toolIcon(row.toolName),
    durationMs: row.kind === 'model' ? undefined : row.latencyMs,
    details: row.kind === 'tool' ? stepDetails(row.output, row.ok) : undefined,
    raw: row.output,
  };
}

export function toDecisionData(detail: DisputeDetail, threshold: number): DecisionData | null {
  const inv = detail.investigation;
  if (
    !inv ||
    inv.status !== 'completed' ||
    !inv.outcome ||
    !inv.classifiedType ||
    !inv.recommendedAction ||
    !inv.riskLevel
  ) {
    return null;
  }
  const finished = inv.finishedAt ?? inv.startedAt;
  return {
    outcome: inv.outcome,
    action: inv.recommendedAction,
    type: inv.classifiedType,
    confidence: inv.confidence ?? 0,
    threshold,
    risk: inv.riskLevel,
    fraudSuspected: inv.fraudSuspected,
    reasons: inv.policyReasons,
    model: inv.model,
    providerKind: inv.providerKind ?? undefined,
    durationSeconds: Math.max(0.1, Math.round(((finished - inv.startedAt) / 1000) * 10) / 10),
  };
}

const OUTCOME_COPY: Record<ResolutionAction, string> = {
  reverse_debit: 'Debit reversed. The customer message is ready to send.',
  refund_duplicate: 'Duplicate charge refunded. The customer message is ready to send.',
  none: 'Dispute rejected. The customer is told the transaction stands.',
};

export function toResolution(detail: DisputeDetail): ResolutionData | null {
  const { dispute } = detail;
  if (!dispute.resolvedBy || !dispute.resolvedAt || !dispute.resolutionAction) return null;
  const last = [...detail.analystActions]
    .reverse()
    .find((action) => action.action === 'approve' || action.action === 'override');
  return {
    outcome: OUTCOME_COPY[dispute.resolutionAction],
    resolvedBy: dispute.resolvedBy,
    actor: last?.actorEmail,
    at: dispute.resolvedAt,
    overridden: last?.action === 'override',
    reason: last?.action === 'override' ? (last.reason ?? undefined) : undefined,
  };
}

export const ACTIONABLE = new Set(['awaiting_review', 'escalated']);

export function approveBlockedReason(detail: DisputeDetail): string | undefined {
  const inv = detail.investigation;
  if (!inv?.recommendedAction) return 'There is no recommendation to approve yet.';
  if (
    inv.outcome !== 'reject' &&
    (inv.recommendedAction === 'manual_review' || inv.recommendedAction === 'none')
  ) {
    return "The agent didn't recommend an action to apply. Override or escalate instead.";
  }
  return undefined;
}
