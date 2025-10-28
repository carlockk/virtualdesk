import crypto from 'crypto';
import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import Page from '@/models/Page';
import { ensureAdmin, ensureDefaultPages, normalizeSectionPayload, serializePage, slugify } from '@/lib/pages-admin';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

const cardItemSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    title: z.string().trim().min(1, 'La tarjeta debe tener un titulo.').max(120),
    description: z.string().trim().max(500).optional(),
    imageUrl: z.string().trim().max(2048).optional(),
    linkLabel: z.string().trim().max(80).optional(),
    linkUrl: z.string().trim().max(2048).optional(),
    order: z.number().int().optional(),
  })
  .strict();

const sliderItemSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    title: z.string().trim().max(120).optional(),
    description: z.string().trim().max(500).optional(),
    imageUrl: z.string().trim().min(1, 'Cada diapositiva debe tener una imagen.').max(2048),
    linkLabel: z.string().trim().max(80).optional(),
    linkUrl: z.string().trim().max(2048).optional(),
    order: z.number().int().optional(),
  })
  .strict();

const baseSectionSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    position: z.enum(['belowTitle', 'main', 'afterContent']).optional(),
    title: z.string().trim().max(120).optional(),
    description: z.string().trim().max(500).optional(),
    order: z.number().int().optional(),
  })
  .strict();

const cardSectionSchema = baseSectionSchema.extend({
  type: z.literal('cards').optional(),
  items: z.array(cardItemSchema).optional(),
});

const sliderSectionSchema = baseSectionSchema.extend({
  type: z.literal('slider'),
  items: z.array(sliderItemSchema).optional(),
});

const sectionSchema = z.union([cardSectionSchema, sliderSectionSchema]);

const createSchema = z
  .object({
    title: z.string().trim().min(1, 'El titulo es obligatorio.').max(120),
    slug: z.string().trim().min(1, 'El slug es obligatorio.').max(160).optional(),
    summary: z.string().trim().max(500).optional(),
    content: z.string().optional(),
    heroImage: z.string().trim().max(2048).optional(),
    status: z.enum(['draft', 'published']).optional(),
    order: z.number().int().optional(),
    path: z.string().trim().max(200).optional(),
    sections: z.array(sectionSchema).optional(),
  })
  .strict();

function normalizePath(pathValue, slug) {
  if (typeof pathValue !== 'string' || !pathValue.trim()) {
    return slug ? `/pages/${slug}` : '';
  }
  const normalized = pathValue.trim();
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export async function GET(req) {
  try {
    await ensureAdmin();
    await dbConnect();
    await ensureDefaultPages(Page);

    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get('all') === '1' || searchParams.get('includeDraft') === '1';
    const status = searchParams.get('status');
    const query = {};
    if (!includeAll && status) {
      query.status = status;
    }

    const pages = await Page.find(query).sort({ order: 1, createdAt: 1 }).lean();
    return json({ ok: true, pages: pages.map(serializePage) });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudieron obtener las paginas.' }, { status: err.status || 500 });
  }
}

export async function POST(req) {
  try {
    await ensureAdmin();
    await dbConnect();

    const raw = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'Datos invalidos.';
      return json({ ok: false, message: first }, { status: 400 });
    }

    const data = parsed.data;
    const slugSource = data.slug?.trim() || data.title;
    const finalSlug = slugify(slugSource);
    if (!finalSlug) {
      return json({ ok: false, message: 'No se pudo generar un slug valido.' }, { status: 400 });
    }

    const existing = await Page.findOne({ slug: finalSlug }).lean();
    if (existing) {
      return json({ ok: false, message: 'Ya existe una pagina con este slug.' }, { status: 409 });
    }

    const path = normalizePath(data.path || '', finalSlug);
    const rawSections = Array.isArray(data.sections) ? data.sections : [];
    const normalizedSections = normalizeSectionPayload(rawSections).map((section, index) => ({
      ...section,
      id: section.id || crypto.randomUUID(),
      position: section.position || 'main',
      order: index,
      items: section.items.map((item, itemIndex) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        order: itemIndex,
      })),
    }));

    const pageDoc = await Page.create({
      title: data.title.trim(),
      slug: finalSlug,
      path,
      summary: data.summary?.trim() || '',
      content: data.content || '',
      heroImage: data.heroImage?.trim() || '',
      status: data.status || 'published',
      order: data.order ?? 0,
      system: false,
      sections: normalizedSections,
    });

    return json({ ok: true, page: serializePage(pageDoc) }, { status: 201 });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudo crear la pagina.' }, { status: err.status || 500 });
  }
}
