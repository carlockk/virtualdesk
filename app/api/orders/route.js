import { dbConnect } from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body?.clientName || !body?.clientEmail || !Array.isArray(body?.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ message: 'Datos incompletos' }), { status: 400 });
    }
    await dbConnect();
    await Order.create(body);
    return Response.json({ ok: true });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message || 'DB error' }), { status: 500 });
  }
}
