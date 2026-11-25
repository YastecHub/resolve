import { createHmac, timingSafeEqual } from 'node:crypto';

export interface TokenClaims {
  sub: string;
  iat: number;
  exp: number;
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString('base64url');
const HEADER = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

/** A minimal HS256 JWT. The shape matches what an SSO-issued token would carry. */
export function signToken(subject: string, secret: string, ttlSeconds: number, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const claims: TokenClaims = { sub: subject, iat, exp: iat + ttlSeconds };
  const payload = b64url(JSON.stringify(claims));
  return {
    token: `${HEADER}.${payload}.${sign(`${HEADER}.${payload}`, secret)}`,
    expiresAt: new Date(claims.exp * 1000),
  };
}

export function verifyToken(token: string, secret: string, now = Date.now()): TokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts as [string, string, string];
  if (header !== HEADER) return null;
  const expected = Buffer.from(sign(`${header}.${payload}`, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenClaims;
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') return null;
    return claims.exp * 1000 > now ? claims : null;
  } catch {
    return null;
  }
}
