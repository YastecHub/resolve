import { maskName } from '../agent/sanitize.js';
import type {
  AnalystAction,
  Customer,
  Dispute,
  Investigation,
  Merchant,
  Transaction,
} from '../generated/prisma/client.js';
import type {
  AnalystActionDto,
  CustomerSummaryDto,
  DisputeListItemDto,
  DisputeSummaryDto,
  InvestigationSummaryDto,
  TransactionSummaryDto,
} from './dto/dispute.dto.js';

const iso = (date: Date | null | undefined) => (date ? date.toISOString() : null);

export type DisputeWithLatest = Dispute & {
  transaction: Pick<Transaction, 'reference'>;
  customer: Pick<Customer, 'fullName'>;
  latestInvestigation: Investigation | null;
};

export function toListItem(d: DisputeWithLatest): DisputeListItemDto {
  const inv = d.latestInvestigation;
  return {
    id: d.id,
    reference: d.transaction.reference,
    transactionId: d.transactionId,
    customerId: d.customerId,
    customerName: maskName(d.customer.fullName),
    reasonCode: d.reasonCode,
    amountMinor: Number(d.amountMinor),
    status: d.status,
    resolvedBy: d.resolvedBy,
    classifiedType: inv?.classifiedType ?? d.classifiedType ?? null,
    confidence: inv?.confidence ?? null,
    fraudSuspected: inv?.fraudSuspected ?? false,
    policyDisposition: inv?.policyDisposition ?? null,
    slaDueAt: d.slaDueAt.toISOString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export function toSummary(d: DisputeWithLatest): DisputeSummaryDto {
  return {
    ...toListItem(d),
    customerNotes: d.customerNotes,
    resolutionAction: d.resolutionAction,
    resolvedAt: iso(d.resolvedAt),
    lastError: d.lastError,
  };
}

export function toTransactionSummary(
  t: Transaction & { merchant: Merchant | null },
): TransactionSummaryDto {
  return {
    id: t.id,
    reference: t.reference,
    type: t.type,
    channel: t.channel,
    amountMinor: Number(t.amountMinor),
    status: t.status,
    merchantName: t.merchant?.name ?? null,
    counterpartyName: t.counterpartyName ? maskName(t.counterpartyName) : null,
    counterpartyBank: t.counterpartyBank,
    city: t.city,
    ipCountry: t.ipCountry,
    createdAt: t.createdAt.toISOString(),
  };
}

export function toCustomerSummary(c: Customer): CustomerSummaryDto {
  return {
    id: c.id,
    name: maskName(c.fullName),
    segment: c.segment,
    homeCity: c.homeCity,
    accountAgeDays: c.accountAgeDays,
    riskProfile: c.riskProfile,
  };
}

interface StoredEvidence {
  tool_call_id?: string;
  claim?: string;
}

export function toInvestigationSummary(i: Investigation): InvestigationSummaryDto {
  const evidence = Array.isArray(i.evidence) ? (i.evidence as StoredEvidence[]) : [];
  return {
    id: i.id,
    attempt: i.attempt,
    status: i.status,
    profile: i.profile,
    providerKind: i.providerKind,
    model: i.model,
    outcome: i.outcome,
    confidence: i.confidence,
    riskLevel: i.riskLevel,
    fraudSuspected: i.fraudSuspected,
    classifiedType: i.classifiedType,
    recommendedAction: i.recommendedAction,
    reasoning: i.reasoning,
    evidence: evidence.map((e) => ({ toolCallId: e.tool_call_id ?? '', claim: e.claim ?? '' })),
    evidenceProblems: Array.isArray(i.evidenceProblems) ? (i.evidenceProblems as string[]) : [],
    customerMessage: i.customerMessage,
    policyDisposition: i.policyDisposition,
    policyReasons: Array.isArray(i.policyReasons) ? (i.policyReasons as never[]) : [],
    evidenceValid: i.evidenceValid,
    stepsCount: i.stepsCount,
    tokensIn: i.tokensIn,
    tokensOut: i.tokensOut,
    error: i.error,
    startedAt: i.startedAt.toISOString(),
    finishedAt: iso(i.finishedAt),
  };
}

export function toAnalystAction(a: AnalystAction): AnalystActionDto {
  return {
    id: a.id,
    actorEmail: a.actorEmail,
    action: a.action,
    overrideAction: a.overrideAction,
    reason: a.reason,
    createdAt: a.createdAt.toISOString(),
  };
}
