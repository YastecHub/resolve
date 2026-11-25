import {
  agentScript,
  bank,
  createTestApp,
  FAILED_TRANSFER_DECISION,
  FRAUD_DECISION,
  resetState,
  tokenFor,
  waitForStatus,
  type TestContext,
} from './helpers.js';

const caseOf = (scenario: string, n = 0) =>
  bank.demoCases.filter((c) => c.scenario === scenario)[n]!;
const TOOLS = ['get_transaction', 'get_ledger_entries', 'get_settlement_status'];
const MESSAGE = 'We have reviewed your dispute and returned the money to your account.';

describe('analyst actions', () => {
  let ctx: TestContext;
  const as = (role: 'analyst' | 'viewer' = 'analyst') => tokenFor(role);

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetState(ctx));
  afterAll(() => ctx.app.close());

  /** Files a dispute and lets the fake agent take it to review. */
  async function inReview(decision: Record<string, unknown>, scenario = 'failed_transfer', n = 6) {
    ctx.model.script = agentScript(TOOLS, decision);
    const res = await ctx
      .http()
      .post('/api/v1/disputes')
      .set('Authorization', as())
      .send({ transactionId: caseOf(scenario, n).transactionId, reasonCode: 'failed_transfer' })
      .expect(201);
    await waitForStatus(ctx, res.body.data.id, ['awaiting_review']);
    return res.body.data.id as string;
  }

  const post = (
    id: string,
    action: string,
    body: object = {},
    role: 'analyst' | 'viewer' = 'analyst',
  ) =>
    ctx.http().post(`/api/v1/disputes/${id}/${action}`).set('Authorization', as(role)).send(body);

  it("approves the agent's recommendation, executes it once, and is a no-op when repeated", async () => {
    // Case 6 is above the value cap, so the clean decision still lands in review.
    const id = await inReview(FAILED_TRANSFER_DECISION);
    const res = await post(id, 'approve', { message: MESSAGE }).expect(200);
    expect(res.body.data.dispute).toMatchObject({
      status: 'resolved',
      resolvedBy: 'analyst',
      resolutionAction: 'reverse_debit',
    });
    expect(res.body.data.investigation.customerMessage).toBe(MESSAGE);
    expect(res.body.data.analystActions).toEqual([
      expect.objectContaining({ action: 'approve', actorEmail: 'ana@bank.example' }),
    ]);

    await post(id, 'approve').expect(200);
    const reversals = await ctx.prisma.ledgerEntry.count({
      where: { transactionId: caseOf('failed_transfer', 6).transactionId, entryType: 'reversal' },
    });
    expect(reversals).toBe(1);
    expect(await ctx.prisma.analystAction.count({ where: { disputeId: id } })).toBe(1);
  });

  it('refuses to approve a manual-review recommendation', async () => {
    const id = await inReview(FRAUD_DECISION, 'unauthorised', 0);
    const res = await post(id, 'approve').expect(409);
    expect(res.body.error).toMatchObject({
      code: 'invalid_state',
      message: 'Choose an action with Override.',
    });
  });

  it('overrides with no action, which rejects the dispute', async () => {
    const id = await inReview(FRAUD_DECISION, 'unauthorised', 0);
    await post(id, 'override', { action: 'none', reason: 'short' }).expect(400);
    const res = await post(id, 'override', {
      action: 'none',
      reason: 'Customer confirmed the payment was theirs.',
    }).expect(200);
    expect(res.body.data.dispute).toMatchObject({ status: 'rejected', resolutionAction: 'none' });
    expect(res.body.data.analystActions[0]).toMatchObject({
      action: 'override',
      overrideAction: 'none',
    });
  });

  it('escalates from review only', async () => {
    const id = await inReview(FRAUD_DECISION, 'unauthorised', 0);
    await post(id, 'escalate', { reason: 'Needs the fraud team to look.' }).expect(200);
    const again = await post(id, 'escalate', { reason: 'Needs the fraud team to look.' }).expect(
      409,
    );
    expect(again.body.error).toMatchObject({
      code: 'invalid_state',
      details: { status: 'escalated' },
    });
    // An escalated case can still be overridden.
    await post(id, 'override', {
      action: 'reverse_debit',
      reason: 'Fraud team confirmed it.',
    }).expect(200);
  });

  it('edits the customer message and records it', async () => {
    const id = await inReview(FRAUD_DECISION, 'unauthorised', 0);
    const res = await ctx
      .http()
      .patch(`/api/v1/disputes/${id}/message`)
      .set('Authorization', as())
      .send({ message: MESSAGE })
      .expect(200);
    expect(res.body.data.investigation.customerMessage).toBe(MESSAGE);
    expect(res.body.data.analystActions[0].action).toBe('edit_message');
  });

  it('retries only failed disputes', async () => {
    const id = await inReview(FRAUD_DECISION, 'unauthorised', 0);
    await post(id, 'retry').expect(409);
    await ctx.prisma.dispute.update({
      where: { id },
      data: { status: 'failed', lastError: 'model down' },
    });
    await ctx.queue.pause();
    const res = await post(id, 'retry').expect(200);
    expect(res.body.data.dispute).toMatchObject({ status: 'queued', lastError: null });
    expect(await ctx.queue.getJob(`${id}-attempt-2`)).toBeTruthy();
    await ctx.queue.resume();
  });

  it('blocks viewers and 404s unknown disputes', async () => {
    const id = await inReview(FRAUD_DECISION, 'unauthorised', 0);
    await post(id, 'escalate', { reason: 'Needs the fraud team to look.' }, 'viewer').expect(403);
    await post('dsp_NOPE', 'escalate', { reason: 'Needs the fraud team to look.' }).expect(404);
  });

  it('refunds the later of two duplicate payments', async () => {
    const id = await inReview(FRAUD_DECISION, 'duplicate_charge', 0);
    await post(id, 'override', {
      action: 'refund_duplicate',
      reason: 'Two identical charges a minute apart.',
    }).expect(200);
    const original = bank.transactions.find(
      (t) => t.id === caseOf('duplicate_charge', 0).transactionId,
    )!;
    const twin = bank.transactions.find(
      (t) =>
        t.id !== original.id &&
        t.merchantId === original.merchantId &&
        t.amountMinor === original.amountMinor &&
        t.customerId === original.customerId,
    )!;
    const refunds = await ctx.prisma.ledgerEntry.findMany({ where: { entryType: 'refund' } });
    expect(refunds.map((r) => r.transactionId)).toEqual([twin.id]);
  });

  it('will not refund a "duplicate" with no twin inside the window', async () => {
    const id = await inReview(FRAUD_DECISION, 'duplicate_charge', 6);
    const res = await post(id, 'override', {
      action: 'refund_duplicate',
      reason: 'Customer says charged twice.',
    }).expect(409);
    expect(res.body.error.details.reason).toBe('no_duplicate_pair');
    expect(await ctx.prisma.analystAction.count({ where: { disputeId: id } })).toBe(0);
  });

  it('auto-resolves without the agent being able to reach the executor twice', async () => {
    ctx.model.script = agentScript(TOOLS, FAILED_TRANSFER_DECISION);
    const res = await ctx
      .http()
      .post('/api/v1/disputes')
      .set('Authorization', as())
      .send({
        transactionId: caseOf('failed_transfer', 1).transactionId,
        reasonCode: 'failed_transfer',
      })
      .expect(201);
    await waitForStatus(ctx, res.body.data.id, ['resolved']);
    await post(res.body.data.id, 'override', {
      action: 'none',
      reason: 'Trying to undo it.',
    }).expect(200);
    expect(
      (await ctx.prisma.dispute.findUniqueOrThrow({ where: { id: res.body.data.id } })).status,
    ).toBe('resolved');
  });
});
