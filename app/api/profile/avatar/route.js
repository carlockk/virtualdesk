import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const CLOUDINARY_FOLDER = 'virtualdesk/avatars';

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

function serializeUser(userDoc) {
  return {
    id: String(userDoc._id),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role || 'user',
    avatarUrl: userDoc.avatarUrl || '',
    personType: userDoc.personType || 'natural',
    phone: userDoc.phone || '',
    address: userDoc.address || '',
    rut: userDoc.rut || '',
    businessName: userDoc.businessName || '',
  };
}

export async function POST(req) {
  try {
    const session = getSession();
    if (!session?.uid) {
      return json({ ok: false, message: 'Autenticacion requerida.' }, { status: 401 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return json({ ok: false, message: 'Configuracion de Cloudinary incompleta.' }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return json({ ok: false, message: 'Archivo de imagen requerido.' }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return json({ ok: false, message: 'Formato de imagen no soportado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_FILE_SIZE) {
      return json({ ok: false, message: 'La imagen debe pesar menos de 5 MB.' }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `user_${session.uid}`;
    const paramsToSign = {
      folder: CLOUDINARY_FOLDER,
      overwrite: 'true',
      public_id: publicId,
      timestamp,
    };

    const signatureBase = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&');
    const signature = crypto.createHash('sha1').update(signatureBase + apiSecret).digest('hex');

    const uploadForm = new FormData();
    uploadForm.append('file', `data:${file.type};base64,${buffer.toString('base64')}`);
    uploadForm.append('api_key', apiKey);
    uploadForm.append('timestamp', String(timestamp));
    uploadForm.append('signature', signature);
    uploadForm.append('folder', CLOUDINARY_FOLDER);
    uploadForm.append('public_id', publicId);
    uploadForm.append('overwrite', 'true');

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadForm,
    });
    const uploadData = await uploadResponse.json().catch(() => ({}));

    if (!uploadResponse.ok) {
      return json(
        { ok: false, message: uploadData?.error?.message || 'No se pudo subir la imagen.' },
        { status: 502 },
      );
    }

    await dbConnect();
    const user = await User.findById(session.uid);
    if (!user) {
      return json({ ok: false, message: 'Usuario no encontrado.' }, { status: 404 });
    }

    user.avatarUrl = uploadData.secure_url || uploadData.url || '';
    await user.save();

    return json({ ok: true, user: serializeUser(user) });
  } catch (err) {
    return json({ ok: false, message: err.message || 'Error al procesar la imagen.' }, { status: 500 });
  }
}
