import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signSession, setSessionCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(6).max(200),
});

// Un hash de costo similar para defender contra timing attacks cuando no existe el usuario
// (es un hash de "placeholderpassword" con cost 10; puedes regenerarlo si usas otro cost)
const DUMMY_HASH = '$2a$10$2q8K5Z3zQJg9H0yK9k3vqeSREbUQ3v8mE3i.IqHdpQm2.3RkJ8N8e';

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
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      return json({ ok: false, message: 'Datos inválidos' }, { status: 400 });
    }
    const { email, password } = parsed.data;
    const emailNorm = email.trim().toLowerCase();

    await dbConnect();

    // Busca usuario; si no existe, compara con DUMMY para igualar tiempos
    const user = await User.findOne({ email: emailNorm }).lean();
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const ok = await bcrypt.compare(password, hashToCompare);

    if (!user || !ok) {
      // mismo mensaje para evitar enumeración
      return json({ ok: false, message: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = signSession({
      uid: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    });

    const res = json({
      ok: true,
      user: { name: user.name, email: user.email, role: user.role || 'user' },
    });
    setSessionCookie(res, token); // asegúrate de que ponga httpOnly, secure en prod, sameSite=lax, path=/, maxAge
    return res;
  } catch (err) {
    // log interno si quieres: console.error(err)
    return json({ ok: false, message: 'Error del servidor' }, { status: 500 });
  }
}
