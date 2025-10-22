import { ensureAdmin, uploadBrandLogo, deleteBrandLogo } from '@/lib/brand-admin';
import { dbConnect } from '@/lib/mongodb';
import BrandSetting from '@/models/BrandSetting';

export const runtime = 'nodejs';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

function serializeBrand(doc) {
  if (!doc) {
    return {
      id: null,
      name: 'VirtualDesk',
      logoUrl: '/virt.jpg',
      updatedAt: null,
    };
  }
  return {
    id: String(doc._id),
    name: doc.name || 'VirtualDesk',
    logoUrl: doc.logoUrl || '/virt.jpg',
    updatedAt: doc.updatedAt?.toISOString() || null,
  };
}

export async function GET() {
  try {
    await ensureAdmin();
    await dbConnect();
    const brand = await BrandSetting.findOne().lean();
    return json({ brand: serializeBrand(brand) });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al obtener la marca.' },
      { status: err.status || 500 },
    );
  }
}

export async function PATCH(req) {
  try {
    await ensureAdmin();
    await dbConnect();

    const form = await req.formData();
    const nameRaw = form.get('name');
    const logoFile = form.get('logo');

    let brand = await BrandSetting.findOne();
    if (!brand) {
      brand = new BrandSetting();
    }

    if (typeof nameRaw === 'string') {
      const name = nameRaw.trim();
      if (!name) {
        return json({ ok: false, message: 'El nombre no puede estar vacio.' }, { status: 400 });
      }
      if (name.length > 80) {
        return json({ ok: false, message: 'El nombre es demasiado largo.' }, { status: 400 });
      }
      brand.name = name;
    }

    if (logoFile && typeof logoFile !== 'string' && logoFile.size > 0) {
      const { logoUrl, publicId } = await uploadBrandLogo(logoFile, brand.logoPublicId || undefined);
      if (brand.logoPublicId && brand.logoPublicId !== publicId) {
        await deleteBrandLogo(brand.logoPublicId);
      }
      brand.logoUrl = logoUrl;
      brand.logoPublicId = publicId;
    }

    await brand.save();
    return json({ ok: true, brand: serializeBrand(brand) });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'Error al actualizar la marca.' },
      { status: err.status || 500 },
    );
  }
}


