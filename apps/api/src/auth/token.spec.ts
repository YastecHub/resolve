import { signToken, verifyToken } from './token.js';

const secret = 'test-secret';

describe('tokens', () => {
  it('round-trips the subject', () => {
    const { token, expiresAt } = signToken('usr_1', secret, 60, 1_000_000);
    expect(expiresAt.toISOString()).toBe(new Date(1_060_000).toISOString());
    expect(verifyToken(token, secret, 1_000_000)).toMatchObject({ sub: 'usr_1' });
  });

  it('rejects an expired token', () => {
    const { token } = signToken('usr_1', secret, 60, 0);
    expect(verifyToken(token, secret, 61_000)).toBeNull();
  });

  it('rejects a wrong secret or an edited payload', () => {
    const { token } = signToken('usr_1', secret, 60);
    expect(verifyToken(token, 'other')).toBeNull();
    const [h, , s] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'usr_admin', iat: 0, exp: 9e9 })).toString(
      'base64url',
    );
    expect(verifyToken(`${h}.${forged}.${s}`, secret)).toBeNull();
  });

  it('rejects garbage', () => {
    expect(verifyToken('nope', secret)).toBeNull();
    expect(verifyToken('a.b.c', secret)).toBeNull();
  });
});
