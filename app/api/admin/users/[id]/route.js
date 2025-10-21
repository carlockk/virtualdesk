import bcrypt from 'bcryptjs';
import { ensureAdmin } from '@/lib/admin-auth';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { z } from 'zod';

export const runtime = 'nodejs';

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

const updateSchema = z
  .object({
    name: z
      .string()
      .min(2, 'El nombre es obligatorio.')
      .max(80, 'El nombre es demasiado largo.')
      .transform((value) => value.trim())
      .optional(),
    email: z
      .string()
      .email('Email invalido.')
      .max(254)
      .transform((value) => value.trim().toLowerCase())
      .optional(),
    password: z
      .string()
      .min(6, 'La contrasena debe tener al menos 6 caracteres.')
      .max(200)
      .optional(),
    role: z.enum(['user', 'admin']).optional(),
    personType: z.enum(['natural', 'empresa']).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(200).optional(),
    rut: z.string().max(30).optional(),
    businessName: z.string().max(120).optional(),
    avatarUrl: z
      .string()
      .max(500)
      .optional(),
  })
  .strict();

function normalizeOptional(value) {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
}

export async function PATCH(req, { params }) {
  try {
    const { user: currentUser, isSuperAdmin } = await ensureAdmin();
    await dbConnect();

    const { id } = params || {};
    if (!id) {
      return json({ ok: false, message: 'Identificador requerido.' }, { status: 400 });
    }

    const target = await User.findById(id);
    if (!target) {
      return json({ ok: false, message: 'Usuario no encontrado.' }, { status: 404 });
    }

    const raw = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'Datos invalidos.';
      return json({ ok: false, message: first }, { status: 400 });
    }

    const updates = parsed.data;
    const targetRole = (target.role || '').toLowerCase();
    const targetId = target._id.toString();
    const currentId = currentUser._id.toString();
    const isTargetSuperAdmin = (target.email || '').toLowerCase() === SUPER_ADMIN_EMAIL;

    if (!isSuperAdmin) {
      if (targetRole === 'admin' && targetId !== currentId) {
        return json(
          { ok: false, message: 'No puedes modificar a otros administradores.' },
          { status: 403 },
        );
      }
      if (updates.role === 'admin' && targetId !== currentId) {
        return json(
          { ok: false, message: 'Solo el super admin puede asignar el rol de administrador.' },
          { status: 403 },
        );
      }
    }

    if (isTargetSuperAdmin) {
      if (updates.role && updates.role !== 'admin') {
        return json(
          { ok: false, message: 'No puedes cambiar el rol del super administrador.' },
          { status: 400 },
        );
      }
      if (updates.email && updates.email !== SUPER_ADMIN_EMAIL) {
        return json(
          { ok: false, message: 'El email del super admin es fijo.' },
          { status: 400 },
        );
      }
    }

    if (updates.email && updates.email !== target.email) {
      const duplicated = await User.findOne({ email: updates.email, _id: { $ne: target._id } }).lean();
      if (duplicated) {
        return json({ ok: false, message: 'El email ya esta registrado.' }, { status: 409 });
      }
      target.email = updates.email;
    }

    if (updates.name) target.name = updates.name;
    if (updates.role && (isSuperAdmin || targetId === currentId)) {
      target.role = updates.role;
    }
    if (typeof updates.personType !== 'undefined') target.personType = updates.personType;
    if (typeof updates.phone !== 'undefined') target.phone = normalizeOptional(updates.phone) || '';
    if (typeof updates.address !== 'undefined') target.address = normalizeOptional(updates.address) || '';
    if (typeof updates.rut !== 'undefined') target.rut = normalizeOptional(updates.rut) || '';
    if (typeof updates.businessName !== 'undefined') {
      target.businessName = normalizeOptional(updates.businessName) || '';
    }
    if (typeof updates.avatarUrl !== 'undefined') {
      const value = normalizeOptional(updates.avatarUrl) || '';
      if (value && !/^https?:\/\//i.test(value)) {
        return json(
          { ok: false, message: 'La URL del avatar debe ser absoluta.' },
          { status: 400 },
        );
      }
      target.avatarUrl = value;
    }

    if (updates.password) {
      target.passwordHash = await bcrypt.hash(updates.password, 10);
    }

    await target.save();

    return json({ ok: true, user: serializeUser(target) });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al actualizar usuario.' },
      { status: err.status || 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { user: currentUser, isSuperAdmin } = await ensureAdmin();
    await dbConnect();

    const { id } = params || {};
    if (!id) {
      return json({ ok: false, message: 'Identificador requerido.' }, { status: 400 });
    }

    const target = await User.findById(id);
    if (!target) {
      return json({ ok: false, message: 'Usuario no encontrado.' }, { status: 404 });
    }

    const targetId = target._id.toString();
    const targetRole = (target.role || '').toLowerCase();
    const isTargetSuperAdmin = (target.email || '').toLowerCase() === SUPER_ADMIN_EMAIL;

    if (targetId === currentUser._id.toString()) {
      return json({ ok: false, message: 'No puedes eliminar tu propia cuenta.' }, { status: 400 });
    }

    if (isTargetSuperAdmin) {
      return json({ ok: false, message: 'No puedes eliminar al super administrador.' }, { status: 400 });
    }

    if (targetRole === 'admin' && !isSuperAdmin) {
      return json(
        { ok: false, message: 'Solo el super admin puede eliminar administradores.' },
        { status: 403 },
      );
    }

    await User.findByIdAndDelete(id);
    return json({ ok: true });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al eliminar usuario.' },
      { status: err.status || 500 },
    );
  }
}

