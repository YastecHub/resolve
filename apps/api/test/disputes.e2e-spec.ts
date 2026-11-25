import { bank, createTestApp, resetState, tokenFor, type TestContext } from './helpers.js';

const caseOf = (scenario: string, n = 0) =>
  bank.demoCases.filter((c) => c.scenario === scenario)[n]!;

describe('dispute intake and listing', () => {
  let ctx: TestContext;
  const auth = () => tokenFor('analyst');

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(async () => {
    await resetState(ctx);
    await ctx.queue.pause();
  });
  afterAll(async () => {
    await ctx.queue.resume();
    await ctx.app.close();
  });

  const file = (transactionId: string, reasonCode = 'failed_transfer', customerNotes?: string) =>
    ctx
      .http()
      .post('/api/v1/disputes')
      .set('Authorization', auth())
      .send({ transactionId, reasonCode, customerNotes });

  it('files a dispute: 201, queued, amount from the transaction, 72h deadline, job enqueued', async () => {
    const demo = caseOf('failed_transfer');
    const res = await file(demo.transactionId, 'failed_transfer', '  sent 40k  ').expect(201);
    const data = res.body.data;
    expect(data).toMatchObject({
      status: 'queued',
      amountMinor: 4_000_000,
      transactionId: demo.transactionId,
      customerNotes: 'sent 40k',
      confidence: null,
    });
    expect(data.customerName).toMatch(/^\S+ [A-Z]\.$/);
    expect(new Date(data.slaDueAt).getTime() - new Date(data.createdAt).getTime()).toBe(
      72 * 3_600_000,
    );
    expect(await ctx.queue.getJob(data.id)).toBeTruthy();
  });

  it('rejects an invalid body with field errors', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/disputes')
      .set('Authorization', auth())
      .send({ transactionId: 42, reasonCode: 'nope', extra: true })
      .expect(400);
    const fields = res.body.error.fieldErrors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['transactionId', 'reasonCode', 'extra']));
  });

  it('404s an unknown transaction', async () => {
    const res = await file('txn_NOPE').expect(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('409s a second open dispute and names the open one', async () => {
    const demo = caseOf('failed_transfer');
    const first = await file(demo.transactionId).expect(201);
    const second = await file(demo.transactionId).expect(409);
    expect(second.body.error).toMatchObject({
      code: 'conflict',
      details: { disputeId: first.body.data.id },
    });
  });

  it('allows a new dispute once the old one is finished', async () => {
    const demo = caseOf('failed_transfer');
    const first = await file(demo.transactionId).expect(201);
    await ctx.prisma.dispute.update({
      where: { id: first.body.data.id },
      data: { status: 'rejected' },
    });
    await file(demo.transactionId).expect(201);
  });

  it('lists with paging, filters, search, sorting and counts by status', async () => {
    const ids: string[] = [];
    for (const scenario of ['failed_transfer', 'duplicate_charge', 'unauthorised']) {
      for (const n of [0, 1])
        ids.push((await file(caseOf(scenario, n).transactionId).expect(201)).body.data.id);
    }
    await ctx.prisma.dispute.update({ where: { id: ids[0] }, data: { status: 'awaiting_review' } });

    const page = await ctx
      .http()
      .get('/api/v1/disputes?pageSize=4&page=2')
      .set('Authorization', auth())
      .expect(200);
    expect(page.body.data).toHaveLength(2);
    expect(page.body.meta).toMatchObject({ page: 2, pageSize: 4, total: 6 });
    expect(page.body.meta.countsByStatus).toMatchObject({
      queued: 5,
      awaiting_review: 1,
      resolved: 0,
    });

    const filtered = await ctx
      .http()
      .get('/api/v1/disputes?status=awaiting_review')
      .set('Authorization', auth())
      .expect(200);
    expect(filtered.body.data.map((d: { id: string }) => d.id)).toEqual([ids[0]]);
    expect(filtered.body.meta.countsByStatus.queued).toBe(5);

    const twoStatuses = await ctx
      .http()
      .get('/api/v1/disputes?status=awaiting_review&status=queued')
      .set('Authorization', auth())
      .expect(200);
    expect(twoStatuses.body.meta.total).toBe(6);

    const byAmount = await ctx
      .http()
      .get('/api/v1/disputes?sort=amountMinor&order=asc')
      .set('Authorization', auth())
      .expect(200);
    const amounts = byAmount.body.data.map((d: { amountMinor: number }) => d.amountMinor);
    expect(amounts).toEqual([...amounts].sort((a: number, b: number) => a - b));

    const reference = page.body.data[0].reference as string;
    const search = await ctx
      .http()
      .get(`/api/v1/disputes?q=${encodeURIComponent(reference.toLowerCase())}`)
      .set('Authorization', auth())
      .expect(200);
    expect(search.body.data).toHaveLength(1);

    await ctx
      .http()
      .get('/api/v1/disputes?sort=nope&pageSize=500')
      .set('Authorization', auth())
      .expect(400);
  });

  it('returns the detail with transaction and customer, and 404s an unknown ID', async () => {
    const demo = caseOf('duplicate_charge');
    const created = await file(demo.transactionId, 'duplicate').expect(201);
    const res = await ctx
      .http()
      .get(`/api/v1/disputes/${created.body.data.id}`)
      .set('Authorization', auth())
      .expect(200);
    expect(res.body.data).toMatchObject({
      dispute: { id: created.body.data.id },
      transaction: { id: demo.transactionId, merchantName: expect.any(String) },
      customer: { name: expect.stringMatching(/\.$/) },
      investigation: null,
      analystActions: [],
    });
    await ctx.http().get('/api/v1/disputes/dsp_NOPE').set('Authorization', auth()).expect(404);
  });
});
