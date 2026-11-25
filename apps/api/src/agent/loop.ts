import type { ChatProvider, ChatResponse, Message, ToolCall, ToolDef } from '../ai/types.js';
import {
  FALLBACK_DECISION,
  parseDecision,
  SUBMIT_DECISION,
  submitDecisionTool,
  type Decision,
} from './decision.js';

export type ToolResult = { ok: true; data: unknown } | { ok: false; error: string };

export interface ToolRunner {
  definitions(): ToolDef[];
  run(name: string, args: unknown): Promise<ToolResult>;
}

export interface StepInput {
  kind: 'model' | 'tool' | 'system';
  toolName: string | null;
  input: unknown;
  output: unknown;
  latencyMs: number;
}

export interface LoopDeps {
  provider: ChatProvider;
  tools: ToolRunner;
  appendStep(step: StepInput): Promise<{ id: string }>;
  maxSteps: number;
  now?: () => number;
}

export interface LoopResult {
  decision: Decision;
  fallback: boolean;
  usage: { input: number; output: number };
}

export const NUDGE = 'Call submit_decision with your decision.';

/**
 * The bounded loop from RESOLVE.md §6: at most `maxSteps` model turns, one repair for an
 * invalid decision, one nudge when the model answers without a tool, then a forced decision,
 * then a fallback escalation. Provider errors propagate so the job is retried.
 */
export async function runAgentLoop(initial: Message[], deps: LoopDeps): Promise<LoopResult> {
  const now = deps.now ?? (() => performance.now());
  const messages: Message[] = [...initial];
  const tools = [...deps.tools.definitions(), submitDecisionTool];
  const usage = { input: 0, output: 0 };
  let nudged = false;
  let repaired = false;

  const callModel = async (turn: number, toolChoice: 'auto' | { name: string }) => {
    const started = now();
    const res = await deps.provider.chat({ messages, tools, toolChoice, maxTokens: 1500 });
    usage.input += res.usage?.input ?? 0;
    usage.output += res.usage?.output ?? 0;
    await deps.appendStep({
      kind: 'model',
      toolName: null,
      input: { turn, toolChoice: toolChoice === 'auto' ? 'auto' : toolChoice.name },
      output: {
        content: res.content,
        toolCalls: res.toolCalls.map((call) => ({ name: call.name, arguments: call.arguments })),
        usage: res.usage ?? null,
      },
      latencyMs: Math.round(now() - started),
    });
    return res;
  };

  const pushAssistant = (res: ChatResponse) =>
    messages.push({ role: 'assistant', content: res.content, toolCalls: res.toolCalls });

  turns: for (let turn = 1; turn <= deps.maxSteps; turn++) {
    const res = await callModel(turn, 'auto');
    pushAssistant(res);

    if (res.toolCalls.length === 0) {
      if (nudged) break;
      messages.push({ role: 'user', content: NUDGE });
      nudged = true;
      continue;
    }

    for (const [index, call] of res.toolCalls.entries()) {
      if (call.name === SUBMIT_DECISION) {
        const parsed = parseDecision(call.arguments);
        if (parsed.ok) return { decision: parsed.data, fallback: false, usage };
        answerRemaining(messages, res.toolCalls, index, parsed.error);
        if (repaired) break turns;
        repaired = true;
        continue turns;
      }
      const started = now();
      const result = await deps.tools.run(call.name, call.arguments);
      const step = await deps.appendStep({
        kind: 'tool',
        toolName: call.name,
        input: call.arguments ?? {},
        output: result,
        latencyMs: Math.round(now() - started),
      });
      messages.push({
        role: 'tool',
        toolCallId: call.id,
        content: JSON.stringify({ step_id: step.id, ...result }),
      });
    }
  }

  const forced = await callModel(deps.maxSteps + 1, { name: SUBMIT_DECISION });
  const submission = forced.toolCalls.find((call) => call.name === SUBMIT_DECISION);
  if (submission) {
    const parsed = parseDecision(submission.arguments);
    if (parsed.ok) return { decision: parsed.data, fallback: false, usage };
  }
  return { decision: FALLBACK_DECISION, fallback: true, usage };
}

/** Every tool call needs an answer, so the rejected decision and anything after it get one. */
function answerRemaining(messages: Message[], calls: ToolCall[], from: number, error: string) {
  for (const [index, call] of calls.entries()) {
    if (index < from) continue;
    messages.push({
      role: 'tool',
      toolCallId: call.id,
      content: JSON.stringify(
        index === from
          ? { ok: false, error }
          : { ok: false, error: 'Not run: submit_decision must be the last call.' },
      ),
    });
  }
}
