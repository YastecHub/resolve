import type {
  AccessAction,
  AgentOutcome,
  AgentStepKind,
  AiProfileKind,
  AnalystAction,
  Channel,
  ClassifiedType,
  CustomerSegment,
  DisputeReasonCode,
  DisputeStatus,
  ExecutionMode,
  InvestigationStatus,
  PolicyDisposition,
  PolicyReasonCode,
  RecommendedAction,
  ResolutionAction,
  Resolver,
  RiskLevel,
  StaffRole,
  StaffStatus,
  TransactionStatus,
  TransactionType,
} from '@resolve/shared';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type DisputeSortField =
  'createdAt' | 'updatedAt' | 'slaDueAt' | 'amountMinor' | 'confidence' | 'priority';

export interface DisputeQuery {
  status?: DisputeStatus[];
  type?: ClassifiedType[];
  q?: string;
  sort?: DisputeSortField;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface DisputeListItem {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  transactionId: string;
  reasonCode: DisputeReasonCode;
  amountMinor: number;
  status: DisputeStatus;
  resolvedBy: Resolver | null;
  classifiedType: ClassifiedType | null;
  confidence: number | null;
  fraudSuspected: boolean;
  policyDisposition: PolicyDisposition | null;
  slaDueAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface DisputeSummary extends DisputeListItem {
  customerNotes: string | null;
  resolutionAction: ResolutionAction | null;
  resolvedAt: number | null;
}

export interface TransactionSummary {
  id: string;
  reference: string;
  type: TransactionType;
  channel: Channel;
  amountMinor: number;
  status: TransactionStatus;
  merchantName: string | null;
  counterpartyName: string | null;
  city: string;
  ipCountry: string;
  createdAt: number;
}

export interface CustomerSummary {
  id: string;
  name: string;
  segment: CustomerSegment;
  homeCity: string;
  accountAgeDays: number;
  riskProfile: RiskLevel;
}

export interface EvidenceItem {
  toolCallId: string;
  claim: string;
}

export interface InvestigationSummary {
  id: string;
  attempt: number;
  status: InvestigationStatus;
  profile: string;
  providerKind: AiProfileKind | null;
  model: string;
  outcome: AgentOutcome | null;
  confidence: number | null;
  riskLevel: RiskLevel | null;
  fraudSuspected: boolean;
  classifiedType: ClassifiedType | null;
  recommendedAction: RecommendedAction | null;
  reasoning: string | null;
  evidence: EvidenceItem[];
  customerMessage: string | null;
  policyDisposition: PolicyDisposition | null;
  policyReasons: PolicyReasonCode[];
  evidenceValid: boolean;
  stepsCount: number;
  startedAt: number;
  finishedAt: number | null;
}

export interface AnalystActionRow {
  id: string;
  actorEmail: string;
  action: AnalystAction;
  overrideAction: ResolutionAction | null;
  reason: string | null;
  createdAt: number;
}

export interface DisputeDetail {
  dispute: DisputeSummary;
  transaction: TransactionSummary;
  customer: CustomerSummary;
  investigation: InvestigationSummary | null;
  analystActions: AnalystActionRow[];
}

export interface TraceStepRow {
  id: string;
  seq: number;
  kind: AgentStepKind;
  toolName: string | null;
  title: string;
  summary: string;
  ok: boolean;
  input: unknown;
  output: unknown;
  latencyMs: number;
  prevHash: string;
  hash: string;
  createdAt: number;
}

export interface TraceResponse {
  investigation: InvestigationSummary | null;
  steps: TraceStepRow[];
  done: boolean;
}

export interface VerifyResponse {
  valid: boolean;
  checked: number;
  brokenAtSeq?: number;
}

export interface CaseFile extends DisputeDetail {
  steps: TraceStepRow[];
  chainVerification: VerifyResponse | null;
  generatedAt: number;
}

export interface Metrics {
  countsByStatus: Record<DisputeStatus, number>;
  resolvedCount: number;
  autoResolutionRate: number;
  reviewRate: number;
  overrideRate: number;
  avgInvestigationMs: number;
  p50InvestigationMs: number;
  p95InvestigationMs: number;
  sla: { atRisk: number; breached: number };
  throughputByHour: { hour: number; count: number }[];
  byType: { type: ClassifiedType; count: number }[];
  outcomesByType: { type: ClassifiedType; values: Record<string, number> }[];
  providerUsage: { profile: string; model: string; count: number; avgMs: number }[];
  oldestReviewAt: number | null;
}

export interface PolicyConfig {
  confidenceThreshold: number;
  valueCapMinor: number;
  executionMode: ExecutionMode;
  maxSteps: number;
}

export interface AiProfile {
  name: string;
  label: string;
  kind: AiProfileKind;
  model: string;
  endpoint: string;
  active: boolean;
}

export interface AiProfileTestResult {
  ok: boolean;
  latencyMs: number;
  model: string;
  error?: string;
}

export interface InvestigationAuditRow {
  id: string;
  disputeId: string;
  model: string;
  profile: string;
  providerKind: AiProfileKind | null;
  stepsCount: number;
  durationMs: number | null;
  status: InvestigationStatus;
  startedAt: number;
}

export interface AnalystActionAuditRow extends AnalystActionRow {
  disputeId: string;
}

export interface MeResponse {
  email: string;
  name: string;
  staffId: string;
  role: StaffRole;
  authMode: 'dev' | 'access';
  signedInAt: number | null;
}

export interface StaffMember {
  id: string;
  staffId: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  invitedBy: string | null;
  createdAt: number;
  lastSignInAt: number | null;
}

export interface InviteStaff {
  name: string;
  email: string;
  staffId: string;
  role: StaffRole;
}

export interface AccessEvent {
  id: string;
  actorEmail: string;
  action: AccessAction;
  targetEmail: string;
  detail: string | null;
  createdAt: number;
}

export interface DemoSubmitResult {
  created: number;
  disputeIds: string[];
  remaining: number;
}

export interface EvalRow {
  demoCaseId: string;
  disputeId: string;
  scenario: string;
  status: DisputeStatus;
  pending: boolean;
  expectedType: ClassifiedType;
  actualType: ClassifiedType | null;
  expectedDisposition: PolicyDisposition;
  actualDisposition: PolicyDisposition | null;
  typeMatch: boolean;
  dispositionMatch: boolean;
  match: boolean;
  evidenceValid: boolean | null;
  durationMs: number | null;
}

export interface EvalResponse {
  rows: EvalRow[];
  accuracy: number;
  summary: {
    totalCases: number;
    submitted: number;
    pending: number;
    evaluated: number;
    classificationAccuracy: number;
    dispositionAccuracy: number;
    evidenceValidityRate: number;
    avgInvestigationMs: number;
    p95InvestigationMs: number;
    byScenario: {
      scenario: string;
      total: number;
      classificationAccuracy: number;
      dispositionAccuracy: number;
    }[];
    models: { profile: string; model: string; count: number }[];
  };
}
