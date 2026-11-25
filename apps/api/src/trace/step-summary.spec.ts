import { stepSummary, stepTitle } from './step-summary.js';

const ok = (data: Record<string, unknown>) => ({ ok: true, data });

describe('stepTitle', () => {
  it('turns tool names into sentence case', () => {
    expect(stepTitle('tool', 'get_settlement_status')).toBe('Get settlement status');
    expect(stepTitle('model', null)).toBe('Model turn');
  });
});

describe('stepSummary', () => {
  it('summarises model turns', () => {
    expect(stepSummary('model', null, { toolCalls: [{ name: 'a' }, { name: 'b' }] })).toBe(
      'Called 2 tools',
    );
    expect(stepSummary('model', null, { toolCalls: [{ name: 'submit_decision' }] })).toBe(
      'Submitted the decision',
    );
    expect(stepSummary('model', null, { toolCalls: [] })).toBe('Answered without calling a tool');
  });

  it('reports failures and truncation', () => {
    expect(stepSummary('tool', 'get_transaction', { ok: false, error: 'not found' })).toBe(
      'Failed: not found',
    );
    expect(stepSummary('tool', 'get_transaction', { ok: true, truncated: true })).toBe(
      'Output was too large to show',
    );
  });

  it.each([
    [
      'get_transaction',
      ok({ amount_minor: 4000000, counterparty: {}, status: 'failed', city: 'Abeokuta' }),
      '₦40,000.00 transfer, failed, Abeokuta',
    ],
    [
      'get_customer_profile',
      ok({ segment: 'retail', risk_profile: 'low', typical_amount_minor: 1500000 }),
      'retail customer, low risk, typical ₦15,000.00',
    ],
    ['get_customer_history', ok({ transactions: [{}, {}] }), '2 transactions in history'],
    ['get_ledger_entries', ok({ entries: [{ entry_type: 'debit' }] }), '1 debit'],
    ['get_ledger_entries', ok({ entries: [] }), 'No ledger entries'],
    [
      'get_settlement_status',
      ok({ status: 'failed', failure_reason: 'beneficiary bank timeout', age_minutes: 182 }),
      'Settlement failed: beneficiary bank timeout, 182 minutes ago',
    ],
    [
      'get_device_and_location',
      ok({ device: { trusted: false }, city_matches_home: false, ip_country: 'GH' }),
      'untrusted device, away from home, IP GH',
    ],
    [
      'get_merchant_info',
      ok({ flagged: true, dispute_rate_bps: 780, customer_prior_purchase_count: 0 }),
      'Flagged, 780 bps dispute rate, 0 prior purchases',
    ],
    [
      'find_related_transactions',
      ok({ related: [{ same_amount: true, same_merchant: true }] }),
      '1 related transaction, 1 with the same amount and merchant',
    ],
    ['find_related_transactions', ok({ related: [] }), 'No related transactions'],
  ])('summarises %s', (tool, output, expected) => {
    expect(stepSummary('tool', tool, output)).toBe(expected);
  });
});
