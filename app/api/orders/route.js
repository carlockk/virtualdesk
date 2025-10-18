import { getSession } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Order from '@/models/Order';

const serializeOrder = (orderDoc) => ({
  _id: String(orderDoc._id),
  userId: orderDoc.userId ? String(orderDoc.userId) : null,
  clientName: orderDoc.clientName,
  clientEmail: orderDoc.clientEmail,
  items: (orderDoc.items || []).map((item) => ({
    serviceId: item.serviceId,
    serviceName: item.serviceName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  })),
  contact: {
    personType: orderDoc.contact?.personType || 'natural',
    phone: orderDoc.contact?.phone || '',
    address: orderDoc.contact?.address || '',
    rut: orderDoc.contact?.rut || '',
    businessName: orderDoc.contact?.businessName || '',
  },
  status: orderDoc.status,
  createdAt: orderDoc.createdAt?.toISOString() || null,
  updatedAt: orderDoc.updatedAt?.toISOString() || null,
});

export async function GET(req) {
  try {
    const session = getSession();
    const { searchParams } = new URL(req.url);
    await dbConnect();

    if (searchParams.get('me') === '1') {
      if (!session?.uid) {
        return Response.json({ orders: [] });
      }
      const orders = await Order.find({ userId: session.uid })
        .sort({ createdAt: -1 })
        .lean();
      return Response.json({ orders: orders.map(serializeOrder) });
    }

    const limit = Number(searchParams.get('limit')) || 50;
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return Response.json({ orders: orders.map(serializeOrder) });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message || 'DB error' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = getSession();
    const body = await req.json();
    if (!body?.clientName || !body?.clientEmail || !Array.isArray(body?.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ message: 'Datos incompletos' }), { status: 400 });
    }

    await dbConnect();
    const payload = {
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      items: body.items.map((item) => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      status: body.status || 'PENDIENTE',
    };

    if (session?.uid) {
      payload.userId = session.uid;
    }

    if (body.contact && typeof body.contact === 'object') {
      const contactPayload = {};
      if (typeof body.contact.personType === 'string' && ['natural', 'empresa'].includes(body.contact.personType)) {
        contactPayload.personType = body.contact.personType;
      }
      if (body.contact.phone) contactPayload.phone = body.contact.phone;
      if (body.contact.address) contactPayload.address = body.contact.address;
      if (body.contact.rut) contactPayload.rut = body.contact.rut;
      if (body.contact.businessName) contactPayload.businessName = body.contact.businessName;
      if (Object.keys(contactPayload).length > 0) {
        payload.contact = {
          personType: contactPayload.personType || 'natural',
          ...(contactPayload.phone ? { phone: contactPayload.phone } : {}),
          ...(contactPayload.address ? { address: contactPayload.address } : {}),
          ...(contactPayload.rut ? { rut: contactPayload.rut } : {}),
          ...(contactPayload.businessName ? { businessName: contactPayload.businessName } : {}),
        };
      }
    }

    const order = await Order.create(payload);
    return Response.json({ ok: true, order: serializeOrder(order) });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message || 'DB error' }), { status: 500 });
  }
}
