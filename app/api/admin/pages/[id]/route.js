import crypto from 'crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import Page from '@/models/Page';
import { ensureAdmin, normalizeSectionPayload, serializePage, slugify } from '@/lib/pages-admin';

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

const sectionSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    type: z.literal('cards').optional(),
    position: z.enum(['belowTitle', 'main', 'afterContent']).optional(),
    title: z.string().trim().max(120).optional(),
    description: z.string().trim().max(500).optional(),
    order: z.number().int().optional(),
    items: z.array(cardItemSchema).optional(),
  })
  .strict();

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(160).optional(),
    summary: z.string().trim().max(500).optional(),
    content: z.string().optional(),
    heroImage: z.string().trim().max(2048).optional(),
    status: z.enum(['draft', 'published']).optional(),
    order: z.number().int().optional(),
    path: z.string().trim().max(200).optional(),
    sections: z.array(sectionSchema).optional(),
  })
  .strict();

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

function normalizePath(pathValue, slug, isSystem) {
  if (typeof pathValue !== 'string' || !pathValue.trim()) {
    if (isSystem) return '';
    return slug ? `/pages/${slug}` : '';
  }
  const normalized = pathValue.trim();
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export async function GET(req, context) {
  try {
    await ensureAdmin();
    await dbConnect();

    const params = await context.params;
    const { id } = params || {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return json({ ok: false, message: 'ID invalido.' }, { status: 400 });
    }

    const page = await Page.findById(id).lean();
    if (!page) {
      return json({ ok: false, message: 'Pagina no encontrada.' }, { status: 404 });
    }

    return json({ ok: true, page: serializePage(page) });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudo obtener la pagina.' }, { status: err.status || 500 });
  }
}

export async function PATCH(req, context) {
  try {
    await ensureAdmin();
    await dbConnect();

    const params = await context.params;
    const { id } = params || {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return json({ ok: false, message: 'ID invalido.' }, { status: 400 });
    }

    const raw = await req.json().catch(() => ({}));
    const payload = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {};
    const parsed = updateSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'Datos invalidos.';
      return json({ ok: false, message: first }, { status: 400 });
    }

    const updates = parsed.data;
    const page = await Page.findById(id);
    if (!page) {
      return json({ ok: false, message: 'Pagina no encontrada.' }, { status: 404 });
    }

    if (typeof updates.title !== 'undefined') {
      page.title = updates.title.trim();
    }

    if (typeof updates.slug !== 'undefined') {
      const newSlug = slugify(updates.slug);
      if (!newSlug) {
        return json({ ok: false, message: 'Slug invalido.' }, { status: 400 });
      }
      if (newSlug !== page.slug) {
        const collision = await Page.findOne({ slug: newSlug, _id: { $ne: page._id } }).lean();
        if (collision) {
          return json({ ok: false, message: 'Ya existe una pagina con ese slug.' }, { status: 409 });
        }
        page.slug = newSlug;
        if (!updates.path && !page.system) {
          page.path = `/pages/${newSlug}`;
        }
      }
    }

    if (typeof updates.path !== 'undefined') {
      page.path = normalizePath(updates.path, page.slug, page.system);
    }

    if (typeof updates.summary !== 'undefined') {
      page.summary = updates.summary.trim();
    }

    if (typeof updates.content !== 'undefined') {
      page.content = updates.content;
    }

    if (typeof updates.heroImage !== 'undefined') {
      page.heroImage = updates.heroImage.trim();
    }

    if (typeof updates.status !== 'undefined') {
      page.status = updates.status;
    }

    if (typeof updates.order !== 'undefined') {
      page.order = updates.order;
    }

    if (typeof updates.sections !== 'undefined') {
      const rawSections = Array.isArray(updates.sections) ? updates.sections : [];
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
      page.sections = normalizedSections;
    }

    await page.save();
    return json({ ok: true, page: serializePage(page) });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudo actualizar la pagina.' }, { status: err.status || 500 });
  }
}

export async function DELETE(req, context) {
  try {
    await ensureAdmin();
    await dbConnect();

    const params = await context.params;
    const { id } = params || {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return json({ ok: false, message: 'ID invalido.' }, { status: 400 });
    }

    const deleted = await Page.findByIdAndDelete(id);
    if (!deleted) {
      return json({ ok: false, message: 'Pagina no encontrada.' }, { status: 404 });
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudo eliminar la pagina.' }, { status: err.status || 500 });
  }
}
