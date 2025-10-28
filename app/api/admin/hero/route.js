import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import { ensureAdmin } from '@/lib/pages-admin';
import { getHeroSettingsForAdmin, saveHeroSettings } from '@/lib/hero-admin';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

const heroButtonSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    label: z.string().trim().min(1, 'El boton debe tener un texto.').max(80),
    href: z.string().trim().min(1, 'El boton debe tener un enlace.').max(2048),
    icon: z.string().trim().max(60).optional(),
    visible: z.boolean().optional(),
    order: z.number().int().optional(),
  })
  .strict();

const heroSlideSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    imageUrl: z.string().trim().min(1, 'Sube una imagen para el slider.').max(2048),
    order: z.number().int().optional(),
  })
  .strict();

const heroTextSchema = z
  .object({
    text: z.string().trim().max(200).optional(),
    visible: z.boolean().optional(),
  })
  .strict();

const updateSchema = z
  .object({
    visible: z.boolean().optional(),
    height: z.number().int().optional(),
    title: heroTextSchema.optional(),
    subtitle: heroTextSchema.optional(),
    heroImage: z.string().trim().max(2048).optional(),
    slides: z.array(heroSlideSchema).optional(),
    buttons: z.array(heroButtonSchema).optional(),
  })
  .strict();

export async function GET() {
  try {
    await ensureAdmin();
    await dbConnect();
    const hero = await getHeroSettingsForAdmin();
    return json({ ok: true, hero });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudo obtener la configuracion del hero.' }, { status: err.status || 500 });
  }
}

export async function PUT(req) {
  try {
    await ensureAdmin();
    await dbConnect();

    const raw = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message || 'Datos invalidos.';
      return json({ ok: false, message: first }, { status: 400 });
    }

    const hero = await saveHeroSettings(parsed.data);
    return json({ ok: true, hero });
  } catch (err) {
    return json({ ok: false, message: err.message || 'No se pudo actualizar el hero.' }, { status: err.status || 500 });
  }
}
