import {
  agentScript,
  bank,
  createTestApp,
  FAILED_TRANSFER_DECISION,
  resetState,
  STAFF,
  tokenFor,
  waitForStatus,
  type TestContext,
} from './helpers.js';

describe('config, team, metrics, audit and demo', () => {
  let ctx: TestContext;
  const admin = () => tokenFor('admin');

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetState(ctx));
  afterAll(() => ctx.app.close());

  describe('config', () => {
    it('returns defaults, applies a partial update, and serves the new value straight away', async () => {
      const before = await ctx
        .http()
        .get('/api/v1/config')
        .set('Authorization', tokenFor('viewer'))
        .expect(200);
      expect(before.body.data.policy).toMatchObject({
        confidenceThreshold: 0.9,
        valueCapMinor: 5_000_000,
      });

      const res = await ctx
        .http()
        .put('/api/v1/config')
        .set('Authorization', admin())
        .send({ policy: { confidenceThreshold: 0.8 }, ai: { activeProfile: 'onprem' } })
        .expect(200);
      expect(res.body.data.policy).toMatchObject({
        confidenceThreshold: 0.8,
        valueCapMinor: 5_000_000,
      });
      expect(res.body.data.ai.activeProfile).toBe('onprem');

      const after = await ctx
        .http()
        .get('/api/v1/config')
        .set('Authorization', tokenFor('viewer'))
        .expect(200);
      expect(after.body.data.policy.confidenceThreshold).toBe(0.8);
      expect(
        (
          await ctx.prisma.config.findUniqueOrThrow({
            where: { key: 'policy.confidenceThreshold' },
          })
        ).updatedBy,
      ).toBe(STAFF.admin.email);
    });

    it('rejects invalid values', async () => {
      const put = (body: object) =>
        ctx.http().put('/api/v1/config').set('Authorization', admin()).send(body);
      await put({ policy: { confidenceThreshold: 1.5 } }).expect(400);
      await put({ agent: { maxSteps: 31 } }).expect(400);
      await put({ ai: { activeProfile: 'nope' } }).expect(400);
      await put({ policy: { autoTypes: ['unauthorised_payment'] } }).expect(400);
      await put({ nope: true }).expect(400);
    });

    it('lists AI profiles without keys', async () => {
      const res = await ctx
        .http()
        .get('/api/v1/config/ai-profiles')
        .set('Authorization', tokenFor('viewer'))
        .expect(200);
      expect(res.body.data[0]).toMatchObject({ name: 'hosted', active: true });
      expect(JSON.stringify(res.body.data)).not.toMatch(/key/i);
      await ctx
        .http()
        .post('/api/v1/config/ai-profiles/hosted/test')
        .set('Authorization', admin())
        .expect(200);
    });
  });

  describe('team', () => {
    const invite = (body: object) =>
      ctx.http().post('/api/v1/team').set('Authorization', admin()).send(body);

    it('invites, then 409s a taken email or staff ID', async () => {
      const res = await invite({
        name: 'Bola Ige',
        email: 'Bola@Bank.example',
        staffId: '300001',
        role: 'analyst',
      }).expect(201);
      expect(res.body.data).toMatchObject({
        email: 'bola@bank.example',
        status: 'invited',
        invitedBy: STAFF.admin.email,
      });
      const dupEmail = await invite({
        name: 'Bola Two',
        email: 'bola@bank.example',
        staffId: '300002',
        role: 'viewer',
      }).expect(409);
      expect(dupEmail.body.error.details.field).toBe('email');
      const dupId = await invite({
        name: 'Bola Two',
        email: 'b2@bank.example',
        staffId: '300001',
        role: 'viewer',
      }).expect(409);
      expect(dupId.body.error.details.field).toBe('staffId');
      await invite({ name: 'X', email: 'bad', staffId: '1', role: 'boss' }).expect(400);
    });

    it('changes roles, suspends and reinstates, and records each change', async () => {
      const patch = (id: string, body: object) =>
        ctx.http().patch(`/api/v1/team/${id}`).set('Authorization', admin()).send(body);
      await patch(STAFF.analyst.id, { role: 'admin' }).expect(200);
      await patch(STAFF.viewer.id, { status: 'suspended' }).expect(200);
      await patch(STAFF.viewer.id, { status: 'active' }).expect(200);
      await patch(STAFF.viewer.id, { role: 'admin', status: 'active' }).expect(400);
      await patch(STAFF.viewer.id, {}).expect(400);
      await patch('usr_NOPE', { role: 'viewer' }).expect(404);
      const events = await ctx
        .http()
        .get('/api/v1/audit/access')
        .set('Authorization', tokenFor('viewer'))
        .expect(200);
      expect(events.body.data.map((e: { action: string }) => e.action)).toEqual([
        'reinstated',
        'suspended',
        'role_changed',
      ]);
      expect(events.body.data[2].detail).toBe('analyst → admin');
    });

    it('stops self changes', async () => {
      const self = await ctx
        .http()
        .patch(`/api/v1/team/${STAFF.admin.id}`)
        .set('Authorization', admin())
        .send({ role: 'viewer' })
        .expect(409);
      expect(self.body.error.code).toBe('self_change');
      await ctx.prisma.staff.create({
        data: {
          id: 'usr_ADMIN2',
          email: 'a2@bank.example',
          staffId: '100009',
          name: 'Second Admin',
          role: 'admin',
          status: 'active',
        },
      });
      // The second admin can demote the first, but not themselves. (The last-admin rule is
      // unit-tested; through the API an admin can only reach it by changing their own access.)
      const { signToken } = await import('../src/auth/token.js');
      const second = `Bearer ${signToken('usr_ADMIN2', 'e2e-secret', 600).token}`;
      await ctx
        .http()
        .patch(`/api/v1/team/${STAFF.admin.id}`)
        .set('Authorization', second)
        .send({ role: 'analyst' })
        .expect(200);
      const last = await ctx
        .http()
        .patch('/api/v1/team/usr_ADMIN2')
        .set('Authorization', second)
        .send({ role: 'analyst' })
        .expect(409);
      expect(last.body.error.code).toBe('self_change');
    });
  });

  describe('demo, metrics and audit', () => {
    it('submits demo cases, evaluates them, reports metrics, and resets', async () => {
      ctx.model.script = agentScript(
        ['get_transaction', 'get_ledger_entries', 'get_settlement_status'],
        FAILED_TRANSFER_DECISION,
      );
      const submitted = await ctx
        .http()
        .post('/api/v1/demo/submit')
        .set('Authorization', admin())
        .send({ count: 2, types: ['failed_transfer_debit'] })
        .expect(201);
      expect(submitted.body.data).toMatchObject({ created: 2, remaining: 38 });
      for (const id of submitted.body.data.disputeIds) await waitForStatus(ctx, id, ['resolved']);

      const evaluation = await ctx
        .http()
        .get('/api/v1/demo/eval')
        .set('Authorization', admin())
        .expect(200);
      expect(evaluation.body.data.summary).toMatchObject({
        totalCases: 40,
        submitted: 2,
        evaluated: 2,
        classificationAccuracy: 1,
      });
      expect(evaluation.body.data.accuracy).toBe(1);

      const metrics = await ctx
        .http()
        .get('/api/v1/metrics')
        .set('Authorization', tokenFor('viewer'))
        .expect(200);
      expect(metrics.body.data).toMatchObject({ resolvedCount: 2, autoResolutionRate: 1 });
      expect(metrics.body.data.throughputByHour).toHaveLength(24);
      expect(metrics.body.data.providerUsage[0]).toMatchObject({ profile: 'hosted', count: 2 });

      const investigations = await ctx
        .http()
        .get('/api/v1/audit/investigations?pageSize=1')
        .set('Authorization', tokenFor('viewer'))
        .expect(200);
      expect(investigations.body.meta.total).toBe(2);
      expect(investigations.body.data).toHaveLength(1);
      await ctx
        .http()
        .get('/api/v1/audit/actions')
        .set('Authorization', tokenFor('viewer'))
        .expect(200);

      await ctx
        .http()
        .post('/api/v1/demo/submit')
        .set('Authorization', tokenFor('analyst'))
        .send({})
        .expect(403);
      await ctx.http().post('/api/v1/demo/reset').set('Authorization', admin()).expect(200);
      expect(await ctx.prisma.dispute.count()).toBe(0);
      expect(await ctx.prisma.demoCase.count({ where: { consumedDisputeId: null } })).toBe(40);
      expect(await ctx.prisma.staff.count()).toBe(3);
      expect(await ctx.prisma.accessEvent.count({ where: { action: 'demo_reset' } })).toBe(1);
      expect(bank.customers).toHaveLength(await ctx.prisma.customer.count());
    });
  });
});
