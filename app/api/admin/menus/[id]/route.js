import mongoose from 'mongoose';
import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import Menu from '@/models/Menu';
import { ensureAdmin, inferMenuCategory, serializeMenu } from '@/lib/menus-admin';

const submenuInputSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre del submenu es obligatorio.').max(60),
    href: z.string().trim().min(1, 'El enlace del submenu es obligatorio.').max(2048),
    icon: z.string().trim().max(60).optional(),
    order: z.number().int().optional(),
  })
  .strict();

const menuUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio.').max(60).optional(),
    href: z.string().trim().min(1, 'El enlace es obligatorio.').max(2048).optional(),
    icon: z.string().trim().max(60).optional(),
    category: z.enum(['global', 'pages']).optional(),
    order: z.number().int().optional(),
    enabled: z.boolean().optional(),
    submenus: z.array(submenuInputSchema).default([]).optional(),
  })
  .strict();

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
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
    console.log('[menus:update] raw payload', raw);
    const payload = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {};
    const parsed = menuUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      console.error('[menus:update] validation error', parsed.error, 'raw', raw);
      const first = parsed.error?.errors?.[0]?.message || 'Datos invalidos.';
      return json({ ok: false, message: first }, { status: 400 });
    }

    const update = parsed.data;
    console.log('[menus:update] payload', update);
    const menu = await Menu.findById(id);
    if (!menu) {
      return json({ ok: false, message: 'Menu no encontrado.' }, { status: 404 });
    }

    if (typeof update.name !== 'undefined') menu.name = update.name.trim();
    if (typeof update.href !== 'undefined') menu.href = update.href.trim();
    if (typeof update.icon !== 'undefined') menu.icon = update.icon.trim();
    if (typeof update.category !== 'undefined') {
      menu.category = update.category;
    }
    if (typeof update.order !== 'undefined') menu.order = update.order;
    if (typeof update.enabled !== 'undefined') menu.enabled = update.enabled;
    if (Array.isArray(update.submenus)) {
      menu.submenus = update.submenus.map((item) => ({
        name: item.name,
        href: item.href,
        order: item.order ?? 0,
      }));
    }

    if (!menu.category) {
      menu.category = inferMenuCategory(menu.href);
    }

    await menu.save();
    return json({ ok: true, menu: serializeMenu(menu) });
  } catch (err) {
    console.error('[menus:update] error', err);
    return json(
      { ok: false, message: err.message || 'No se pudo actualizar el menu.' },
      { status: err.status || 500 },
    );
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

    const deleted = await Menu.findByIdAndDelete(id);
    if (!deleted) {
      return json({ ok: false, message: 'Menu no encontrado.' }, { status: 404 });
    }

    return json({ ok: true });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'No se pudo eliminar el menu.' },
      { status: err.status || 500 },
    );
  }
}
