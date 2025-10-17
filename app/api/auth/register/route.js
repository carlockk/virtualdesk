import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signSession, setSessionCookie } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2).max(80).transform((s) => s.trim()),
  email: z.string().email().max(254),
  password: z.string().min(6).max(200),
});

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function POST(req) {
  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      return json({ ok: false, message: 'Datos inválidos' }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const emailNorm = email.trim().toLowerCase();

    await dbConnect();

    // Verifica duplicados
    const existing = await User.findOne({ email: emailNorm }).lean();
    if (existing) {
      return json({ ok: false, message: 'Email ya registrado' }, { status: 409 });
    }

    // Crea usuario
    const passwordHash = await bcrypt.hash(password, 10);
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const role = adminEmails.includes(emailNorm) ? 'admin' : 'user';

    const userDoc = await User.create({ name, email: emailNorm, passwordHash, role });
    const user = userDoc.toObject();

    const token = signSession({
      uid: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const res = json({
      ok: true,
      user: { name: user.name, email: user.email, role: user.role },
    });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    // log interno si quieres: console.error(err)
    return json({ ok: false, message: 'Error del servidor' }, { status: 500 });
  }
}
