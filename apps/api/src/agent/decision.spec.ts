import { validDecision } from '../../test/fixtures/decision.js';
import { parseDecision, submitDecisionTool } from './decision.js';

describe('parseDecision', () => {
  it('accepts a valid decision', () => {
    const result = parseDecision(validDecision);
    expect(result.ok).toBe(true);
  });

  it('normalises string-encoded fields', () => {
    const result = parseDecision({
      ...validDecision,
      confidence: '0.9',
      fraud_suspected: 'TRUE',
      evidence: JSON.stringify(validDecision.evidence),
    });
    expect(result).toMatchObject({ ok: true, data: { confidence: 0.9, fraud_suspected: true } });
  });

  it('reports every problem with its path', () => {
    const result = parseDecision({
      ...validDecision,
      confidence: 2,
      reasoning: 'short',
      evidence: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(
      /^The decision was rejected\. Fix these and call submit_decision again\./,
    );
    expect(result.error).toContain('confidence');
    expect(result.error).toContain('reasoning');
    expect(result.error).toContain('evidence');
  });

  it('rejects arguments that were not JSON', () => {
    const result = parseDecision({ __parse_error: true, raw: '{oops' });
    expect(result.ok).toBe(false);
  });
});

describe('submitDecisionTool', () => {
  it('sends a JSON schema generated from the Zod schema', () => {
    expect(submitDecisionTool.parameters).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['classified_type', 'evidence']),
    });
  });
});
