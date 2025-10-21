import { ensureAdmin, serializeService, uploadServiceImage } from '@/lib/services-admin';
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

export async function GET(req) {
  try {
    await ensureAdmin();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const query = {};

    const search = (searchParams.get('q') || '').trim();
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const active = searchParams.get('active');
    if (active === 'true') query.active = true;
    if (active === 'false') query.active = false;

    const services = await Service.find(query).sort({ order: 1, createdAt: -1 }).limit(200).lean();
    return json({ services: services.map(serializeService) });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al obtener servicios.' },
      { status: err.status || 500 },
    );
  }
}

export async function POST(req) {
  try {
    await ensureAdmin();
    await dbConnect();

    const form = await req.formData();
    const title = String(form.get('title') || '').trim();
    const summary = String(form.get('summary') || '').trim();
    const description = String(form.get('description') || '').trim();
    const slugInput = String(form.get('slug') || '').trim().toLowerCase();
    const category = String(form.get('category') || '').trim();
    const icon = String(form.get('icon') || '').trim();
    const priceValue = form.get('price');
    const orderValue = form.get('order');
    const activeValue = form.get('active');
    const imageFile = form.get('image');

    if (!title) {
      return json({ ok: false, message: 'El titulo es obligatorio.' }, { status: 400 });
    }
    if (summary.length < 10) {
      return json(
        { ok: false, message: 'El resumen debe tener al menos 10 caracteres.' },
        { status: 400 },
      );
    }
    if (!imageFile || typeof imageFile === 'string' || imageFile.size === 0) {
      return json({ ok: false, message: 'La imagen es obligatoria.' }, { status: 400 });
    }

    const baseSlug = slugify(slugInput || title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);
    const price = parseOptionalNumber(priceValue, { allowNegative: false });
    const order = parseOptionalNumber(orderValue, { allowNegative: true }) ?? 0;
    const isActive = activeValue === 'false' ? false : true;

    const { imageUrl, publicId } = await uploadServiceImage(imageFile);

    const service = await Service.create({
      title,
      slug: uniqueSlug,
      summary,
      description,
      imageUrl,
      imagePublicId: publicId,
      icon,
      category,
      price,
      order,
      active: isActive,
    });

    return json({ ok: true, service: serializeService(service) }, { status: 201 });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al crear servicio.' },
      { status: err.status || 500 },
    );
  }
}
