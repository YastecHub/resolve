import type { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AiService } from '../src/ai/ai.service.js';
import type { ChatProvider, ChatRequest, ChatResponse } from '../src/ai/types.js';
import { AppModule } from '../src/app.module.js';
import { signToken } from '../src/auth/token.js';
import type { StaffRole } from '../src/common/domain.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { RedisService } from '../src/infra/redis.service.js';
import { INVESTIGATIONS_QUEUE } from '../src/investigations/queue.constants.js';
import { generateBank } from '../src/seed/bank.js';
import { writeBank } from '../src/seed/seed.js';

export const STAFF = {
  admin: { id: 'usr_ADMIN', email: 'admin@bank.example', staffId: '100001', name: 'Ada Admin' },
  analyst: { id: 'usr_ANALYST', email: 'ana@bank.example', staffId: '100002', name: 'Ana Lyst' },
  viewer: { id: 'usr_VIEWER', email: 'vi@bank.example', staffId: '100003', name: 'Vic Viewer' },
} as const;

export const bank = generateBank();

export function tokenFor(role: StaffRole) {
  return `Bearer ${signToken(STAFF[role].id, 'e2e-secret', 3600).token}`;
}

/** The model the tests talk to. Set `script` per test. */
export class FakeModel implements ChatProvider {
  requests: ChatRequest[] = [];
  script: (req: ChatRequest, turn: number) => ChatResponse | Promise<ChatResponse> = () => {
    throw new Error('no script');
  };

  async chat(req: ChatRequest): Promise<ChatResponse> {
    this.requests.push(req);
    return this.script(req, this.requests.length);
  }
}

export function fakeAi(model: FakeModel) {
  const profile = {
    name: 'hosted',
    label: 'Hosted',
    kind: 'hosted',
    baseUrl: 'https://x',
    model: 'fake-model',
  };
  return {
    active: async () => ({ profile, provider: model }),
    list: (active: string) => [
      {
        name: 'hosted',
        label: 'Hosted',
        kind: 'hosted',
        model: 'fake-model',
        endpoint: 'models.example',
        active: active === 'hosted',
      },
    ],
    find: () => profile,
    test: async () => ({ ok: true, latencyMs: 1, model: 'fake-model' }),
  };
}

export interface TestContext {
  app: INestApplication<App>;
  prisma: PrismaService;
  queue: Queue;
  model: FakeModel;
  http: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestContext> {
  const model = new FakeModel();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AiService)
    .useValue(fakeAi(model))
    .compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>({ logger: false });
  const { configureApp } = await import('../src/setup.js');
  configureApp(app);
  await app.init();
  return {
    app,
    prisma: app.get(PrismaService),
    queue: app.get<Queue>(getQueueToken(INVESTIGATIONS_QUEUE)),
    model,
    http: () => request(app.getHttpServer()),
  };
}

/** Fresh bank, the three test staff, empty queue and config cache. */
export async function resetState(ctx: TestContext) {
  await ctx.queue.obliterate({ force: true });
  await ctx.prisma.$executeRawUnsafe(
    'TRUNCATE agent_steps, analyst_actions, investigations, disputes, demo_cases, settlements, ledger_entries, transactions, devices, customers, merchants, staff, access_events, config CASCADE',
  );
  await writeBank(ctx.prisma, bank);
  await ctx.prisma.staff.createMany({
    data: (Object.keys(STAFF) as StaffRole[]).map((role) => ({
      ...STAFF[role],
      role,
      status: 'active' as const,
    })),
  });
  const redis = ctx.app.get(RedisService);
  await redis.ensureConnected();
  await redis.client.del('config:v1');
}

/** Waits until the dispute leaves the queue and the worker is done with it. */
export async function waitForStatus(
  ctx: TestContext,
  id: string,
  statuses: string[],
  timeoutMs = 20_000,
) {
  const started = Date.now();
  for (;;) {
    const d = await ctx.prisma.dispute.findUniqueOrThrow({ where: { id } });
    if (statuses.includes(d.status)) return d;
    if (Date.now() - started > timeoutMs) throw new Error(`dispute stuck in ${d.status}`);
    await new Promise((r) => setTimeout(r, 100));
  }
}

const field = (text: string, label: string) => new RegExp(`${label}: (\\S+)`).exec(text)?.[1] ?? '';

/**
 * A model that calls the given tools on the disputed transaction, then submits `decision`
 * citing the step IDs it got back.
 */
export function agentScript(tools: string[], decision: Record<string, unknown>) {
  return (req: ChatRequest): ChatResponse => {
    const user = req.messages.find((m) => m.role === 'user')?.content ?? '';
    const transactionId = field(String(user), 'Transaction ID');
    const customerId = field(String(user), 'Customer ID');
    const toolMessages = req.messages.filter((m) => m.role === 'tool');
    if (toolMessages.length === 0) {
      return {
        content: null,
        usage: { input: 1000, output: 50 },
        toolCalls: tools.map((name, i) => ({
          id: `call_${i}`,
          name,
          arguments: name.includes('customer')
            ? { customer_id: customerId }
            : { transaction_id: transactionId },
        })),
      };
    }
    const stepIds = toolMessages
      .map(
        (m) => JSON.parse((m as { content: string }).content) as { step_id?: string; ok?: boolean },
      )
      .filter((r) => r.ok && r.step_id)
      .map((r) => r.step_id!);
    return {
      content: null,
      usage: { input: 2000, output: 300 },
      toolCalls: [
        {
          id: 'call_submit',
          name: 'submit_decision',
          arguments: {
            evidence: stepIds
              .slice(0, 3)
              .map((id, i) => ({ tool_call_id: id, claim: `Finding ${i + 1}` })),
            ...decision,
          },
        },
      ],
    };
  };
}

export const FAILED_TRANSFER_DECISION = {
  classified_type: 'failed_transfer_debit',
  outcome: 'auto_resolve',
  confidence: 0.96,
  risk_level: 'low',
  fraud_suspected: false,
  recommended_action: 'reverse_debit',
  reasoning:
    'The transfer was debited but settlement failed and there is no reversal or credit on the ledger.',
  customer_message:
    'Your transfer did not complete, so we have returned the money to your account.',
};

export const FRAUD_DECISION = {
  classified_type: 'unauthorised_payment',
  outcome: 'escalate',
  confidence: 0.8,
  risk_level: 'high',
  fraud_suspected: true,
  recommended_action: 'manual_review',
  reasoning:
    'A new untrusted device away from home made a payment far above the usual amount to a new merchant.',
  customer_message:
    'We are reviewing this payment with our fraud team and will contact you shortly.',
};
