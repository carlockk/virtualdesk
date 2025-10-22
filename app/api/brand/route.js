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
      name: 'VirtualDesk',
      logoUrl: '/virt.jpg',
      updatedAt: null,
    };
  }
  return {
    name: doc.name || 'VirtualDesk',
    logoUrl: doc.logoUrl || '/virt.jpg',
    updatedAt: doc.updatedAt?.toISOString() || null,
  };
}

export async function GET() {
  try {
    await dbConnect();
    const doc = await BrandSetting.findOne().lean();
    return json({ brand: serializeBrand(doc) });
  } catch (err) {
    return json(
      {
        brand: {
          name: 'VirtualDesk',
          logoUrl: '/virt.jpg',
          updatedAt: null,
        },
        message: err.message || 'No se pudo obtener la marca.',
      },
      { status: 200 },
    );
  }
}
