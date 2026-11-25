import { bank, createTestApp, resetState, STAFF, tokenFor, type TestContext } from './helpers.js';

describe('auth', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(() => resetState(ctx));
  afterAll(() => ctx.app.close());

  it('signs in with email and staff ID, and /me returns the permissions', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/auth/sign-in')
      .send({ email: ' ANA@bank.example ', staffId: STAFF.analyst.staffId })
      .expect(200);
    expect(res.body.data.user).toMatchObject({ id: STAFF.analyst.id, role: 'analyst' });
    const me = await ctx
      .http()
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${res.body.data.token}`)
      .expect(200);
    expect(me.body.data.permissions).toEqual(['cases.view', 'audit.view', 'cases.act']);
    expect(me.body.data.lastSignInAt).not.toBeNull();
  });

  it('activates an invited account on first sign-in and records it', async () => {
    await ctx.prisma.staff.create({
      data: {
        id: 'usr_NEW',
        email: 'new@bank.example',
        staffId: '200001',
        name: 'New Person',
        role: 'viewer',
      },
    });
    await ctx
      .http()
      .post('/api/v1/auth/sign-in')
      .send({ email: 'new@bank.example', staffId: '200001' })
      .expect(200);
    expect((await ctx.prisma.staff.findUniqueOrThrow({ where: { id: 'usr_NEW' } })).status).toBe(
      'active',
    );
    expect(await ctx.prisma.accessEvent.count({ where: { action: 'first_sign_in' } })).toBe(1);
  });

  it('gives the same 401 for a wrong email or a wrong staff ID', async () => {
    const wrongId = await ctx
      .http()
      .post('/api/v1/auth/sign-in')
      .send({ email: STAFF.analyst.email, staffId: '9999' })
      .expect(401);
    const wrongEmail = await ctx
      .http()
      .post('/api/v1/auth/sign-in')
      .send({ email: 'nobody@bank.example', staffId: STAFF.analyst.staffId })
      .expect(401);
    expect(wrongId.body.error.message).toBe(wrongEmail.body.error.message);
  });

  it('validates the sign-in body', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/auth/sign-in')
      .send({ email: 'nope', staffId: '12' })
      .expect(400);
    expect(res.body.error.fieldErrors.map((e: { field: string }) => e.field)).toEqual([
      'email',
      'staffId',
    ]);
  });

  it('blocks a suspended account at sign-in and on its existing token', async () => {
    await ctx.prisma.staff.update({
      where: { id: STAFF.analyst.id },
      data: { status: 'suspended' },
    });
    await ctx
      .http()
      .post('/api/v1/auth/sign-in')
      .send({ email: STAFF.analyst.email, staffId: STAFF.analyst.staffId })
      .expect(403);
    await ctx.http().get('/api/v1/me').set('Authorization', tokenFor('analyst')).expect(403);
  });

  it('rejects a missing or forged token', async () => {
    await ctx.http().get('/api/v1/me').expect(401);
    await ctx.http().get('/api/v1/me').set('Authorization', 'Bearer a.b.c').expect(401);
  });

  it('enforces permissions by role', async () => {
    await ctx.http().get('/api/v1/disputes').set('Authorization', tokenFor('viewer')).expect(200);
    await ctx
      .http()
      .post('/api/v1/disputes')
      .set('Authorization', tokenFor('viewer'))
      .send({ transactionId: bank.demoCases[0]!.transactionId, reasonCode: 'failed_transfer' })
      .expect(403);
    await ctx.http().get('/api/v1/team').set('Authorization', tokenFor('analyst')).expect(403);
    await ctx
      .http()
      .put('/api/v1/config')
      .set('Authorization', tokenFor('analyst'))
      .send({})
      .expect(403);
  });
});
