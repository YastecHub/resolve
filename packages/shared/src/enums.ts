export const CUSTOMER_SEGMENTS = ['retail', 'sme'] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const TRANSACTION_TYPES = ['card_payment', 'transfer', 'pos', 'web'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CHANNELS = ['mobile', 'web', 'pos', 'atm', 'ussd'] as const;
export type Channel = (typeof CHANNELS)[number];

export const TRANSACTION_STATUSES = ['successful', 'failed', 'pending', 'reversed'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const LEDGER_ENTRY_TYPES = ['debit', 'credit', 'reversal', 'refund'] as const;
export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[number];

export const SETTLEMENT_STATUSES = ['settled', 'failed', 'pending', 'not_applicable'] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

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

export const TERMINAL_DISPUTE_STATUSES = ['resolved', 'rejected', 'failed'] as const;

export const RESOLUTION_ACTIONS = ['reverse_debit', 'refund_duplicate', 'none'] as const;
export type ResolutionAction = (typeof RESOLUTION_ACTIONS)[number];

export const RESOLVERS = ['agent', 'analyst'] as const;
export type Resolver = (typeof RESOLVERS)[number];

export const INVESTIGATION_STATUSES = ['running', 'completed', 'failed'] as const;
export type InvestigationStatus = (typeof INVESTIGATION_STATUSES)[number];

export const AGENT_OUTCOMES = ['auto_resolve', 'escalate', 'reject'] as const;
export type AgentOutcome = (typeof AGENT_OUTCOMES)[number];

export const RECOMMENDED_ACTIONS = [
  'reverse_debit',
  'refund_duplicate',
  'none',
  'manual_review',
] as const;
export type RecommendedAction = (typeof RECOMMENDED_ACTIONS)[number];

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

export const AGENT_STEP_KINDS = ['model', 'tool', 'system'] as const;
export type AgentStepKind = (typeof AGENT_STEP_KINDS)[number];

export const ANALYST_ACTIONS = [
  'approve',
  'override',
  'escalate',
  'edit_message',
  'retry',
] as const;
export type AnalystAction = (typeof ANALYST_ACTIONS)[number];

export const EXPECTED_DISPOSITIONS = POLICY_DISPOSITIONS;

export const AI_PROFILE_KINDS = ['hosted', 'onprem'] as const;
export type AiProfileKind = (typeof AI_PROFILE_KINDS)[number];

export const ID_PREFIXES = {
  customer: 'cus_',
  merchant: 'mer_',
  device: 'dev_',
  transaction: 'txn_',
  ledgerEntry: 'led_',
  settlement: 'stl_',
  dispute: 'dsp_',
  investigation: 'inv_',
  step: 'stp_',
  analystAction: 'act_',
  demoCase: 'dmo_',
  staff: 'usr_',
  accessEvent: 'acc_',
} as const;
export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];

export const ACCESS_ACTIONS = [
  'invited',
  'role_changed',
  'suspended',
  'reinstated',
  'first_sign_in',
  'demo_reset',
] as const;
export type AccessAction = (typeof ACCESS_ACTIONS)[number];
