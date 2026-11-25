// Mirrors packages/shared/src. The api can't import the TS-source package at
// runtime yet, so keep the two identical when either changes.

export const DISPUTE_REASON_CODES = [
  'unauthorised',
  'duplicate',
  'failed_transfer',
  'not_delivered',
  'other',
] as const;
export type DisputeReasonCode = (typeof DISPUTE_REASON_CODES)[number];

export const CLASSIFIED_TYPES = [
  'failed_transfer_debit',
  'duplicate_charge',
  'unauthorised_payment',
  'merchant_non_delivery',
  'legitimate_transaction',
  'unknown',
] as const;
export type ClassifiedType = (typeof CLASSIFIED_TYPES)[number];

export const DISPUTE_STATUSES = [
  'queued',
  'investigating',
  'awaiting_review',
  'resolved',
  'rejected',
  'escalated',
  'failed',
] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const OPEN_DISPUTE_STATUSES = [
  'queued',
  'investigating',
  'awaiting_review',
  'escalated',
  'failed',
] as const satisfies readonly DisputeStatus[];

export const FINAL_DISPUTE_STATUSES = [
  'resolved',
  'rejected',
] as const satisfies readonly DisputeStatus[];

export const RESOLUTION_ACTIONS = ['reverse_debit', 'refund_duplicate', 'none'] as const;
export type ResolutionAction = (typeof RESOLUTION_ACTIONS)[number];

export const RECOMMENDED_ACTIONS = [
  'reverse_debit',
  'refund_duplicate',
  'none',
  'manual_review',
] as const;
export type RecommendedAction = (typeof RECOMMENDED_ACTIONS)[number];

export const AGENT_OUTCOMES = ['auto_resolve', 'escalate', 'reject'] as const;
export type AgentOutcome = (typeof AGENT_OUTCOMES)[number];

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const POLICY_DISPOSITIONS = ['auto_resolve', 'needs_review'] as const;
export type PolicyDisposition = (typeof POLICY_DISPOSITIONS)[number];

export const POLICY_REASON_CODES = [
  'evidence_validation_failed',
  'fraud_suspected',
  'review_type',
  'above_value_cap',
  'rejection_needs_confirmation',
  'agent_escalated',
  'low_confidence',
  'type_not_auto_eligible',
  'action_type_mismatch',
  'insufficient_evidence',
  'recommend_only_mode',
  'execution_blocked',
] as const;
export type PolicyReasonCode = (typeof POLICY_REASON_CODES)[number];

export const EXECUTION_MODES = ['execute', 'recommend_only'] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const STAFF_ROLES = ['admin', 'analyst', 'viewer'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_STATUSES = ['invited', 'active', 'suspended'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export const PERMISSIONS = [
  'cases.view',
  'audit.view',
  'cases.act',
  'settings.edit',
  'demo.use',
  'team.manage',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  admin: ['cases.view', 'audit.view', 'cases.act', 'settings.edit', 'demo.use', 'team.manage'],
  analyst: ['cases.view', 'audit.view', 'cases.act'],
  viewer: ['cases.view', 'audit.view'],
};

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false;
}

export const SLA_HOURS = 72;
export const SLA_AT_RISK_HOURS = 12;
