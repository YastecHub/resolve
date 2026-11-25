import type { AgentStep } from '../generated/prisma/client.js';
import { stepSummary, stepTitle } from './step-summary.js';
import type { TraceStepDto } from './trace.dto.js';

const asObject = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export function toTraceStep(step: AgentStep): TraceStepDto {
  const output = asObject(step.output);
  // Model steps never carry the prompt; return only what the model asked for.
  const input =
    step.kind === 'model'
      ? { toolCalls: output.toolCalls ?? [], usage: output.usage ?? null }
      : asObject(step.input);
  return {
    id: step.id,
    seq: step.seq,
    kind: step.kind,
    toolName: step.toolName,
    title: stepTitle(step.kind, step.toolName),
    summary: stepSummary(step.kind, step.toolName, step.output),
    ok: step.kind === 'tool' ? output.ok === true : true,
    input,
    output,
    latencyMs: step.latencyMs,
    prevHash: step.prevHash,
    hash: step.hash,
    createdAt: step.createdAt.toISOString(),
  };
}
