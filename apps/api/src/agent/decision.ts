import { z } from 'zod';
import {
  AGENT_OUTCOMES,
  CLASSIFIED_TYPES,
  RECOMMENDED_ACTIONS,
  RISK_LEVELS,
} from '../common/domain.js';

export const decisionSchema = z.object({
  classified_type: z.enum(CLASSIFIED_TYPES),
  outcome: z.enum(AGENT_OUTCOMES),
  confidence: z.number().min(0).max(1),
  risk_level: z.enum(RISK_LEVELS),
  fraud_suspected: z.boolean(),
  recommended_action: z.enum(RECOMMENDED_ACTIONS),
  reasoning: z.string().min(50).max(1500),
  evidence: z
    .array(
      z.object({
        tool_call_id: z.string().min(1).max(64),
        claim: z.string().trim().min(1).max(400),
      }),
    )
    .min(1)
    .max(10),
  customer_message: z.string().min(20).max(800),
});

export type Decision = z.infer<typeof decisionSchema>;

export const SUBMIT_DECISION = 'submit_decision';

export const submitDecisionTool = {
  name: SUBMIT_DECISION,
  description:
    'Submit the final decision for this dispute. Call it exactly once, after you have gathered the evidence you need. Ends the investigation.',
  parameters: z.toJSONSchema(decisionSchema, { io: 'input' }) as Record<string, unknown>,
};

/** Fixes the slips models commonly make before strict validation. */
export function normaliseDecision(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return raw;
  const value: Record<string, unknown> = { ...(raw as Record<string, unknown>) };

  if (typeof value.evidence === 'string') {
    try {
      value.evidence = JSON.parse(value.evidence);
    } catch {
      // leave it; validation reports the problem
    }
  }
  if (typeof value.fraud_suspected === 'string') {
    const lowered = value.fraud_suspected.trim().toLowerCase();
    if (lowered === 'true') value.fraud_suspected = true;
    else if (lowered === 'false') value.fraud_suspected = false;
  }
  if (typeof value.confidence === 'string' && value.confidence.trim() !== '') {
    const parsed = Number(value.confidence);
    if (Number.isFinite(parsed)) value.confidence = parsed;
  }
  return value;
}

export type ParsedDecision = { ok: true; data: Decision } | { ok: false; error: string };

export function parseDecision(raw: unknown): ParsedDecision {
  if (typeof raw === 'object' && raw !== null && '__parse_error' in raw) {
    return {
      ok: false,
      error:
        'The decision was rejected. Fix these and call submit_decision again. arguments: not valid JSON',
    };
  }
  const result = decisionSchema.safeParse(normaliseDecision(raw));
  if (result.success) return { ok: true, data: result.data };
  const problems = result.error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
  return {
    ok: false,
    error: `The decision was rejected. Fix these and call submit_decision again. ${problems}`,
  };
}

export const FALLBACK_DECISION: Decision = {
  classified_type: 'unknown',
  outcome: 'escalate',
  confidence: 0,
  risk_level: 'medium',
  fraud_suspected: false,
  recommended_action: 'manual_review',
  reasoning: 'The agent did not reach a decision within its limits.',
  evidence: [],
  customer_message:
    'We have received your dispute and a member of our team is reviewing it. We will update you soon.',
} as unknown as Decision;
