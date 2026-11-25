import type {
  AgentOutcome,
  AnalystAction,
  ClassifiedType,
  DisputeStatus,
  PolicyReasonCode,
  RecommendedAction,
  RiskLevel,
  StaffRole,
} from '@resolve/shared';
import type { IconKey } from './icons';

export const STATUS_LABELS: Record<DisputeStatus, string> = {
  queued: 'Queued',
  investigating: 'Investigating',
  awaiting_review: 'Needs review',
  escalated: 'Escalated',
  resolved: 'Resolved',
  rejected: 'Rejected',
  failed: 'Failed',
};

export const TYPE_LABELS: Record<ClassifiedType, string> = {
  failed_transfer_debit: 'Failed transfer',
  duplicate_charge: 'Duplicate charge',
  unauthorised_payment: 'Unauthorised',
  merchant_non_delivery: 'Non-delivery',
  legitimate_transaction: 'Legitimate',
  unknown: 'Unknown',
};

export const TYPE_ICONS: Record<ClassifiedType, IconKey> = {
  failed_transfer_debit: 'type.failed_transfer',
  duplicate_charge: 'type.duplicate',
  unauthorised_payment: 'type.unauthorised',
  merchant_non_delivery: 'type.non_delivery',
  legitimate_transaction: 'type.legitimate',
  unknown: 'type.unknown',
};

export const ANALYST_ACTION_LABELS: Record<AnalystAction, string> = {
  approve: 'Approved',
  override: 'Overrode the agent',
  escalate: 'Escalated',
  edit_message: 'Edited the message',
  retry: 'Retried the investigation',
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

export const ROLE_SUMMARIES: Record<StaffRole, string> = {
  admin: 'Act on cases, change settings, use demo tools and manage the team.',
  analyst: 'Act on cases: approve, override, escalate and edit customer messages.',
  viewer: 'See cases, traces and the audit trail. Cannot act or change anything.',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
};

export const POLICY_REASON_SENTENCES: Record<PolicyReasonCode, string> = {
  evidence_validation_failed: 'Some cited evidence could not be verified.',
  fraud_suspected: 'The agent suspects fraud.',
  review_type: 'This dispute type always needs a person to decide.',
  above_value_cap: 'The amount is above the auto-resolve limit.',
  rejection_needs_confirmation: 'Rejections must be confirmed by an analyst.',
  agent_escalated: 'The agent chose to escalate.',
  low_confidence: 'Confidence is below the auto-resolve threshold.',
  type_not_auto_eligible: "This type isn't eligible for auto-resolution.",
  action_type_mismatch: "The recommended action doesn't match the dispute type.",
  insufficient_evidence: 'Not enough supporting evidence was gathered.',
  recommend_only_mode: 'The system is in recommend-only mode.',
  execution_blocked: 'The fix could not be applied automatically, so a person needs to check it.',
};

export function decisionHeadline(outcome: AgentOutcome, action: RecommendedAction): string {
  if (outcome === 'reject') return 'Reject the dispute';
  if (outcome === 'escalate' || action === 'manual_review') return 'Send for human review';
  if (action === 'refund_duplicate') return 'Refund the duplicate charge';
  if (action === 'reverse_debit') return 'Reverse the debit';
  return 'Take no action';
}
