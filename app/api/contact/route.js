import { dbConnect } from '@/lib/mongodb';
import ContactRequest from '@/models/ContactRequest';

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body?.name || !body?.email || !body?.message) {
      return new Response(JSON.stringify({ message: 'Datos incompletos' }), { status: 400 });
    }
    await dbConnect();
    await ContactRequest.create(body);
    return Response.json({ ok: true });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message || 'DB error' }), { status: 500 });
  }
}
