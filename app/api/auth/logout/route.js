import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const res = new Response(JSON.stringify({ ok: true }));
  await clearSessionCookie(res);
  return res;
}
