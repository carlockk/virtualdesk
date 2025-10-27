import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import Menu from '@/models/Menu';
import { ensureAdmin, ensureDefaultMenus, serializeMenu } from '@/lib/menus-admin';

const submenuInputSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre del submenu es obligatorio.').max(60),
    href: z.string().trim().min(1, 'El enlace del submenu es obligatorio.').max(2048),
    order: z.number().int().optional(),
  })
  .strict();

const menuInputSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio.').max(60),
    href: z.string().trim().min(1, 'El enlace es obligatorio.').max(2048),
    icon: z.string().trim().max(60).optional(),
    order: z.number().int().optional(),
    enabled: z.boolean().optional(),
    submenus: z.array(submenuInputSchema).optional(),
  })
  .strict();

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function GET() {
  try {
    await ensureAdmin();
    await dbConnect();
    await ensureDefaultMenus(Menu);
    const menus = await Menu.find({})
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return json({ menus: menus.map(serializeMenu) });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'No se pudieron obtener los menus.' },
      { status: err.status || 500 },
    );
  }
}

export async function POST(req) {
  try {
    await ensureAdmin();
    await dbConnect();

    const raw = await req.json().catch(() => ({}));
    const parsed = menuInputSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'Datos invalidos.';
      return json({ ok: false, message: first }, { status: 400 });
    }

    const data = parsed.data;
    const doc = await Menu.create({
      name: data.name,
      href: data.href,
      icon: data.icon?.trim() || '',
      order: data.order ?? 0,
      enabled: data.enabled !== false,
      submenus: Array.isArray(data.submenus)
        ? data.submenus.map((item) => ({
            name: item.name,
            href: item.href,
            order: item.order ?? 0,
          }))
        : [],
    });

    return json({ ok: true, menu: serializeMenu(doc) }, { status: 201 });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'No se pudo crear el menu.' },
      { status: err.status || 500 },
    );
  }
}
