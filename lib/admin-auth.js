import { getSession } from '@/lib/auth';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

function errorWithStatus(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function getAllowedAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isUserSuperAdmin(user) {
  if (!user) return false;
  if ((user.role || '').toLowerCase() !== 'admin') return false;

  const email = user.email?.toLowerCase() || '';
  if (!email) return false;

  const allowedEmails = new Set([SUPER_ADMIN_EMAIL, ...getAllowedAdminEmails()]);
  return allowedEmails.has(email);
}

export function isUserAdmin(user) {
  return Boolean(user && (user.role || '').toLowerCase() === 'admin');
}

export async function requireAdmin({ superOnly = false } = {}) {
  const session = getSession();
  if (!session?.uid) {
    throw errorWithStatus('Autenticacion requerida.', 401);
  }

  await dbConnect();
  const user = await User.findById(session.uid).lean();
  if (!user) {
    throw errorWithStatus('Usuario no encontrado.', 404);
  }

  const isAdmin = isUserAdmin(user);
  const isSuper = isUserSuperAdmin(user);

  if (!isAdmin) {
    throw errorWithStatus('No autorizado.', 403);
  }
  if (superOnly && !isSuper) {
    throw errorWithStatus('Permiso insuficiente.', 403);
  }

  return { session, user, isSuperAdmin: isSuper };
}

export async function ensureAdmin() {
  return requireAdmin({ superOnly: false });
}

export async function ensureSuperAdmin() {
  return requireAdmin({ superOnly: true });
}

