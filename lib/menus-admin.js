import { ensureAdmin as ensureAdminGuard } from '@/lib/admin-auth';

export const KNOWN_PAGE_PATHS = ['/services', '/contact', '/works'];

export const FALLBACK_MENUS = [
  { name: 'Inicio', href: '/', order: 0, icon: 'home', category: 'global', enabled: true, submenus: [] },
  { name: 'Servicios', href: '/services', order: 1, icon: 'briefcase', category: 'pages', enabled: true, submenus: [] },
  { name: 'Trabajos', href: '/works', order: 2, icon: 'grid-2x2', category: 'pages', enabled: true, submenus: [] },
  { name: 'Contacto', href: '/contact', order: 3, icon: 'mail', category: 'pages', enabled: true, submenus: [] },
  { name: 'Pedidos', href: '/orders', order: 4, icon: 'clipboardList', category: 'global', enabled: true, submenus: [] },
];

function resolveDefaultIconByName(name) {
  if (!name) return '';
  const normalized = name.trim().toLowerCase().replace(/[\s_-]+/g, '');
  const map = {
    inicio: 'home',
    home: 'home',
    servicios: 'briefcase',
    servicio: 'briefcase',
    contacto: 'mail',
    contact: 'mail',
    pedidos: 'clipboardList',
    mensajes: 'messageCircle',
    perfil: 'user',
    trabajos: 'grid-2x2',
    panel: 'layout-dashboard',
    dashboard: 'layout-dashboard',
    global: 'globe',
    tienda: 'shopping-bag',
    soporte: 'shield-check',
    seguridad: 'shield-check',
    blog: 'book-open',
    documentacion: 'book-open',
    favoritos: 'heart',
    codigo: 'code',
  };
  return map[normalized] || '';
}

export function inferMenuCategory(hrefOrDoc) {
  const hrefValue =
    typeof hrefOrDoc === 'string' ? hrefOrDoc : hrefOrDoc?.href;
  const normalized = (hrefValue || '').trim().toLowerCase();
  if (!normalized) return 'global';
  if (normalized.startsWith('/pages')) return 'pages';
  if (KNOWN_PAGE_PATHS.includes(normalized)) return 'pages';
  return 'global';
}

export function serializeMenu(doc) {
  const category = doc.category || inferMenuCategory(doc);
  return {
    id: String(doc._id),
    name: doc.name,
    href: doc.href,
    icon: doc.icon || resolveDefaultIconByName(doc.name),
    category,
    order: typeof doc.order === 'number' ? doc.order : 0,
    enabled: doc.enabled !== false,
    submenus: Array.isArray(doc.submenus)
      ? doc.submenus.map((item, index) => ({
          id: `${doc._id}-${index}`,
          name: item.name,
          href: item.href,
          order: typeof item.order === 'number' ? item.order : 0,
        }))
      : [],
    createdAt: doc.createdAt?.toISOString() || null,
    updatedAt: doc.updatedAt?.toISOString() || null,
  };
}

export const ensureAdmin = ensureAdminGuard;

export async function ensureDefaultMenus(model) {
  const count = await model.countDocuments({});
  if (count > 0) return;
  await model.insertMany(
    FALLBACK_MENUS.map((item, index) => ({
      name: item.name,
      href: item.href,
      icon: item.icon || '',
      category: item.category || 'global',
      order: typeof item.order === 'number' ? item.order : index,
      enabled: item.enabled !== false,
      submenus: Array.isArray(item.submenus)
        ? item.submenus.map((submenu, subIndex) => ({
            name: submenu.name,
            href: submenu.href,
            order: typeof submenu.order === 'number' ? submenu.order : subIndex,
          }))
        : [],
    })),
  );
}
