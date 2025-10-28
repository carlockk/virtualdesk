import crypto from 'crypto';
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

function serializeSectionItem(item, index) {
  return {
    id: item.id || item._id?.toString() || crypto.randomUUID(),
    title: item.title || '',
    description: item.description || '',
    imageUrl: item.imageUrl || '',
    linkLabel: item.linkLabel || '',
    linkUrl: item.linkUrl || '',
    order: typeof item.order === 'number' ? item.order : index,
  };
}

function serializeSection(section, index) {
  const items = Array.isArray(section.items) ? section.items : [];
  return {
    id: section.id || section._id?.toString() || crypto.randomUUID(),
    type: section.type || 'cards',
    position: section.position || 'main',
    title: section.title || '',
    description: section.description || '',
    order: typeof section.order === 'number' ? section.order : index,
    items: items
      .map((item, itemIndex) => serializeSectionItem(item, itemIndex))
      .sort((a, b) => a.order - b.order),
  };
}

export function serializePage(doc) {
  const sections = Array.isArray(doc.sections) ? doc.sections : [];
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
    sections: sections
      .map((section, index) => serializeSection(section, index))
      .sort((a, b) => a.order - b.order),
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
      sections: [],
    })),
  );
}

export function normalizeSectionPayload(sections = []) {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section, index) => {
      if (!section || typeof section !== 'object') return null;
      const type = section.type === 'slider' ? 'slider' : 'cards';
      const sectionId = section.id && typeof section.id === 'string' ? section.id : crypto.randomUUID();
      const items = Array.isArray(section.items) ? section.items : [];
      const normalizedItems = items
        .map((item, itemIndex) => {
          if (!item || typeof item !== 'object') return null;
          const itemId = item.id && typeof item.id === 'string' ? item.id : crypto.randomUUID();
          const normalized = {
            id: itemId,
            title: (item.title || '').trim(),
            description: (item.description || '').trim(),
            imageUrl: (item.imageUrl || '').trim(),
            linkLabel: (item.linkLabel || '').trim(),
            linkUrl: (item.linkUrl || '').trim(),
            order: typeof item.order === 'number' ? item.order : itemIndex,
          };
          if (type === 'cards') {
            return normalized.title ? normalized : null;
          }
          if (type === 'slider') {
            return normalized.imageUrl ? normalized : null;
          }
          return null;
        })
        .filter(Boolean);

      if (type === 'slider' && normalizedItems.length === 0) {
        return null;
      }

      if (
        type === 'cards' &&
        normalizedItems.length === 0 &&
        !(section.title && section.title.trim()) &&
        !(section.description && section.description.trim())
      ) {
        return null;
      }

      const validPosition = ['belowTitle', 'main', 'afterContent'].includes(section.position)
        ? section.position
        : 'main';

      return {
        id: sectionId,
        type,
        position: validPosition,
        title: (section.title || '').trim(),
        description: (section.description || '').trim(),
        order: typeof section.order === 'number' ? section.order : index,
        items: normalizedItems,
      };
    })
    .filter(Boolean);
}
