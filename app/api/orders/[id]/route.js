import mongoose from 'mongoose';
import { ensureAdmin } from '@/lib/admin-auth';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/models/Order';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function DELETE(req, { params }) {
  try {
    await ensureAdmin();
    await dbConnect();

    const { id } = params || {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return json({ ok: false, message: 'ID invalido.' }, { status: 400 });
    }

    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) {
      return json({ ok: false, message: 'Pedido no encontrado.' }, { status: 404 });
    }

    return json({ ok: true });
  } catch (err) {
    const status = err?.status || 500;
    const message = err?.message || 'Error al eliminar el pedido.';
    return json({ ok: false, message }, { status });
  }
}
