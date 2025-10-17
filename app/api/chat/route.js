import { getSession } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';

export async function GET(req) {
  try {
    const session = await getSession(req);
    const { searchParams } = new URL(req.url);
    const requestedChannel = searchParams.get('channel');

    await dbConnect();

    if (session?.role === 'admin') {
      if (requestedChannel) {
        const messages = await Message.find({ channel: requestedChannel }).sort({ createdAt: 1 }).limit(500).lean();
        return Response.json({ messages });
      }

      const aggregated = await Message.aggregate([
        { $match: { channel: { $exists: true, $ne: null } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$channel',
            lastText: { $first: '$text' },
            lastSender: { $first: '$sender' },
            lastFromRole: { $first: '$fromRole' },
            lastAt: { $first: '$createdAt' },
            user: { $first: '$user' },
            total: { $sum: 1 },
          },
        },
        { $sort: { lastAt: -1 } },
        { $limit: 100 },
      ]);

      const userIds = aggregated
        .map((item) => item.user)
        .filter(Boolean)
        .map((id) => id.toString());

      const users = userIds.length
        ? await User.find({ _id: { $in: userIds } })
            .select(['name', 'email'])
            .lean()
        : [];

      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const conversations = aggregated.map((item) => ({
        channel: item._id,
        totalMessages: item.total,
        lastMessage: {
          text: item.lastText,
          sender: item.lastSender,
          fromRole: item.lastFromRole,
          createdAt: item.lastAt,
        },
        user: item.user ? userMap.get(item.user.toString()) || null : null,
      }));

      return Response.json({ conversations });
    }

    const channel = session ? session.uid : requestedChannel;

    if (!channel) {
      return new Response(JSON.stringify({ message: 'Canal requerido' }), { status: 400 });
    }

    if (session && channel !== session.uid) {
      return new Response(JSON.stringify({ message: 'Acceso denegado' }), { status: 403 });
    }

    const messages = await Message.find({ channel }).sort({ createdAt: 1 }).limit(200).lean();
    return Response.json({ messages });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message || 'DB error' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSession(req);
    const body = await req.json();
    const text = (body.text || '').toString().trim();

    if (!text) {
      return new Response(JSON.stringify({ message: 'Mensaje requerido' }), { status: 400 });
    }

    await dbConnect();

    let channel = body.channel;
    let sender = (body.sender || '').toString().trim();
    let fromRole = 'guest';
    let userId = null;

    if (session) {
      if (session.role === 'admin') {
        fromRole = 'admin';
        sender = session.name || 'Administrador';
        if (!channel) {
          return new Response(JSON.stringify({ message: 'Canal requerido para responder' }), { status: 400 });
        }
      } else {
        fromRole = 'user';
        channel = session.uid;
        sender = session.name || sender || 'Usuario';
        userId = session.uid;
      }
    }

    if (!channel) {
      return new Response(JSON.stringify({ message: 'Canal no especificado' }), { status: 400 });
    }

    const msg = await Message.create({
      channel,
      sender: sender || (session ? session.name : 'Invitado'),
      fromRole,
      text,
      user: userId || undefined,
    });

    return Response.json({ ok: true, id: msg._id });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message || 'DB error' }), { status: 500 });
  }
}
