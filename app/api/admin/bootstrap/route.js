import { getSession, signSession, setSessionCookie } from '@/lib/auth';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function POST(req) {
  const session = await getSession(req);
  if (!session) {
    return json({ ok: false, message: 'Autenticación requerida' }, { status: 401 });
  }

  const email = (session.email || '').toLowerCase();
  if (email !== SUPER_ADMIN_EMAIL) {
    return json({ ok: false, message: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const user = await User.findById(session.uid);
  if (!user) {
    return json({ ok: false, message: 'Usuario no encontrado' }, { status: 404 });
  }

  if (user.role === 'admin') {
    const token = await signSession({
      uid: String(user._id),
      name: user.name,
      email: user.email,
      role: 'admin',
    });
    const res = json({ ok: true, message: 'Ya tienes rol de administrador.' });
    await setSessionCookie(res, token);
    return res;
  }

  user.role = 'admin';
  await user.save();

  const token = await signSession({
    uid: String(user._id),
    name: user.name,
    email: user.email,
    role: 'admin',
  });

  const res = json({ ok: true, message: 'Rol de administrador otorgado.' });
  await setSessionCookie(res, token);
  return res;
}

export async function GET() {
  return json({ ok: false, message: 'Método no permitido' }, { status: 405 });
}


