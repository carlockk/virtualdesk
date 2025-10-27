import { ensureAdmin as ensureAdminGuard } from '@/lib/admin-auth';

export const FALLBACK_PAGES = [
  {
    title: 'Servicios',
    slug: 'services',
    path: '/services',
    summary: 'Descubre todos los servicios disponibles.',
    status: 'published',
    order: 0,
    system: true,
  },
  {
    title: 'Trabajos',
    slug: 'works',
    path: '/works',
    summary: 'Explora nuestros trabajos y portafolio.',
    status: 'published',
    order: 1,
    system: true,
  },
  {
    title: 'Pedidos',
    slug: 'orders',
    path: '/orders',
    summary: 'Revisa el estado de tus pedidos.',
    status: 'published',
    order: 2,
    system: true,
  },
  {
    title: 'Contacto',
    slug: 'contact',
    path: '/contact',
    summary: 'Comunicate directamente con nosotros.',
    status: 'published',
    order: 3,
    system: true,
  },
];

export function slugify(value = '') {
  return value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function serializePage(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    path: doc.path || ('/pages/' + doc.slug),
    summary: doc.summary || '',
    content: doc.content || '',
    heroImage: doc.heroImage || '',
    status: doc.status || 'draft',
    order: typeof doc.order === 'number' ? doc.order : 0,
    system: Boolean(doc.system),
    createdAt: doc.createdAt?.toISOString() || null,
    updatedAt: doc.updatedAt?.toISOString() || null,
  };
}

export const ensureAdmin = ensureAdminGuard;

export async function ensureDefaultPages(model) {
  const count = await model.countDocuments({});
  if (count > 0) return;

  await model.insertMany(
    FALLBACK_PAGES.map((item, index) => ({
      title: item.title,
      slug: item.slug,
      path: item.path,
      summary: item.summary,
      content: '',
      heroImage: '',
      status: item.status || 'published',
      order: typeof item.order === 'number' ? item.order : index,
      system: true,
    })),
  );
}