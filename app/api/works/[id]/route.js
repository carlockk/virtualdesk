import { dbConnect } from '@/lib/mongodb';
import Work from '@/models/Work';
import {
  deleteWorkImage,
  ensureAdmin,
  extractWorkPublicId,
  serializeWork,
  uploadWorkImage,
} from '@/lib/works-admin';

export const runtime = 'nodejs';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function PATCH(req, { params }) {
  try {
    await ensureAdmin();
    await dbConnect();

    const { id } = params || {};
    if (!id) {
      throw Object.assign(new Error('Identificador requerido.'), { status: 400 });
    }

    const work = await Work.findById(id);
    if (!work) {
      return json({ ok: false, message: 'Trabajo no encontrado.' }, { status: 404 });
    }

    const form = await req.formData();
    const updates = {};

    if (form.has('title')) {
      const title = String(form.get('title') || '').trim();
      if (!title) {
        throw Object.assign(new Error('El titulo no puede estar vacio.'), { status: 400 });
      }
      updates.title = title;
    }

    if (form.has('description')) {
      const description = String(form.get('description') || '').trim();
      if (!description) {
        throw Object.assign(new Error('La descripcion no puede estar vacia.'), { status: 400 });
      }
      updates.description = description;
    }

    if (form.has('projectUrl')) {
      updates.projectUrl = String(form.get('projectUrl') || '').trim();
    }

    if (form.has('order')) {
      const orderValue = Number(form.get('order'));
      if (Number.isFinite(orderValue)) {
        updates.order = orderValue;
      }
    }

    const imageFile = form.get('image');
    if (imageFile && typeof imageFile !== 'string' && imageFile.size > 0) {
      const currentPublicId = extractWorkPublicId(work.imageUrl);
      const { imageUrl } = await uploadWorkImage(imageFile, currentPublicId || undefined);
      updates.imageUrl = imageUrl;
    }

    Object.assign(work, updates);
    await work.save();

    return json({ ok: true, work: serializeWork(work) });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al actualizar el trabajo.' },
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
      throw Object.assign(new Error('Identificador requerido.'), { status: 400 });
    }

    const work = await Work.findByIdAndDelete(id);
    if (!work) {
      return json({ ok: false, message: 'Trabajo no encontrado.' }, { status: 404 });
    }

    const publicId = extractWorkPublicId(work.imageUrl);
    await deleteWorkImage(publicId);

    return json({ ok: true });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al eliminar el trabajo.' },
      { status: err.status || 500 },
    );
  }
}
