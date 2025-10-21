import bcrypt from 'bcryptjs';
import { ensureAdmin } from '@/lib/admin-auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { z } from 'zod';

const runtime = 'nodejs';
export { runtime };

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

function serializeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    personType: user.personType || 'natural',
    phone: user.phone || '',
    address: user.address || '',
    rut: user.rut || '',
    businessName: user.businessName || '',
    avatarUrl: user.avatarUrl || '',
    createdAt: user.createdAt?.toISOString() || null,
    updatedAt: user.updatedAt?.toISOString() || null,
  };
}

const createUserSchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre es obligatorio.')
      .max(80, 'El nombre es demasiado largo.')
      .transform((value) => value.trim()),
    email: z
      .string()
      .email('Email invalido.')
      .max(254)
      .transform((value) => value.trim().toLowerCase()),
    password: z
      .string()
      .min(6, 'La contrasena debe tener al menos 6 caracteres.')
      .max(200),
    role: z.enum(['user', 'admin']).optional(),
    personType: z.enum(['natural', 'empresa']).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(200).optional(),
    rut: z.string().max(30).optional(),
    businessName: z.string().max(120).optional(),
    avatarUrl: z
      .string()
      .url('La URL del avatar no es valida.')
      .optional(),
  })
  .strict();

export async function GET(req) {
  try {
    await ensureAdmin();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const query = {};

    const search = (searchParams.get('q') || '').trim();
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rut: { $regex: search, $options: 'i' } },
      ];
    }

    const role = (searchParams.get('role') || '').trim().toLowerCase();
    if (role === 'admin' || role === 'user') {
      query.role = role;
    }

    const users = await User.find(query).sort({ createdAt: -1 }).limit(200).lean();
    return json({ users: users.map(serializeUser) });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al obtener usuarios.' },
      { status: err.status || 500 },
    );
  }
}

export async function POST(req) {
  try {
    const { isSuperAdmin } = await ensureAdmin();
    await dbConnect();

    const raw = await req.json().catch(() => ({}));
    const parsed = createUserSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'Datos invalidos.';
      return json({ ok: false, message: first }, { status: 400 });
    }

    const data = parsed.data;
    if (data.role === 'admin' && !isSuperAdmin) {
      return json({ ok: false, message: 'Solo el super admin puede crear administradores.' }, { status: 403 });
    }

    const existing = await User.findOne({ email: data.email }).lean();
    if (existing) {
      return json({ ok: false, message: 'El email ya esta registrado.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const userDoc = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role === 'admin' ? 'admin' : 'user',
      personType: data.personType || 'natural',
      phone: data.phone || '',
      address: data.address || '',
      rut: data.rut || '',
      businessName: data.businessName || '',
      avatarUrl: data.avatarUrl || '',
    });

    return json({ ok: true, user: serializeUser(userDoc) }, { status: 201 });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al crear usuario.' },
      { status: err.status || 500 },
    );
  }
}

