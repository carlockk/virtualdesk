import { dbConnect } from '@/lib/mongodb';
import Menu from '@/models/Menu';
import { ensureDefaultMenus, serializeMenu } from '@/lib/menus-admin';

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
    await ensureDefaultMenus(Menu);
    const menus = await Menu.find({ enabled: { $ne: false } })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return json({ menus: menus.map(serializeMenu) });
  } catch (err) {
    return json({ message: err.message || 'No se pudieron cargar los menus.' }, { status: 500 });
  }
}
