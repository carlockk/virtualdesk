import { getSession, clearSessionCookie, setSessionCookie, signSession } from '@/lib/auth';
import { getCloudinary, CLOUDINARY_FOLDERS } from '@/lib/cloudinary';
import { dbConnect } from '@/lib/mongodb';
import { serializeUser } from '@/lib/users';
import User from '@/models/User';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

export async function POST(req) {
  try {
    const session = await getSession(req);
    if (!session) {
      return json({ ok: false, message: 'Autenticacion requerida.' }, { status: 401 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return json({ ok: false, message: 'Solicitud invalida.' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return json({ ok: false, message: 'No se recibio ninguna imagen.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return json({ ok: false, message: 'La imagen excede el limite de 5MB.' }, { status: 413 });
    }

    if (!file.type?.startsWith('image/')) {
      return json({ ok: false, message: 'El archivo debe ser una imagen.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await dbConnect();
    const user = await User.findById(session.uid);
    if (!user) {
      const res = json({ ok: false, message: 'Usuario no encontrado.' }, { status: 404 });
      await clearSessionCookie(res);
      return res;
    }

    const cloudinary = getCloudinary();

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_FOLDERS.avatars,
          resource_type: 'image',
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      );

      uploadStream.end(buffer);
    });

    if (!result?.secure_url || !result?.public_id) {
      return json({ ok: false, message: 'No se pudo guardar la imagen.' }, { status: 500 });
    }

    const previousPublicId = user.avatarPublicId;

    user.avatarUrl = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    if (previousPublicId && previousPublicId !== result.public_id) {
      try {
        await cloudinary.uploader.destroy(previousPublicId);
      } catch (destroyErr) {
        console.error('No se pudo eliminar la imagen anterior de Cloudinary:', destroyErr);
      }
    }

    const token = await signSession({
      uid: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    });

    const res = json({ ok: true, user: serializeUser(user) });
    await setSessionCookie(res, token);
    return res;
  } catch (err) {
    console.error('Error subiendo imagen de perfil:', err);
    return json({ ok: false, message: err.message || 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getSession(req);
    if (!session) {
      return json({ ok: false, message: 'Autenticacion requerida.' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.uid);
    if (!user) {
      const res = json({ ok: false, message: 'Usuario no encontrado.' }, { status: 404 });
      await clearSessionCookie(res);
      return res;
    }

    if (user.avatarPublicId) {
      try {
        const cloudinary = getCloudinary();
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (destroyErr) {
        console.error('No se pudo eliminar la imagen de Cloudinary:', destroyErr);
      }
    }

    user.avatarUrl = '';
    user.avatarPublicId = '';
    await user.save();

    const token = await signSession({
      uid: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    });

    const res = json({ ok: true, user: serializeUser(user) });
    await setSessionCookie(res, token);
    return res;
  } catch (err) {
    console.error('Error eliminando imagen de perfil:', err);
    return json({ ok: false, message: err.message || 'Error del servidor' }, { status: 500 });
  }
}
