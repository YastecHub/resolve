export const validDecision = {
  classified_type: 'failed_transfer_debit',
  outcome: 'auto_resolve',
  confidence: 0.96,
  risk_level: 'low',
  fraud_suspected: false,
  recommended_action: 'reverse_debit',
  reasoning:
    'The transfer was debited but settlement failed with a beneficiary bank timeout and no reversal exists.',
  evidence: [
    { tool_call_id: 'stp_A', claim: 'Debit posted, no reversal' },
    { tool_call_id: 'stp_B', claim: 'Settlement failed' },
  ],
  customer_message: 'Hi Funke, your transfer did not complete and we are returning the money.',
} as const;
