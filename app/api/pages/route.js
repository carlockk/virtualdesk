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

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const includeDraft = searchParams.get('draft') === '1';
    const query = includeDraft ? {} : { status: 'published' };

    const pages = await Page.find(query).sort({ order: 1, createdAt: 1 }).lean();
    return json({ ok: true, pages: pages.map(serializePage) });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudieron obtener las paginas.' }, { status: err.status || 500 });
  }
}
