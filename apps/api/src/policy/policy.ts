import type {
  ClassifiedType,
  ExecutionMode,
  PolicyDisposition,
  PolicyReasonCode,
} from '../common/domain.js';
import type { Decision } from '../agent/decision.js';

export interface PolicyConfig {
  confidenceThreshold: number;
  valueCapMinor: number;
  autoTypes: readonly ClassifiedType[];
  reviewTypes: readonly ClassifiedType[];
  minEvidenceForAuto: number;
  executionMode: ExecutionMode;
}

export interface PolicyInput {
  decision: Pick<
    Decision,
    | 'classified_type'
    | 'recommended_action'
    | 'outcome'
    | 'confidence'
    | 'fraud_suspected'
    | 'evidence'
  >;
  evidenceValid: boolean;
  dispute: { amountMinor: number };
  config: PolicyConfig;
}

export interface PolicyResult {
  disposition: PolicyDisposition;
  reasons: PolicyReasonCode[];
}

/** RESOLVE.md §7. Every rule is evaluated and every triggered reason is reported. */
export function applyPolicy({
  decision,
  evidenceValid,
  dispute,
  config,
}: PolicyInput): PolicyResult {
  const type = decision.classified_type;
  const action = decision.recommended_action;
  const reasons: PolicyReasonCode[] = [];

  if (!evidenceValid) reasons.push('evidence_validation_failed');
  if (decision.fraud_suspected) reasons.push('fraud_suspected');
  if (type === 'unknown' || config.reviewTypes.includes(type)) reasons.push('review_type');
  if (dispute.amountMinor > config.valueCapMinor) reasons.push('above_value_cap');
  if (decision.outcome === 'reject') reasons.push('rejection_needs_confirmation');
  if (decision.outcome === 'escalate') reasons.push('agent_escalated');
  if (decision.confidence < config.confidenceThreshold) reasons.push('low_confidence');
  if (!config.autoTypes.includes(type)) reasons.push('type_not_auto_eligible');
  if (
    (action === 'reverse_debit' && type !== 'failed_transfer_debit') ||
    (action === 'refund_duplicate' && type !== 'duplicate_charge') ||
    action === 'none' ||
    action === 'manual_review'
  ) {
    reasons.push('action_type_mismatch');
  }
  if (decision.evidence.length < config.minEvidenceForAuto) reasons.push('insufficient_evidence');
  if (config.executionMode === 'recommend_only') reasons.push('recommend_only_mode');

  return { disposition: reasons.length === 0 ? 'auto_resolve' : 'needs_review', reasons };
}
