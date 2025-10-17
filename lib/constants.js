const FALLBACK_SUPER_ADMIN_EMAIL = 'carlos.virtualdesk@gmail.com';

export const SUPER_ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ||
  process.env.SUPER_ADMIN_EMAIL ||
  FALLBACK_SUPER_ADMIN_EMAIL
).trim().toLowerCase();
