import { dbConnect } from '@/lib/mongodb';
import Work from '@/models/Work';
import { ensureAdmin, serializeWork, uploadWorkImage } from '@/lib/works-admin';

export const runtime = 'nodejs';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function GET() {
  try {
    await dbConnect();
    const works = await Work.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return json({ works: works.map(serializeWork) });
  } catch (err) {
    return json(
      { message: err.message || 'Error al obtener trabajos.' },
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
    const description = String(form.get('description') || '').trim();
    const projectUrl = String(form.get('projectUrl') || '').trim();
    const order = Number(form.get('order') || 0);
    const imageFile = form.get('image');

    if (!title) {
      throw Object.assign(new Error('El titulo es obligatorio.'), { status: 400 });
    }
    if (!description) {
      throw Object.assign(new Error('La descripcion es obligatoria.'), { status: 400 });
    }

    const { imageUrl } = await uploadWorkImage(imageFile);

    const workDoc = await Work.create({
      title,
      description,
      projectUrl,
      imageUrl,
      order: Number.isFinite(order) ? order : 0,
    });

    return json({ ok: true, work: serializeWork(workDoc) }, { status: 201 });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al crear el trabajo.' },
      { status: err.status || 500 },
    );
  }
}
