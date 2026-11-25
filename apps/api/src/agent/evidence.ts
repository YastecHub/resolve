import type { Decision } from './decision.js';

export interface EvidenceStep {
  id: string;
  kind: string;
  output: unknown;
}

export interface EvidenceResult {
  valid: boolean;
  problems: string[];
}

/** Checks that every citation points at a successful tool call from this investigation. */
export function validateEvidence(
  decision: Pick<Decision, 'evidence'>,
  steps: EvidenceStep[],
): EvidenceResult {
  const problems: string[] = [];
  const byId = new Map(steps.map((step) => [step.id, step]));
  if (decision.evidence.length === 0) problems.push('No evidence was cited.');

  for (const [index, item] of decision.evidence.entries()) {
    const label = `evidence[${index}]`;
    if (!item.claim.trim()) problems.push(`${label}: the claim is empty.`);
    const step = byId.get(item.tool_call_id);
    if (!step) problems.push(`${label}: ${item.tool_call_id} is not a step of this investigation.`);
    else if (step.kind !== 'tool')
      problems.push(`${label}: ${item.tool_call_id} is not a tool call.`);
    else if ((step.output as { ok?: unknown } | null)?.ok !== true)
      problems.push(`${label}: ${item.tool_call_id} did not return a successful result.`);
  }
  return { valid: problems.length === 0, problems };
}
