import {
  canonicalJson,
  computeStepHash,
  GENESIS_HASH,
  limitForStorage,
  verifyChain,
  type ChainStep,
} from './chain.js';

function buildChain(count: number): ChainStep[] {
  const steps: ChainStep[] = [];
  let prevHash = GENESIS_HASH;
  for (let seq = 1; seq <= count; seq++) {
    const base = {
      prevHash,
      seq,
      kind: seq % 2 ? 'model' : 'tool',
      toolName: seq % 2 ? null : 'get_transaction',
      input: { transaction_id: `txn_${seq}` },
      output: { ok: true, data: { amount_minor: seq * 100, nested: { b: 1, a: 2 } } },
    };
    const hash = computeStepHash(base);
    steps.push({ ...base, hash });
    prevHash = hash;
  }
  return steps;
}

describe('canonicalJson', () => {
  it('ignores key order and drops undefined', () => {
    expect(canonicalJson({ b: 1, a: { d: undefined, c: [3, { z: 1, y: 2 }] } })).toBe(
      '{"a":{"c":[3,{"y":2,"z":1}]},"b":1}',
    );
  });
});

describe('verifyChain', () => {
  it('verifies an intact chain', () => {
    expect(verifyChain(buildChain(9))).toEqual({ valid: true, checked: 9 });
  });

  it('verifies an empty chain', () => {
    expect(verifyChain([])).toEqual({ valid: true, checked: 0 });
  });

  it('detects a tampered step', () => {
    const steps = buildChain(6);
    steps[3] = { ...steps[3]!, output: { ok: true, data: { amount_minor: 1 } } };
    expect(verifyChain(steps)).toEqual({ valid: false, checked: 4, brokenAtSeq: 4 });
  });

  it('detects reordered steps', () => {
    const steps = buildChain(4);
    [steps[1], steps[2]] = [steps[2]!, steps[1]!];
    expect(verifyChain(steps).valid).toBe(false);
  });

  it('detects a deleted step', () => {
    const steps = buildChain(5);
    steps.splice(2, 1);
    expect(verifyChain(steps)).toMatchObject({ valid: false, brokenAtSeq: 4 });
  });

  it('gives the same digest after key order changes (as a jsonb round trip does)', () => {
    const [step] = buildChain(1);
    const reordered = {
      ...step!,
      output: JSON.parse('{"data":{"nested":{"a":2,"b":1},"amount_minor":100},"ok":true}'),
    };
    expect(verifyChain([reordered]).valid).toBe(true);
  });
});

describe('limitForStorage', () => {
  it('keeps small values', () => {
    expect(limitForStorage({ ok: true, data: { a: 1 } })).toEqual({ ok: true, data: { a: 1 } });
  });

  it('replaces large values with a preview and keeps ok', () => {
    const stored = limitForStorage({ ok: true, data: 'x'.repeat(10_000) }) as Record<
      string,
      unknown
    >;
    expect(stored).toMatchObject({ ok: true, truncated: true });
    expect(stored.original_bytes).toBeGreaterThan(10_000);
    expect(String(stored.preview).length).toBe(1024);
  });
});
