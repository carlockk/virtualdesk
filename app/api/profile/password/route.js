import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSession, clearSessionCookie, signSession, setSessionCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

const passwordSchema = z.object({
  password: z
    .string()
    .min(6, 'La contrasena debe tener al menos 6 caracteres.')
    .max(200, 'La contrasena es demasiado larga.'),
});

export async function PATCH(req) {
  try {
    const session = getSession();
    if (!session) {
      return json({ ok: false, message: 'Autenticacion requerida.' }, { status: 401 });
    }

    const raw = await req.json().catch(() => ({}));
    const parsed = passwordSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'Datos invalidos.';
      return json({ ok: false, message: first }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(session.uid);
    if (!user) {
      const res = json({ ok: false, message: 'Usuario no encontrado.' }, { status: 404 });
      clearSessionCookie(res);
      return res;
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    user.passwordHash = passwordHash;
    await user.save();

    const token = signSession({
      uid: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    });

    const res = json({ ok: true, message: 'Contrasena actualizada correctamente.' });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    return json({ ok: false, message: err.message || 'Error al actualizar la contrasena.' }, { status: 500 });
  }
}
