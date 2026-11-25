import { validateEvidence, type EvidenceStep } from './evidence.js';

const steps: EvidenceStep[] = [
  { id: 'stp_model', kind: 'model', output: { content: null } },
  { id: 'stp_ok', kind: 'tool', output: { ok: true, data: {} } },
  { id: 'stp_failed', kind: 'tool', output: { ok: false, error: 'not found' } },
];

const cite = (id: string, claim = 'a claim') => ({ tool_call_id: id, claim });

describe('validateEvidence', () => {
  it('passes when every citation is a successful tool call', () => {
    expect(validateEvidence({ evidence: [cite('stp_ok')] }, steps)).toEqual({
      valid: true,
      problems: [],
    });
  });

  it('flags an ID that is not a step of this investigation', () => {
    const result = validateEvidence({ evidence: [cite('stp_other')] }, steps);
    expect(result.valid).toBe(false);
    expect(result.problems[0]).toContain('is not a step of this investigation');
  });

  it('flags a citation of a model step', () => {
    const result = validateEvidence({ evidence: [cite('stp_model')] }, steps);
    expect(result.problems[0]).toContain('is not a tool call');
  });

  it('flags a citation of a failed tool call', () => {
    const result = validateEvidence({ evidence: [cite('stp_failed')] }, steps);
    expect(result.problems[0]).toContain('did not return a successful result');
  });

  it('flags an empty claim', () => {
    const result = validateEvidence({ evidence: [cite('stp_ok', '   ')] }, steps);
    expect(result.problems).toEqual(['evidence[0]: the claim is empty.']);
  });

  it('flags no evidence at all', () => {
    expect(validateEvidence({ evidence: [] }, steps).problems).toEqual(['No evidence was cited.']);
  });
});
