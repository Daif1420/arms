import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

export const SESSION_COOKIE = 'arms_session';
const SESSION_SECONDS = 60 * 60 * 12;

type SessionPayload = { sub: string; username: string; iat: number; exp: number };

let fallbackSecret: string | null = null;

function secret(): string {
  const value = process.env.ARMS_SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error('ARMS_SESSION_SECRET must contain at least 32 characters.');
  }
  if (!fallbackSecret) {
    fallbackSecret = randomBytes(32).toString('hex');
  }
  return fallbackSecret;
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createSession(user: { id: string; username: string }) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.id,
    username: user.username,
    iat: now,
    exp: now + SESSION_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const value = `${encoded}.${sign(encoded)}`;
  return { value, maxAge: SESSION_SECONDS };
}

function cookieValue(req: VercelRequest, name: string) {
  const cookieHeader = req.headers.cookie;
  const raw = Array.isArray(cookieHeader) ? (cookieHeader[0] || '') : (cookieHeader || '');
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function bearerToken(req: VercelRequest): string {
  const authHeader = req.headers.authorization;
  const raw = Array.isArray(authHeader) ? (authHeader[0] || '') : (authHeader || '');
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match ? match[1].trim() : '';
}

export function readSession(req: VercelRequest): SessionPayload | null {
  try {
    const value = cookieValue(req, SESSION_COOKIE) || bearerToken(req);
    const [encoded, supplied] = value.split('.');
    if (!encoded || !supplied) return null;
    const expected = Buffer.from(sign(encoded));
    const actual = Buffer.from(supplied);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.sub || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isHttpsRequest(req?: VercelRequest): boolean {
  if (!req) return process.env.NODE_ENV === 'production';
  const proto = req.headers['x-forwarded-proto'];
  const protoStr = Array.isArray(proto) ? proto[0] : proto;
  if (protoStr) return protoStr.toLowerCase().includes('https');
  return Boolean((req.socket as { encrypted?: boolean } | undefined)?.encrypted);
}

export function sessionCookie(value: string, maxAge: number, req?: VercelRequest) {
  const attrs = isHttpsRequest(req) ? 'SameSite=None; Secure' : 'SameSite=Lax';
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; ${attrs}; Max-Age=${maxAge}`;
}
