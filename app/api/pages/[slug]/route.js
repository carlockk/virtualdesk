import { dbConnect } from '@/lib/mongodb';
import Page from '@/models/Page';
import { serializePage } from '@/lib/pages-admin';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function GET(req, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const { slug } = params || {};
    if (!slug) {
      return json({ ok: false, message: 'Slug requerido.' }, { status: 400 });
    }

    const page = await Page.findOne({ slug, status: 'published' }).lean();
    if (!page) {
      return json({ ok: false, message: 'Pagina no encontrada.' }, { status: 404 });
    }

    return json({ ok: true, page: serializePage(page) });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudo obtener la pagina.' }, { status: err.status || 500 });
  }
}
