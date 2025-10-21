import { serializeService } from '@/lib/services-admin';
import { dbConnect } from '@/lib/mongodb';
import Service from '@/models/Service';

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
    const services = await Service.find({ active: { $ne: false } })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return json({ services: services.map(serializeService) });
  } catch (err) {
    return json(
      { message: err.message || 'Error al obtener servicios.' },
      { status: err.status || 500 },
    );
  }
}
