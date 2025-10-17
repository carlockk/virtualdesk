'use server';

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'session';

export async function signSession(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function setSessionCookie(res, token) {
  const directives = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=604800',
  ];

  if (process.env.NODE_ENV === 'production') {
    directives.push('Secure');
  }

  res.headers.set('Set-Cookie', directives.join('; '));
}

export async function clearSessionCookie(res) {
  res.headers.set('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
}

function parseCookieHeader(headerValue) {
  if (!headerValue) return null;
  const parts = headerValue.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.split('=');
    if (!rawKey) continue;
    const key = rawKey.trim();
    if (key !== COOKIE_NAME) continue;
    const value = rest.join('=').trimStart();
    try {
      return decodeURIComponent(value || '');
    } catch {
      return value || '';
    }
  }
  return null;
}

export async function getSession(req) {
  let token = null;

  if (req?.headers?.get) {
    token = parseCookieHeader(req.headers.get('cookie'));
  }

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value || null;
  }

  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
