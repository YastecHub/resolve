import {
  SLA_AT_RISK_HOURS,
  SLA_HOURS,
  MS_PER_HOUR,
  type ClassifiedType,
  type DisputeReasonCode,
  type DisputeStatus,
  type PolicyReasonCode,
  type RecommendedAction,
  type ResolutionAction,
  type StaffRole,
} from '@resolve/shared';
import { ApiError } from '@resolve/api-client';
import type {
  AccessEvent,
  AiProfile,
  AiProfileTestResult,
  AnalystActionAuditRow,
  AnalystActionRow,
  CaseFile,
  CustomerSummary,
  DemoSubmitResult,
  DisputeDetail,
  DisputeListItem,
  DisputeQuery,
  DisputeSummary,
  EvalResponse,
  InvestigationAuditRow,
  InvestigationSummary,
  InviteStaff,
  MeResponse,
  Metrics,
  Page,
  PolicyConfig,
  StaffMember,
  TraceResponse,
  TraceStepRow,
  TransactionSummary,
  VerifyResponse,
} from './types';

const MINUTE = 60_000;
const BOOT = Date.now();
const LIVE_STEP_MS = 2_400;

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = seeded(2026);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}

function fakeHash(input: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  let out = '';
  for (let round = 0; round < 8; round++) {
    for (let i = 0; i < input.length; i++) {
      a = Math.imul(a ^ input.charCodeAt(i), 16777619) >>> 0;
      b = Math.imul(b + input.charCodeAt(i) + round, 2246822519) >>> 0;
    }
    out += (a ^ b).toString(16).padStart(8, '0');
  }
  return out;
}

let idCounter = 1000;
function newId(prefix: string) {
  idCounter += 1;
  return `${prefix}01JD${idCounter.toString(36).toUpperCase().padStart(8, '0')}`;
}

const FIRST = [
  'Funke',
  'Tunde',
  'Chioma',
  'Ibrahim',
  'Ada',
  'Segun',
  'Ngozi',
  'Bola',
  'Emeka',
  'Aisha',
  'Kemi',
  'Yusuf',
];
const LAST = [
  'Adeyemi',
  'Bakare',
  'Eze',
  'Musa',
  'Okafor',
  'Ogunleye',
  'Nwosu',
  'Salami',
  'Obi',
  'Bello',
  'Coker',
  'Danjuma',
];
const CITIES = ['Abeokuta', 'Ijebu-Ode', 'Sagamu', 'Ota', 'Lagos', 'Ibadan', 'Abuja'];
const MERCHANTS = [
  'Shoprite Abeokuta',
  'Jumia',
  'Konga',
  'Eventbrite',
  'MTN Data',
  'Bolt',
  'Chicken Republic',
  'QuickGadgets NG',
];

interface Bundle {
  detail: DisputeDetail;
  steps: TraceStepRow[];
  live: boolean;
}

const store = new Map<string, Bundle>();
const actionsLog: AnalystActionAuditRow[] = [];
const accessLog: AccessEvent[] = [];

const TOOL_TITLES: Record<string, string> = {
  get_transaction: 'Get transaction',
  get_ledger_entries: 'Get ledger entries',
  get_settlement_status: 'Get settlement status',
  get_device_and_location: 'Get device and location',
  get_customer_profile: 'Get customer profile',
  get_customer_history: 'Get customer history',
  get_merchant_info: 'Get merchant info',
  find_related_transactions: 'Find related transactions',
};

interface Scenario {
  type: ClassifiedType;
  reason: DisputeReasonCode;
  notes: string;
  tools: { name: string; summary: string; output: Record<string, unknown> }[];
  outcome: InvestigationSummary['outcome'];
  action: RecommendedAction;
  confidence: number;
  fraud: boolean;
  risk: InvestigationSummary['riskLevel'];
  reasoning: string;
  message: string;
}

function scenarioFor(type: ClassifiedType, amount: number): Scenario {
  const naira = `₦${(amount / 100).toLocaleString('en-NG')}`;
  switch (type) {
    case 'failed_transfer_debit':
      return {
        type,
        reason: 'failed_transfer',
        notes: `I sent ${naira} to my supplier and he never got it. My account was debited.`,
        tools: [
          {
            name: 'get_transaction',
            summary: `Transfer of ${naira} to ****8812, mobile, Abeokuta`,
            output: { type: 'transfer', status: 'pending' },
          },
          {
            name: 'get_ledger_entries',
            summary: 'One debit posted, no credit or reversal',
            output: { entries: [{ entry_type: 'debit' }] },
          },
          {
            name: 'get_settlement_status',
            summary: 'Settlement failed: beneficiary bank timeout, 182 minutes ago',
            output: {
              status: 'failed',
              failure_reason: 'beneficiary bank timeout',
              age_minutes: 182,
            },
          },
          {
            name: 'get_customer_profile',
            summary: 'Retail, 4 years, low risk, no disputes in 90 days',
            output: { risk_profile: 'low', dispute_count_90d: 0 },
          },
        ],
        outcome: 'auto_resolve',
        action: 'reverse_debit',
        confidence: 0.96,
        fraud: false,
        risk: 'low',
        reasoning:
          'The transfer was debited (S2) but settlement failed with a beneficiary bank timeout (S3) and no reversal has been posted. The customer is long-standing and low risk (S4). This is a failed transfer with a debit, so the debit should be reversed.',
        message: `Hi, your transfer of ${naira} to ****8812 did not complete because the receiving bank timed out. We have reversed the debit, and the money is back in your account. Sorry for the trouble.`,
      };
    case 'duplicate_charge':
      return {
        type,
        reason: 'duplicate',
        notes: 'I was charged twice for the same order.',
        tools: [
          {
            name: 'get_transaction',
            summary: `Card payment of ${naira} at Jumia, web`,
            output: { type: 'card_payment', status: 'successful' },
          },
          {
            name: 'find_related_transactions',
            summary: 'Same amount at the same merchant 48 seconds earlier',
            output: { related: [{ same_amount: true, same_merchant: true, seconds_apart: 48 }] },
          },
          {
            name: 'get_ledger_entries',
            summary: 'Both payments debited and settled',
            output: { entries: [{ entry_type: 'debit' }] },
          },
        ],
        outcome: 'auto_resolve',
        action: 'refund_duplicate',
        confidence: 0.93,
        fraud: false,
        risk: 'low',
        reasoning:
          'Two successful payments of the same amount to the same merchant were made 48 seconds apart (S2), and both were debited and settled (S3). The later payment is a duplicate and should be refunded.',
        message: `Hi, you were charged ${naira} twice by the same merchant within a minute. We have refunded the second charge.`,
      };
    case 'unauthorised_payment':
      return {
        type,
        reason: 'unauthorised',
        notes: "I didn't make this payment. Please block my card.",
        tools: [
          {
            name: 'get_transaction',
            summary: `Web payment of ${naira} at QuickGadgets NG, IP in GH`,
            output: { ip_country: 'GH' },
          },
          {
            name: 'get_device_and_location',
            summary: 'New untrusted device first seen 3 hours ago; city does not match home',
            output: { device: { trusted: false }, city_matches_home: false },
          },
          {
            name: 'get_customer_profile',
            summary: 'Typical amount is ₦18,000; this is 9x higher',
            output: { typical_amount_minor: 1800000 },
          },
          {
            name: 'get_merchant_info',
            summary: 'First purchase from this merchant',
            output: { customer_prior_purchase_count: 0 },
          },
        ],
        outcome: 'escalate',
        action: 'manual_review',
        confidence: 0.88,
        fraud: true,
        risk: 'high',
        reasoning:
          'Four fraud signals: a foreign IP (S1), a new untrusted device in another city (S2), an amount nine times the customer’s typical spend (S3), and a first-time merchant (S4). This needs a person to review.',
        message:
          'Hi, we have flagged this payment for review because it does not match how you usually pay. An analyst will contact you shortly.',
      };
    case 'merchant_non_delivery':
      return {
        type,
        reason: 'not_delivered',
        notes: 'I paid for a phone two weeks ago and it never arrived.',
        tools: [
          {
            name: 'get_transaction',
            summary: `Web payment of ${naira} at QuickGadgets NG`,
            output: { status: 'successful' },
          },
          {
            name: 'get_merchant_info',
            summary: 'Merchant flagged; dispute rate 7.4%',
            output: { flagged: true, dispute_rate_bps: 740 },
          },
          {
            name: 'get_settlement_status',
            summary: 'Settled 14 days ago',
            output: { status: 'settled' },
          },
        ],
        outcome: 'escalate',
        action: 'manual_review',
        confidence: 0.81,
        fraud: false,
        risk: 'medium',
        reasoning:
          'The payment settled (S3) to a flagged merchant with a high dispute rate (S2). Non-delivery claims need a person to confirm with the merchant.',
        message:
          'Hi, we have opened a review with the merchant about your order. We will update you within 72 hours.',
      };
    case 'legitimate_transaction':
      return {
        type,
        reason: 'unauthorised',
        notes: "I don't recognise this charge.",
        tools: [
          {
            name: 'get_transaction',
            summary: `Card payment of ${naira} at Chicken Republic, Abeokuta`,
            output: { status: 'successful' },
          },
          {
            name: 'get_device_and_location',
            summary: 'Trusted device, home city',
            output: { device: { trusted: true }, city_matches_home: true },
          },
          {
            name: 'get_merchant_info',
            summary: '11 previous purchases from this merchant',
            output: { customer_prior_purchase_count: 11 },
          },
        ],
        outcome: 'reject',
        action: 'none',
        confidence: 0.91,
        fraud: false,
        risk: 'low',
        reasoning:
          'The payment was made from the customer’s trusted device in their home city (S2) at a merchant they have used eleven times (S3). It looks legitimate.',
        message:
          'Hi, this payment was made from your usual phone at a restaurant you visit often. If you still do not recognise it, reply and we will look again.',
      };
    default:
      return {
        type: 'unknown',
        reason: 'other',
        notes: 'Something is wrong with this transaction.',
        tools: [
          {
            name: 'get_transaction',
            summary: `Payment of ${naira}`,
            output: { status: 'pending' },
          },
        ],
        outcome: 'escalate',
        action: 'manual_review',
        confidence: 0.42,
        fraud: false,
        risk: 'medium',
        reasoning:
          'The evidence is incomplete and contradictory, so this needs a person to review.',
        message: 'Hi, we are looking into your complaint and will update you shortly.',
      };
  }
}

const AUTO_TYPES: ClassifiedType[] = ['failed_transfer_debit', 'duplicate_charge'];

let config: PolicyConfig = {
  confidenceThreshold: 0.9,
  valueCapMinor: 5_000_000,
  executionMode: 'execute',
  maxSteps: 8,
};

function policyFor(
  s: Scenario,
  amount: number,
): { disposition: 'auto_resolve' | 'needs_review'; reasons: PolicyReasonCode[] } {
  const reasons: PolicyReasonCode[] = [];
  if (s.fraud) reasons.push('fraud_suspected');
  if (
    s.type === 'unknown' ||
    s.type === 'unauthorised_payment' ||
    s.type === 'merchant_non_delivery'
  )
    reasons.push('review_type');
  if (amount > config.valueCapMinor) reasons.push('above_value_cap');
  if (s.outcome === 'reject') reasons.push('rejection_needs_confirmation');
  if (s.outcome === 'escalate') reasons.push('agent_escalated');
  if (s.confidence < config.confidenceThreshold) reasons.push('low_confidence');
  if (!AUTO_TYPES.includes(s.type)) reasons.push('type_not_auto_eligible');
  if (s.action === 'none' || s.action === 'manual_review') reasons.push('action_type_mismatch');
  if (config.executionMode === 'recommend_only') reasons.push('recommend_only_mode');
  return { disposition: reasons.length === 0 ? 'auto_resolve' : 'needs_review', reasons };
}

function buildSteps(investigationId: string, s: Scenario, startedAt: number): TraceStepRow[] {
  const steps: TraceStepRow[] = [];
  let prevHash = '0'.repeat(64);
  let t = startedAt;
  const push = (step: Omit<TraceStepRow, 'id' | 'seq' | 'prevHash' | 'hash' | 'createdAt'>) => {
    const seq = steps.length + 1;
    t += 900 + Math.round(rand() * 2_600);
    const hash = fakeHash(`${prevHash}|${seq}|${step.kind}|${step.toolName ?? ''}|${step.summary}`);
    steps.push({
      ...step,
      id: `stp_${investigationId.slice(4)}${seq.toString().padStart(2, '0')}`,
      seq,
      prevHash,
      hash,
      createdAt: t,
    });
    prevHash = hash;
  };
  push({
    kind: 'model',
    toolName: null,
    title: 'Model turn',
    summary: 'Started with the transaction',
    ok: true,
    input: {},
    output: { tool_calls: 1 },
    latencyMs: 2_100,
  });
  s.tools.forEach((tool, index) => {
    push({
      kind: 'tool',
      toolName: tool.name,
      title: TOOL_TITLES[tool.name] ?? tool.name,
      summary: tool.summary,
      ok: true,
      input: { transaction_id: 'txn_…' },
      output: { ok: true, data: tool.output },
      latencyMs: 30 + Math.round(rand() * 90),
    });
    if (index === 1) {
      push({
        kind: 'model',
        toolName: null,
        title: 'Model turn',
        summary: 'Checked the money trail; looking at context',
        ok: true,
        input: {},
        output: { tool_calls: s.tools.length - 2 },
        latencyMs: 3_400,
      });
    }
  });
  push({
    kind: 'model',
    toolName: null,
    title: 'Model turn',
    summary: 'Submitted the decision',
    ok: true,
    input: {},
    output: { submit_decision: true },
    latencyMs: 4_800,
  });
  return steps;
}

interface Seed {
  type: ClassifiedType;
  amount: number;
  status: DisputeStatus;
  ageHours: number;
  name?: string;
  live?: boolean;
}

function createBundle(seed: Seed): Bundle {
  const s = scenarioFor(seed.type, seed.amount);
  const disputeId = newId('dsp_');
  const txnId = newId('txn_');
  const cusId = newId('cus_');
  const invId = newId('inv_');
  const createdAt = BOOT - seed.ageHours * MS_PER_HOUR;
  const name = seed.name ?? `${pick(FIRST)} ${pick(LAST).charAt(0)}.`;
  const city = pick(CITIES);
  const policy = policyFor(s, seed.amount);
  const steps = buildSteps(invId, s, createdAt + 2_000);
  const evidence = steps
    .filter((step) => step.kind === 'tool')
    .slice(0, Math.max(2, s.tools.length - 1))
    .map((step) => ({ toolCallId: step.id, claim: step.summary }));
  const finishedAt = steps.at(-1)!.createdAt;
  const terminalByAgent = seed.status === 'resolved' && policy.disposition === 'auto_resolve';

  const dispute: DisputeSummary = {
    id: disputeId,
    reference: `TX-2026-${Math.floor(100000 + rand() * 899999)}`,
    customerId: cusId,
    customerName: name,
    transactionId: txnId,
    reasonCode: s.reason,
    amountMinor: seed.amount,
    status: seed.status,
    resolvedBy:
      seed.status === 'resolved' || seed.status === 'rejected'
        ? terminalByAgent
          ? 'agent'
          : 'analyst'
        : null,
    classifiedType: seed.status === 'queued' ? null : s.type,
    confidence: seed.status === 'queued' || seed.live ? null : s.confidence,
    fraudSuspected: s.fraud && seed.status !== 'queued',
    policyDisposition: seed.status === 'queued' || seed.live ? null : policy.disposition,
    slaDueAt: createdAt + SLA_HOURS * MS_PER_HOUR,
    createdAt,
    updatedAt: seed.status === 'queued' ? createdAt : finishedAt,
    customerNotes: s.notes,
    resolutionAction:
      seed.status === 'resolved'
        ? s.action === 'refund_duplicate'
          ? 'refund_duplicate'
          : 'reverse_debit'
        : seed.status === 'rejected'
          ? 'none'
          : null,
    resolvedAt:
      seed.status === 'resolved' || seed.status === 'rejected' ? finishedAt + MINUTE : null,
  };

  const transaction: TransactionSummary = {
    id: txnId,
    reference: dispute.reference,
    type:
      s.type === 'failed_transfer_debit'
        ? 'transfer'
        : s.type === 'duplicate_charge'
          ? 'card_payment'
          : 'web',
    channel: s.type === 'failed_transfer_debit' ? 'mobile' : 'web',
    amountMinor: seed.amount,
    status:
      dispute.resolutionAction && dispute.resolutionAction !== 'none'
        ? 'reversed'
        : s.type === 'failed_transfer_debit'
          ? 'pending'
          : 'successful',
    merchantName: s.type === 'failed_transfer_debit' ? null : pick(MERCHANTS),
    counterpartyName: s.type === 'failed_transfer_debit' ? 'Bola S.' : null,
    city,
    ipCountry: s.type === 'unauthorised_payment' ? 'GH' : 'NG',
    createdAt: createdAt - 3 * MS_PER_HOUR,
  };

  const customer: CustomerSummary = {
    id: cusId,
    name,
    segment: rand() > 0.7 ? 'sme' : 'retail',
    homeCity: s.type === 'unauthorised_payment' ? 'Abeokuta' : city,
    accountAgeDays: 200 + Math.floor(rand() * 2_400),
    riskProfile: s.type === 'unauthorised_payment' ? 'medium' : 'low',
  };

  const investigation: InvestigationSummary | null =
    seed.status === 'queued'
      ? null
      : {
          id: invId,
          attempt: 1,
          status: seed.live ? 'running' : seed.status === 'failed' ? 'failed' : 'completed',
          profile: 'hosted',
          providerKind: 'hosted',
          model: 'llama-3.3-70b',
          outcome: seed.live ? null : s.outcome,
          confidence: seed.live ? null : s.confidence,
          riskLevel: seed.live ? null : s.risk,
          fraudSuspected: seed.live ? false : s.fraud,
          classifiedType: seed.live ? null : s.type,
          recommendedAction: seed.live ? null : s.action,
          reasoning: seed.live ? null : s.reasoning,
          evidence: seed.live ? [] : evidence,
          customerMessage: seed.live ? null : s.message,
          policyDisposition: seed.live ? null : policy.disposition,
          policyReasons: seed.live ? [] : policy.reasons,
          evidenceValid: !seed.live,
          stepsCount: seed.live ? 0 : steps.length,
          startedAt: createdAt + 2_000,
          finishedAt: seed.live ? null : finishedAt,
        };

  const analystActions: AnalystActionRow[] = [];
  if (!terminalByAgent && (seed.status === 'resolved' || seed.status === 'rejected')) {
    const row: AnalystActionRow = {
      id: newId('act_'),
      actorEmail: 'ada.okafor@bank.example',
      action: seed.status === 'rejected' ? 'approve' : 'override',
      overrideAction: seed.status === 'rejected' ? null : 'reverse_debit',
      reason: seed.status === 'rejected' ? null : 'Merchant confirmed the order was never shipped.',
      createdAt: finishedAt + MINUTE,
    };
    analystActions.push(row);
    actionsLog.push({ ...row, disputeId });
  }
  if (seed.status === 'escalated') {
    const row: AnalystActionRow = {
      id: newId('act_'),
      actorEmail: 'ada.okafor@bank.example',
      action: 'escalate',
      overrideAction: null,
      reason: 'Large amount and the customer says the card is still with them.',
      createdAt: finishedAt + 5 * MINUTE,
    };
    analystActions.push(row);
    actionsLog.push({ ...row, disputeId });
  }

  return {
    detail: { dispute, transaction, customer, investigation, analystActions },
    steps,
    live: Boolean(seed.live),
  };
}

const SEEDS: Seed[] = [
  {
    type: 'failed_transfer_debit',
    amount: 4_000_000,
    status: 'investigating',
    ageHours: 0,
    name: 'Funke A.',
    live: true,
  },
  { type: 'unauthorised_payment', amount: 24_000_000, status: 'awaiting_review', ageHours: 30 },
  { type: 'merchant_non_delivery', amount: 3_850_000, status: 'awaiting_review', ageHours: 62 },
  { type: 'failed_transfer_debit', amount: 12_500_000, status: 'awaiting_review', ageHours: 5 },
  { type: 'legitimate_transaction', amount: 890_000, status: 'awaiting_review', ageHours: 14 },
  { type: 'unauthorised_payment', amount: 15_600_000, status: 'escalated', ageHours: 40 },
  { type: 'unknown', amount: 2_200_000, status: 'awaiting_review', ageHours: 66 },
  { type: 'duplicate_charge', amount: 890_000, status: 'queued', ageHours: 0.02 },
  { type: 'failed_transfer_debit', amount: 1_250_000, status: 'queued', ageHours: 0.01 },
  { type: 'failed_transfer_debit', amount: 3_500_000, status: 'failed', ageHours: 3 },
  ...Array.from({ length: 14 }, (_, i): Seed => ({
    type: i % 3 === 0 ? 'duplicate_charge' : 'failed_transfer_debit',
    amount: 300_000 + Math.round(rand() * 45) * 100_000,
    status: 'resolved',
    ageHours: 2 + i * 3.5,
  })),
  { type: 'merchant_non_delivery', amount: 5_400_000, status: 'resolved', ageHours: 80 },
  { type: 'legitimate_transaction', amount: 450_000, status: 'rejected', ageHours: 50 },
  { type: 'legitimate_transaction', amount: 1_200_000, status: 'rejected', ageHours: 90 },
];

for (const seed of SEEDS) {
  const bundle = createBundle(seed);
  store.set(bundle.detail.dispute.id, bundle);
}

export const LIVE_DISPUTE_ID = [...store.values()].find((b) => b.live)!.detail.dispute.id;
export const REVIEW_DISPUTE_ID = [...store.values()].find(
  (b) => b.detail.dispute.status === 'awaiting_review' && b.detail.dispute.fraudSuspected,
)!.detail.dispute.id;

function liveProgress(bundle: Bundle, now = Date.now()) {
  const started = bundle.detail.investigation?.startedAt ?? now;
  const revealed = Math.min(bundle.steps.length, Math.floor((now - BOOT) / LIVE_STEP_MS) + 1);
  if (revealed >= bundle.steps.length && bundle.live) {
    bundle.live = false;
    const s = scenarioFor(
      bundle.detail.dispute.classifiedType ?? 'failed_transfer_debit',
      bundle.detail.dispute.amountMinor,
    );
    const policy = policyFor(s, bundle.detail.dispute.amountMinor);
    const finished = now;
    const evidence = bundle.steps
      .filter((step) => step.kind === 'tool')
      .slice(0, 3)
      .map((step) => ({ toolCallId: step.id, claim: step.summary }));
    bundle.detail.investigation = {
      ...bundle.detail.investigation!,
      status: 'completed',
      outcome: s.outcome,
      confidence: s.confidence,
      riskLevel: s.risk,
      fraudSuspected: s.fraud,
      classifiedType: s.type,
      recommendedAction: s.action,
      reasoning: s.reasoning,
      evidence,
      customerMessage: s.message,
      policyDisposition: policy.disposition,
      policyReasons: policy.reasons,
      evidenceValid: true,
      stepsCount: bundle.steps.length,
      finishedAt: finished,
    };
    const auto = policy.disposition === 'auto_resolve';
    Object.assign(bundle.detail.dispute, {
      status: auto ? 'resolved' : 'awaiting_review',
      resolvedBy: auto ? 'agent' : null,
      resolutionAction: auto ? 'reverse_debit' : null,
      resolvedAt: auto ? finished : null,
      confidence: s.confidence,
      classifiedType: s.type,
      policyDisposition: policy.disposition,
      updatedAt: finished,
    } satisfies Partial<DisputeSummary>);
    bundle.detail.transaction.status = auto ? 'reversed' : bundle.detail.transaction.status;
  }
  void started;
  return bundle.live ? revealed : bundle.steps.length;
}

function visibleSteps(bundle: Bundle) {
  const count = liveProgress(bundle);
  return bundle.steps
    .slice(0, count)
    .map((step, index) =>
      bundle.live ? { ...step, createdAt: BOOT + index * LIVE_STEP_MS } : step,
    );
}

function requireBundle(id: string): Bundle {
  const bundle = store.get(id);
  if (!bundle) throw new ApiError(404, 'not_found', 'No dispute with that ID.');
  liveProgress(bundle);
  return bundle;
}

function wait<T>(value: T, ms = 220 + Math.round(Math.random() * 180)): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

function toListItem(summary: DisputeSummary): DisputeListItem {
  const { customerNotes: _n, resolutionAction: _r, resolvedAt: _a, ...item } = summary;
  void _n;
  void _r;
  void _a;
  return item;
}

const STATUS_PRIORITY: Record<DisputeStatus, number> = {
  awaiting_review: 0,
  escalated: 1,
  failed: 2,
  investigating: 3,
  queued: 4,
  resolved: 5,
  rejected: 6,
};

export function listDisputes(query: DisputeQuery): Promise<Page<DisputeListItem>> {
  for (const bundle of store.values()) liveProgress(bundle);
  const q = query.q?.trim().toLowerCase() ?? '';
  let items = [...store.values()]
    .map((b) => b.detail.dispute)
    .filter((d) => !query.status?.length || query.status.includes(d.status))
    .filter(
      (d) => !query.type?.length || (d.classifiedType && query.type.includes(d.classifiedType)),
    )
    .filter(
      (d) =>
        !q ||
        d.id.toLowerCase().includes(q) ||
        d.reference.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.customerId.toLowerCase().includes(q),
    );
  const sort = query.sort ?? 'priority';
  const dir = query.order === 'asc' ? 1 : -1;
  items = items.sort((a, b) => {
    if (sort === 'priority') {
      return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || a.slaDueAt - b.slaDueAt;
    }
    const av = (a[sort] ?? -1) as number;
    const bv = (b[sort] ?? -1) as number;
    return (av - bv) * dir;
  });
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;
  return wait({
    items: items.slice((page - 1) * pageSize, page * pageSize).map(toListItem),
    total: items.length,
    page,
    pageSize,
  });
}

export function getDispute(id: string): Promise<DisputeDetail> {
  return wait(requireBundle(id).detail);
}

export function getTrace(id: string, afterSeq = 0): Promise<TraceResponse> {
  const bundle = requireBundle(id);
  const steps = visibleSteps(bundle).filter((step) => step.seq > afterSeq);
  const status = bundle.detail.investigation?.status;
  return wait(
    {
      investigation: bundle.detail.investigation,
      steps,
      done: status === 'completed' || status === 'failed',
    },
    120,
  );
}

export function verifyChain(id: string): Promise<VerifyResponse> {
  const bundle = requireBundle(id);
  return wait({ valid: true, checked: visibleSteps(bundle).length }, 600);
}

export function getCaseFile(id: string): Promise<CaseFile> {
  const bundle = requireBundle(id);
  const steps = visibleSteps(bundle);
  return wait({
    ...bundle.detail,
    steps,
    chainVerification: { valid: true, checked: steps.length },
    generatedAt: Date.now(),
  });
}

const ME: MeResponse = {
  email: 'ada.okafor@bank.example',
  name: 'Ada Okafor',
  staffId: '100234',
  role: 'admin',
  authMode: 'dev',
  signedInAt: BOOT - 3 * MS_PER_HOUR,
};

export function getMe(): Promise<MeResponse> {
  return wait(ME, 120);
}

function record(id: string, row: Omit<AnalystActionRow, 'id' | 'createdAt' | 'actorEmail'>) {
  const bundle = requireBundle(id);
  const entry: AnalystActionRow = {
    ...row,
    id: newId('act_'),
    actorEmail: ME.email,
    createdAt: Date.now(),
  };
  bundle.detail.analystActions.push(entry);
  actionsLog.push({ ...entry, disputeId: id });
  bundle.detail.dispute.updatedAt = entry.createdAt;
  return bundle;
}

function requireStatus(bundle: Bundle, allowed: DisputeStatus[]) {
  const status = bundle.detail.dispute.status;
  if (!allowed.includes(status)) {
    throw new ApiError(409, 'invalid_state', 'This case changed while you were looking.', {
      details: { status },
    });
  }
}

function finish(bundle: Bundle, action: ResolutionAction, by: 'agent' | 'analyst') {
  const d = bundle.detail.dispute;
  d.status = action === 'none' ? 'rejected' : 'resolved';
  d.resolutionAction = action;
  d.resolvedBy = by;
  d.resolvedAt = Date.now();
  if (action !== 'none') bundle.detail.transaction.status = 'reversed';
}

export function approve(id: string, message?: string): Promise<DisputeDetail> {
  const bundle = requireBundle(id);
  requireStatus(bundle, ['awaiting_review', 'escalated']);
  const recommended = bundle.detail.investigation?.recommendedAction;
  if (recommended === 'manual_review') {
    throw new ApiError(409, 'invalid_state', 'Choose an action with Override.');
  }
  if (message && bundle.detail.investigation) bundle.detail.investigation.customerMessage = message;
  record(id, { action: 'approve', overrideAction: null, reason: null });
  finish(
    bundle,
    recommended === 'reverse_debit' || recommended === 'refund_duplicate' ? recommended : 'none',
    'analyst',
  );
  return wait(bundle.detail);
}

export function override(
  id: string,
  body: { action: ResolutionAction; reason: string; message?: string },
) {
  const bundle = requireBundle(id);
  requireStatus(bundle, ['awaiting_review', 'escalated']);
  if (body.message && bundle.detail.investigation)
    bundle.detail.investigation.customerMessage = body.message;
  record(id, { action: 'override', overrideAction: body.action, reason: body.reason });
  finish(bundle, body.action, 'analyst');
  return wait(bundle.detail);
}

export function escalate(id: string, reason: string): Promise<DisputeDetail> {
  const bundle = requireBundle(id);
  requireStatus(bundle, ['awaiting_review']);
  record(id, { action: 'escalate', overrideAction: null, reason });
  bundle.detail.dispute.status = 'escalated';
  return wait(bundle.detail);
}

export function editMessage(id: string, message: string): Promise<DisputeDetail> {
  const bundle = requireBundle(id);
  if (bundle.detail.investigation) bundle.detail.investigation.customerMessage = message;
  record(id, { action: 'edit_message', overrideAction: null, reason: null });
  return wait(bundle.detail);
}

export function retry(id: string): Promise<DisputeDetail> {
  const bundle = requireBundle(id);
  requireStatus(bundle, ['failed']);
  record(id, { action: 'retry', overrideAction: null, reason: null });
  bundle.detail.dispute.status = 'queued';
  return wait(bundle.detail);
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1] ?? 0;
}

export function getMetrics(): Promise<Metrics> {
  const now = Date.now();
  const all = [...store.values()].map((b) => {
    liveProgress(b, now);
    return b.detail;
  });
  const countsByStatus = {
    queued: 0,
    investigating: 0,
    awaiting_review: 0,
    resolved: 0,
    rejected: 0,
    escalated: 0,
    failed: 0,
  } as Record<DisputeStatus, number>;
  for (const d of all) countsByStatus[d.dispute.status] += 1;
  const terminal = all.filter(
    (d) => d.dispute.status === 'resolved' || d.dispute.status === 'rejected',
  );
  const byAgent = terminal.filter((d) => d.dispute.resolvedBy === 'agent').length;
  const durations = all
    .map((d) => d.investigation)
    .filter((i): i is InvestigationSummary => Boolean(i?.finishedAt))
    .map((i) => (i.finishedAt ?? 0) - i.startedAt)
    .sort((a, b) => a - b);
  const open = all.filter((d) => !['resolved', 'rejected'].includes(d.dispute.status));
  const hourNow = Math.floor(now / MS_PER_HOUR) * MS_PER_HOUR;
  const throughputByHour = Array.from({ length: 24 }, (_, i) => {
    const hour = hourNow - (23 - i) * MS_PER_HOUR;
    return {
      hour,
      count: all.filter((d) => {
        const f = d.investigation?.finishedAt;
        return f !== null && f !== undefined && f >= hour && f < hour + MS_PER_HOUR;
      }).length,
    };
  });
  const types = new Map<ClassifiedType, { count: number; auto: number; review: number }>();
  for (const d of all) {
    const t = d.dispute.classifiedType;
    if (!t) continue;
    const entry = types.get(t) ?? { count: 0, auto: 0, review: 0 };
    entry.count += 1;
    if (d.dispute.policyDisposition === 'auto_resolve') entry.auto += 1;
    if (d.dispute.policyDisposition === 'needs_review') entry.review += 1;
    types.set(t, entry);
  }
  const overrides = actionsLog.filter((a) => a.action === 'override').length;
  const analystResolved = terminal.filter((d) => d.dispute.resolvedBy === 'analyst').length;
  const reviews = all.filter((d) => ['awaiting_review', 'escalated'].includes(d.dispute.status));
  return wait({
    countsByStatus,
    resolvedCount: countsByStatus.resolved,
    autoResolutionRate: terminal.length ? byAgent / terminal.length : 0,
    reviewRate: durations.length ? (reviews.length + analystResolved) / durations.length : 0,
    overrideRate: analystResolved ? overrides / analystResolved : 0,
    avgInvestigationMs: durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0,
    p50InvestigationMs: percentile(durations, 50),
    p95InvestigationMs: percentile(durations, 95),
    sla: {
      atRisk: open.filter(
        (d) =>
          d.dispute.slaDueAt > now && d.dispute.slaDueAt - now < SLA_AT_RISK_HOURS * MS_PER_HOUR,
      ).length,
      breached: open.filter((d) => d.dispute.slaDueAt <= now).length,
    },
    throughputByHour,
    byType: [...types].map(([type, v]) => ({ type, count: v.count })),
    outcomesByType: [...types].map(([type, v]) => ({
      type,
      values: { auto_resolve: v.auto, needs_review: v.review },
    })),
    providerUsage: [
      {
        profile: 'hosted',
        model: 'llama-3.3-70b',
        count: durations.length,
        avgMs: percentile(durations, 50),
      },
    ],
    oldestReviewAt: reviews.length ? Math.min(...reviews.map((d) => d.dispute.updatedAt)) : null,
  });
}

let profiles: AiProfile[] = [
  {
    name: 'hosted',
    label: 'Hosted',
    kind: 'hosted',
    model: 'llama-3.3-70b',
    endpoint: 'gateway.ai.example/compat',
    active: true,
  },
  {
    name: 'onprem',
    label: 'On-premise',
    kind: 'onprem',
    model: 'qwen3.6',
    endpoint: 'ollama.internal:11434',
    active: false,
  },
];

export function getProfiles(): Promise<AiProfile[]> {
  return wait(profiles, 150);
}

export function setProfile(name: string): Promise<AiProfile[]> {
  profiles = profiles.map((p) => ({ ...p, active: p.name === name }));
  return wait(profiles);
}

export function testProfile(name: string): Promise<AiProfileTestResult> {
  const profile = profiles.find((p) => p.name === name);
  if (!profile) return Promise.reject(new ApiError(404, 'not_found', 'Unknown profile.'));
  return wait(
    { ok: true, latencyMs: 380 + Math.round(Math.random() * 120), model: profile.model },
    700,
  );
}

export function getConfig(): Promise<PolicyConfig> {
  return wait(config, 150);
}

export function saveConfig(update: Partial<PolicyConfig>): Promise<PolicyConfig> {
  config = { ...config, ...update };
  return wait(config);
}

export function listInvestigations(page = 1, pageSize = 25): Promise<Page<InvestigationAuditRow>> {
  const rows = [...store.values()]
    .map((b) => b.detail)
    .filter((d) => d.investigation)
    .map((d) => {
      const i = d.investigation!;
      return {
        id: i.id,
        disputeId: d.dispute.id,
        model: i.model,
        profile: i.profile,
        providerKind: i.providerKind,
        stepsCount: i.stepsCount,
        durationMs: i.finishedAt ? i.finishedAt - i.startedAt : null,
        status: i.status,
        startedAt: i.startedAt,
      } satisfies InvestigationAuditRow;
    })
    .sort((a, b) => b.startedAt - a.startedAt);
  return wait({
    items: rows.slice((page - 1) * pageSize, page * pageSize),
    total: rows.length,
    page,
    pageSize,
  });
}

export function listAnalystActions(page = 1, pageSize = 25): Promise<Page<AnalystActionAuditRow>> {
  const rows = [...actionsLog].sort((a, b) => b.createdAt - a.createdAt);
  return wait({
    items: rows.slice((page - 1) * pageSize, page * pageSize),
    total: rows.length,
    page,
    pageSize,
  });
}

let staff: StaffMember[] = [
  {
    id: 'usr_01',
    staffId: '100234',
    name: 'Ada Okafor',
    email: 'ada.okafor@bank.example',
    role: 'admin',
    status: 'active',
    invitedBy: null,
    createdAt: BOOT - 40 * 24 * MS_PER_HOUR,
    lastSignInAt: BOOT - 3 * MS_PER_HOUR,
  },
  {
    id: 'usr_02',
    staffId: '100871',
    name: 'Tunde Bakare',
    email: 'tunde.bakare@bank.example',
    role: 'analyst',
    status: 'active',
    invitedBy: 'ada.okafor@bank.example',
    createdAt: BOOT - 30 * 24 * MS_PER_HOUR,
    lastSignInAt: BOOT - 26 * MS_PER_HOUR,
  },
  {
    id: 'usr_03',
    staffId: '101442',
    name: 'Chioma Eze',
    email: 'chioma.eze@bank.example',
    role: 'analyst',
    status: 'active',
    invitedBy: 'ada.okafor@bank.example',
    createdAt: BOOT - 21 * 24 * MS_PER_HOUR,
    lastSignInAt: BOOT - 2 * MS_PER_HOUR,
  },
  {
    id: 'usr_04',
    staffId: '102007',
    name: 'Ibrahim Musa',
    email: 'ibrahim.musa@bank.example',
    role: 'viewer',
    status: 'invited',
    invitedBy: 'ada.okafor@bank.example',
    createdAt: BOOT - 2 * 24 * MS_PER_HOUR,
    lastSignInAt: null,
  },
  {
    id: 'usr_05',
    staffId: '099310',
    name: 'Kemi Coker',
    email: 'kemi.coker@bank.example',
    role: 'analyst',
    status: 'suspended',
    invitedBy: 'ada.okafor@bank.example',
    createdAt: BOOT - 90 * 24 * MS_PER_HOUR,
    lastSignInAt: BOOT - 20 * 24 * MS_PER_HOUR,
  },
];

accessLog.push(
  {
    id: 'acc_01',
    actorEmail: 'ada.okafor@bank.example',
    action: 'invited',
    targetEmail: 'ibrahim.musa@bank.example',
    detail: 'viewer',
    createdAt: BOOT - 2 * 24 * MS_PER_HOUR,
  },
  {
    id: 'acc_02',
    actorEmail: 'ada.okafor@bank.example',
    action: 'suspended',
    targetEmail: 'kemi.coker@bank.example',
    detail: null,
    createdAt: BOOT - 5 * 24 * MS_PER_HOUR,
  },
  {
    id: 'acc_03',
    actorEmail: 'chioma.eze@bank.example',
    action: 'first_sign_in',
    targetEmail: 'chioma.eze@bank.example',
    detail: null,
    createdAt: BOOT - 21 * 24 * MS_PER_HOUR,
  },
);

export function getTeam(): Promise<StaffMember[]> {
  return wait(staff, 200);
}

export function inviteStaff(body: InviteStaff): Promise<StaffMember> {
  if (staff.some((s) => s.email === body.email.toLowerCase())) {
    return Promise.reject(
      new ApiError(409, 'conflict', 'Someone with that email is already on the team.', {
        details: { field: 'email' },
      }),
    );
  }
  if (staff.some((s) => s.staffId === body.staffId)) {
    return Promise.reject(
      new ApiError(409, 'conflict', 'That staff ID is already in use.', {
        details: { field: 'staffId' },
      }),
    );
  }
  const member: StaffMember = {
    id: newId('usr_'),
    staffId: body.staffId,
    name: body.name,
    email: body.email.toLowerCase(),
    role: body.role,
    status: 'invited',
    invitedBy: ME.email,
    createdAt: Date.now(),
    lastSignInAt: null,
  };
  staff = [...staff, member];
  accessLog.push({
    id: newId('acc_'),
    actorEmail: ME.email,
    action: 'invited',
    targetEmail: member.email,
    detail: body.role,
    createdAt: Date.now(),
  });
  return wait(member);
}

function updateStaff(id: string, change: { role?: StaffRole; status?: 'suspended' | 'active' }) {
  const target = staff.find((s) => s.id === id);
  if (!target) return Promise.reject(new ApiError(404, 'not_found', 'No one with that ID.'));
  if (target.email === ME.email) {
    return Promise.reject(new ApiError(409, 'self_change', "You can't change your own access."));
  }
  const admins = staff.filter((s) => s.role === 'admin' && s.status === 'active').length;
  const removesAdmin =
    target.role === 'admin' &&
    target.status === 'active' &&
    ((change.role && change.role !== 'admin') || change.status === 'suspended');
  if (removesAdmin && admins <= 1) {
    return Promise.reject(
      new ApiError(409, 'last_admin', 'There must always be at least one admin.'),
    );
  }
  const updated: StaffMember = { ...target, ...change };
  staff = staff.map((s) => (s.id === id ? updated : s));
  accessLog.push({
    id: newId('acc_'),
    actorEmail: ME.email,
    action: change.role
      ? 'role_changed'
      : change.status === 'suspended'
        ? 'suspended'
        : 'reinstated',
    targetEmail: target.email,
    detail: change.role ? `${target.role} → ${change.role}` : null,
    createdAt: Date.now(),
  });
  return wait(updated);
}

export const changeRole = (id: string, role: StaffRole) => updateStaff(id, { role });
export const changeStatus = (id: string, status: 'suspended' | 'active') =>
  updateStaff(id, { status });

export function listAccessEvents(page = 1, pageSize = 25): Promise<Page<AccessEvent>> {
  const rows = [...accessLog].sort((a, b) => b.createdAt - a.createdAt);
  return wait({
    items: rows.slice((page - 1) * pageSize, page * pageSize),
    total: rows.length,
    page,
    pageSize,
  });
}

export function demoSubmit(body: { count?: number; all?: boolean }): Promise<DemoSubmitResult> {
  const count = body.all ? 5 : Math.min(body.count ?? 3, 5);
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const bundle = createBundle({
      type: pick(['failed_transfer_debit', 'duplicate_charge', 'unauthorised_payment'] as const),
      amount: 500_000 + Math.round(Math.random() * 30) * 100_000,
      status: 'queued',
      ageHours: 0,
    });
    store.set(bundle.detail.dispute.id, bundle);
    ids.push(bundle.detail.dispute.id);
  }
  return wait({ created: count, disputeIds: ids, remaining: 0 });
}

export function demoEval(): Promise<EvalResponse> {
  return wait({
    rows: [],
    accuracy: 0.975,
    summary: {
      totalCases: 40,
      submitted: 40,
      pending: 0,
      evaluated: 40,
      classificationAccuracy: 1,
      dispositionAccuracy: 0.975,
      evidenceValidityRate: 0.975,
      avgInvestigationMs: 65_500,
      p95InvestigationMs: 104_000,
      byScenario: [],
      models: [{ profile: 'onprem', model: 'qwen3.6', count: 40 }],
    },
  });
}

export function signIn(email: string, staffIdValue: string): Promise<MeResponse> {
  const member = staff.find(
    (s) => s.email === email.trim().toLowerCase() && s.staffId === staffIdValue.trim(),
  );
  if (!member) {
    return Promise.reject(
      new ApiError(401, 'unauthorized', "That email and staff ID don't match an account."),
    );
  }
  if (member.status === 'suspended') {
    return Promise.reject(new ApiError(403, 'forbidden', 'Your access has been suspended.'));
  }
  return wait({
    ...ME,
    email: member.email,
    name: member.name,
    staffId: member.staffId,
    role: member.role,
  });
}
