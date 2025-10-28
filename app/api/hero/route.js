import { dbConnect } from '@/lib/mongodb';
import { getHeroSettingsForPublic } from '@/lib/hero-admin';

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
    const hero = await getHeroSettingsForPublic();
    return json({ ok: true, hero });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudo obtener la configuracion del hero.' }, { status: err.status || 500 });
  }
}
