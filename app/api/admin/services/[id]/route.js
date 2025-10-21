import {
  ensureAdmin,
  deleteServiceImage,
  extractServicePublicId,
  serializeService,
  uploadServiceImage,
} from '@/lib/services-admin';
import { dbConnect } from '@/lib/mongodb';
import Service from '@/models/Service';

export const runtime = 'nodejs';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

function slugify(value) {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function ensureUniqueSlug(baseSlug, excludeId) {
  if (!baseSlug) {
    baseSlug = 'service';
  }

  let candidate = baseSlug;
  let attempt = 1;
  const filter = excludeId ? { _id: { $ne: excludeId } } : {};

  while (await Service.findOne({ slug: candidate, ...filter }).lean()) {
    candidate = `${baseSlug}-${attempt++}`;
  }

  return candidate;
}

function parseOptionalNumber(value, { allowNegative = false } = {}) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw Object.assign(new Error('El valor numerico es invalido.'), { status: 400 });
  }
  if (!allowNegative && num < 0) {
    throw Object.assign(new Error('El valor numerico debe ser positivo.'), { status: 400 });
  }
  return num;
}

export async function PATCH(req, { params }) {
  try {
    await ensureAdmin();
    await dbConnect();

    const { id } = params || {};
    if (!id) {
      return json({ ok: false, message: 'Identificador requerido.' }, { status: 400 });
    }

    const service = await Service.findById(id);
    if (!service) {
      return json({ ok: false, message: 'Servicio no encontrado.' }, { status: 404 });
    }

    const form = await req.formData();

    if (form.has('title')) {
      const title = String(form.get('title') || '').trim();
      if (!title) {
        return json({ ok: false, message: 'El titulo es obligatorio.' }, { status: 400 });
      }
      service.title = title;
    }

    if (form.has('summary')) {
      const summary = String(form.get('summary') || '').trim();
      if (summary.length < 10) {
        return json(
          { ok: false, message: 'El resumen debe tener al menos 10 caracteres.' },
          { status: 400 },
        );
      }
      service.summary = summary;
    }

    if (form.has('description')) {
      service.description = String(form.get('description') || '').trim();
    }

    if (form.has('slug')) {
      const baseSlug = slugify(String(form.get('slug') || '').trim() || service.title);
      service.slug = await ensureUniqueSlug(baseSlug, service._id);
    }

    const imageFile = form.get('image');
    if (imageFile && typeof imageFile !== 'string' && imageFile.size > 0) {
      const hint =
        service.imagePublicId || extractServicePublicId(service.imageUrl || '') || undefined;
      const { imageUrl, publicId } = await uploadServiceImage(imageFile, hint);
      service.imageUrl = imageUrl;
      service.imagePublicId = publicId;
    }

    if (form.has('icon')) {
      service.icon = String(form.get('icon') || '').trim();
    }
    if (form.has('category')) {
      service.category = String(form.get('category') || '').trim();
    }

    if (form.has('price')) {
      const price = parseOptionalNumber(form.get('price'), { allowNegative: false });
      service.price = price;
    }

    if (form.has('order')) {
      const order = parseOptionalNumber(form.get('order'), { allowNegative: true });
      if (order === undefined) {
        service.order = 0;
      } else {
        service.order = order ?? 0;
      }
    }

    if (form.has('active')) {
      const activeValue = String(form.get('active') || '').trim().toLowerCase();
      service.active = activeValue === 'false' ? false : true;
    }

    await service.save();
    return json({ ok: true, service: serializeService(service) });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al actualizar servicio.' },
      { status: err.status || 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await ensureAdmin();
    await dbConnect();

    const { id } = params || {};
    if (!id) {
      return json({ ok: false, message: 'Identificador requerido.' }, { status: 400 });
    }

    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) {
      return json({ ok: false, message: 'Servicio no encontrado.' }, { status: 404 });
    }

    const publicId =
      deleted.imagePublicId || extractServicePublicId(deleted.imageUrl || '');
    await deleteServiceImage(publicId);

    return json({ ok: true });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al eliminar servicio.' },
      { status: err.status || 500 },
    );
  }
}
