import { applyPolicy, type PolicyConfig, type PolicyInput } from './policy.js';

const config: PolicyConfig = {
  confidenceThreshold: 0.9,
  valueCapMinor: 5_000_000,
  autoTypes: ['failed_transfer_debit', 'duplicate_charge'],
  reviewTypes: ['unauthorised_payment', 'merchant_non_delivery'],
  minEvidenceForAuto: 2,
  executionMode: 'execute',
};

const evidence = [
  { tool_call_id: 'stp_1', claim: 'Debit posted' },
  { tool_call_id: 'stp_2', claim: 'Settlement failed' },
];

function input(
  overrides: {
    decision?: Partial<PolicyInput['decision']>;
    evidenceValid?: boolean;
    amountMinor?: number;
    config?: Partial<PolicyConfig>;
  } = {},
): PolicyInput {
  return {
    decision: {
      classified_type: 'failed_transfer_debit',
      recommended_action: 'reverse_debit',
      outcome: 'auto_resolve',
      confidence: 0.95,
      fraud_suspected: false,
      evidence,
      ...overrides.decision,
    },
    evidenceValid: overrides.evidenceValid ?? true,
    dispute: { amountMinor: overrides.amountMinor ?? 4_000_000 },
    config: { ...config, ...overrides.config },
  };
}

describe('applyPolicy', () => {
  it('auto-resolves a clean failed transfer', () => {
    expect(applyPolicy(input())).toEqual({ disposition: 'auto_resolve', reasons: [] });
  });

  it('auto-resolves a clean duplicate charge', () => {
    const result = applyPolicy(
      input({
        decision: { classified_type: 'duplicate_charge', recommended_action: 'refund_duplicate' },
      }),
    );
    expect(result.disposition).toBe('auto_resolve');
  });

  const single: [string, Parameters<typeof input>[0]][] = [
    ['evidence_validation_failed', { evidenceValid: false }],
    ['fraud_suspected', { decision: { fraud_suspected: true } }],
    ['above_value_cap', { amountMinor: 5_000_001 }],
    ['low_confidence', { decision: { confidence: 0.89 } }],
    ['insufficient_evidence', { decision: { evidence: evidence.slice(0, 1) } }],
    ['recommend_only_mode', { config: { executionMode: 'recommend_only' } }],
    ['type_not_auto_eligible', { config: { autoTypes: ['duplicate_charge'] } }],
  ];

  it.each(single)('triggers only %s', (reason, overrides) => {
    expect(applyPolicy(input(overrides))).toEqual({
      disposition: 'needs_review',
      reasons: [reason],
    });
  });

  it('allows the amount exactly at the cap', () => {
    expect(applyPolicy(input({ amountMinor: 5_000_000 })).disposition).toBe('auto_resolve');
  });

  it('allows confidence exactly at the threshold', () => {
    expect(applyPolicy(input({ decision: { confidence: 0.9 } })).disposition).toBe('auto_resolve');
  });

  it('flags review types', () => {
    const { reasons } = applyPolicy(
      input({
        decision: { classified_type: 'unauthorised_payment', recommended_action: 'manual_review' },
      }),
    );
    expect(reasons).toEqual(
      expect.arrayContaining(['review_type', 'type_not_auto_eligible', 'action_type_mismatch']),
    );
  });

  it('treats unknown as a review type', () => {
    const { reasons } = applyPolicy(input({ decision: { classified_type: 'unknown' } }));
    expect(reasons).toContain('review_type');
  });

  it('needs confirmation for a rejection', () => {
    const { reasons } = applyPolicy(
      input({
        decision: {
          outcome: 'reject',
          classified_type: 'legitimate_transaction',
          recommended_action: 'none',
        },
      }),
    );
    expect(reasons).toEqual([
      'rejection_needs_confirmation',
      'type_not_auto_eligible',
      'action_type_mismatch',
    ]);
  });

  it('flags an escalation', () => {
    expect(applyPolicy(input({ decision: { outcome: 'escalate' } })).reasons).toEqual([
      'agent_escalated',
    ]);
  });

  it('flags an action that does not fit the type', () => {
    expect(
      applyPolicy(input({ decision: { recommended_action: 'refund_duplicate' } })).reasons,
    ).toEqual(['action_type_mismatch']);
    expect(
      applyPolicy(
        input({
          decision: { classified_type: 'duplicate_charge', recommended_action: 'reverse_debit' },
        }),
      ).reasons,
    ).toEqual(['action_type_mismatch']);
  });

  it('reports every triggered rule for a risky case', () => {
    const result = applyPolicy(
      input({
        decision: {
          classified_type: 'unauthorised_payment',
          recommended_action: 'manual_review',
          outcome: 'escalate',
          fraud_suspected: true,
          confidence: 0.7,
        },
        amountMinor: 25_000_000,
      }),
    );
    expect(result).toEqual({
      disposition: 'needs_review',
      reasons: [
        'fraud_suspected',
        'review_type',
        'above_value_cap',
        'agent_escalated',
        'low_confidence',
        'type_not_auto_eligible',
        'action_type_mismatch',
      ],
    });
  });
});
