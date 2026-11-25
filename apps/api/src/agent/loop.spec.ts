import { validDecision } from '../../test/fixtures/decision.js';
import type { ChatRequest, ChatResponse } from '../ai/types.js';
import { FALLBACK_DECISION } from './decision.js';
import { NUDGE, runAgentLoop, type StepInput, type ToolRunner } from './loop.js';

function scripted(responses: ChatResponse[]) {
  const requests: ChatRequest[] = [];
  return {
    requests,
    provider: {
      chat: vi.fn(async (request: ChatRequest) => {
        requests.push(structuredClone(request));
        const next = responses.shift();
        if (!next) throw new Error('script exhausted');
        return next;
      }),
    },
  };
}

const call = (id: string, name: string, args: unknown = {}) => ({ id, name, arguments: args });
const reply = (...toolCalls: ReturnType<typeof call>[]): ChatResponse => ({
  content: null,
  toolCalls,
  usage: { input: 100, output: 10 },
});
const text = (content: string): ChatResponse => ({
  content,
  toolCalls: [],
  usage: { input: 50, output: 5 },
});

function harness() {
  const steps: StepInput[] = [];
  const tools: ToolRunner = {
    definitions: () => [
      { name: 'get_transaction', description: 'd', parameters: { type: 'object' } },
    ],
    run: vi.fn(async () => ({ ok: true as const, data: { status: 'successful' } })),
  };
  const appendStep = vi.fn(async (step: StepInput) => {
    steps.push(step);
    return { id: `stp_${steps.length}` };
  });
  return { steps, tools, appendStep };
}

const initial = [
  { role: 'system' as const, content: 'system' },
  { role: 'user' as const, content: 'dispute' },
];

describe('runAgentLoop', () => {
  it('runs tools, cites step IDs back to the model, and returns the decision', async () => {
    const { provider, requests } = scripted([
      reply(call('c1', 'get_transaction', { transaction_id: 'txn_1' })),
      reply(call('c2', 'submit_decision', validDecision)),
    ]);
    const { steps, tools, appendStep } = harness();
    const result = await runAgentLoop(initial, { provider, tools, appendStep, maxSteps: 8 });

    expect(result.fallback).toBe(false);
    expect(result.decision.classified_type).toBe('failed_transfer_debit');
    expect(result.usage).toEqual({ input: 200, output: 20 });
    expect(steps.map((s) => s.kind)).toEqual(['model', 'tool', 'model']);
    expect(steps[1]).toMatchObject({
      toolName: 'get_transaction',
      input: { transaction_id: 'txn_1' },
    });
    const toolMessage = requests[1]!.messages.find((m) => m.role === 'tool');
    expect(toolMessage).toMatchObject({ toolCallId: 'c1' });
    expect(JSON.parse((toolMessage as { content: string }).content)).toMatchObject({
      step_id: 'stp_2',
      ok: true,
    });
  });

  it('sends a validation error back once and accepts the repaired decision', async () => {
    const { provider, requests } = scripted([
      reply(call('c1', 'submit_decision', { ...validDecision, confidence: 7 })),
      reply(call('c2', 'submit_decision', validDecision)),
    ]);
    const { tools, appendStep } = harness();
    const result = await runAgentLoop(initial, { provider, tools, appendStep, maxSteps: 8 });
    expect(result.fallback).toBe(false);
    const error = requests[1]!.messages.at(-1) as { content: string };
    expect(error.content).toContain('The decision was rejected');
  });

  it('forces a decision after a second invalid one, then falls back', async () => {
    const bad = { ...validDecision, confidence: 7 };
    const { provider, requests } = scripted([
      reply(call('c1', 'submit_decision', bad)),
      reply(call('c2', 'submit_decision', bad)),
      reply(call('c3', 'submit_decision', bad)),
    ]);
    const { tools, appendStep } = harness();
    const result = await runAgentLoop(initial, { provider, tools, appendStep, maxSteps: 8 });
    expect(requests[2]!.toolChoice).toEqual({ name: 'submit_decision' });
    expect(result).toMatchObject({ fallback: true, decision: FALLBACK_DECISION });
  });

  it('nudges once when the model answers in prose', async () => {
    const { provider, requests } = scripted([
      text('I think it is a failed transfer.'),
      reply(call('c1', 'submit_decision', validDecision)),
    ]);
    const { tools, appendStep } = harness();
    const result = await runAgentLoop(initial, { provider, tools, appendStep, maxSteps: 8 });
    expect(result.fallback).toBe(false);
    expect(requests[1]!.messages.at(-1)).toEqual({ role: 'user', content: NUDGE });
  });

  it('stops after a second prose answer and forces the decision', async () => {
    const { provider, requests } = scripted([
      text('hmm'),
      text('still thinking'),
      reply(call('c1', 'submit_decision', validDecision)),
    ]);
    const { tools, appendStep } = harness();
    const result = await runAgentLoop(initial, { provider, tools, appendStep, maxSteps: 8 });
    expect(requests).toHaveLength(3);
    expect(requests[2]!.toolChoice).toEqual({ name: 'submit_decision' });
    expect(result.fallback).toBe(false);
  });

  it('respects the step limit, then falls back when the forced call has no decision', async () => {
    const { provider, requests } = scripted([
      reply(call('c1', 'get_transaction')),
      reply(call('c2', 'get_transaction')),
      reply(call('c3', 'get_transaction')),
      text('no'),
    ]);
    const { tools, appendStep, steps } = harness();
    const result = await runAgentLoop(initial, { provider, tools, appendStep, maxSteps: 3 });
    expect(requests).toHaveLength(4);
    expect(result.fallback).toBe(true);
    expect(result.decision.outcome).toBe('escalate');
    expect(result.decision.confidence).toBe(0);
    expect(steps.filter((s) => s.kind === 'model')).toHaveLength(4);
  });

  it('lets a provider error propagate so the job is retried', async () => {
    const provider = { chat: vi.fn(async () => Promise.reject(new Error('model down'))) };
    const { tools, appendStep } = harness();
    await expect(
      runAgentLoop(initial, { provider, tools, appendStep, maxSteps: 8 }),
    ).rejects.toThrow('model down');
  });
});
