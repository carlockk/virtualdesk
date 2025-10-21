import { getSession, clearSessionCookie, signSession, setSessionCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { z } from 'zod';
import { isUserSuperAdmin } from '@/lib/admin-auth';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

const profileSchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(80, 'El nombre es demasiado largo.')
      .transform((value) => value.trim())
      .optional(),
    personType: z.enum(['natural', 'empresa']).optional(),
    phone: z
      .string()
      .max(30, 'El telefono es demasiado largo.')
      .transform((value) => value.trim())
      .optional(),
    address: z
      .string()
      .max(200, 'La direccion es demasiado larga.')
      .transform((value) => value.trim())
      .optional(),
    rut: z
      .string()
      .max(30, 'El RUT es demasiado largo.')
      .transform((value) => value.trim())
      .optional(),
    businessName: z
      .string()
      .max(120, 'La razon social es demasiado larga.')
      .transform((value) => value.trim())
      .optional(),
    avatarUrl: z
      .string()
      .url('La URL del avatar no es valida.')
      .optional(),
  })
  .strict();

function serializeUser(userDoc) {
  return {
    id: String(userDoc._id),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role || 'user',
    isSuperAdmin: isUserSuperAdmin(userDoc),
    avatarUrl: userDoc.avatarUrl || '',
    personType: userDoc.personType || 'natural',
    phone: userDoc.phone || '',
    address: userDoc.address || '',
    rut: userDoc.rut || '',
    businessName: userDoc.businessName || '',
  };
}

export async function GET() {
  try {
    const session = getSession();
    if (!session) return json({ user: null });

    await dbConnect();
    const user = await User.findById(session.uid).lean();
    if (!user) {
      const res = json({ user: null });
      clearSessionCookie(res);
      return res;
    }

    return json({ user: serializeUser(user) });
  } catch (err) {
    return json({ message: err.message || 'Error del servidor' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = getSession();
    if (!session) {
      return json({ ok: false, message: 'Autenticacion requerida.' }, { status: 401 });
    }

    const raw = await req.json().catch(() => ({}));
    const parsed = profileSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'Datos invalidos';
      return json({ ok: false, message: first }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(session.uid);
    if (!user) {
      const res = json({ ok: false, message: 'Usuario no encontrado.' }, { status: 404 });
      clearSessionCookie(res);
      return res;
    }

    const updates = parsed.data;

    if (typeof updates.name !== 'undefined') user.name = updates.name;
    if (typeof updates.personType !== 'undefined') user.personType = updates.personType;
    if (typeof updates.phone !== 'undefined') user.phone = updates.phone;
    if (typeof updates.address !== 'undefined') user.address = updates.address;
    if (typeof updates.rut !== 'undefined') user.rut = updates.rut;
    if (typeof updates.businessName !== 'undefined') user.businessName = updates.businessName;
    if (typeof updates.avatarUrl !== 'undefined') user.avatarUrl = updates.avatarUrl;

    await user.save();

    const token = signSession({
      uid: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    });

    const res = json({ ok: true, user: serializeUser(user) });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    return json({ ok: false, message: err.message || 'Error del servidor' }, { status: 500 });
  }
}
