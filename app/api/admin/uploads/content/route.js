import crypto from 'crypto';
import { ensureAdmin } from '@/lib/admin-auth';

const CONTENT_CLOUDINARY_FOLDER = 'virtualdesk/pages';
const CONTENT_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const CONTENT_MAX_SIZE = 8 * 1024 * 1024;

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

function getCloudinaryCredentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error('Configuracion de Cloudinary incompleta.');
    error.status = 500;
    throw error;
  }
  return { cloudName, apiKey, apiSecret };
}

export async function POST(req) {
  try {
    await ensureAdmin();

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return json({ ok: false, message: 'Datos invalidos.' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return json({ ok: false, message: 'Debes seleccionar una imagen.' }, { status: 400 });
    }

    if (!CONTENT_ALLOWED_MIME.includes(file.type)) {
      return json({ ok: false, message: 'Formato de imagen no soportado.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.byteLength === 0 || buffer.byteLength > CONTENT_MAX_SIZE) {
      return json({ ok: false, message: 'La imagen debe pesar menos de 8 MB.' }, { status: 400 });
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `content_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;

    const paramsToSign = {
      folder: CONTENT_CLOUDINARY_FOLDER,
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
    uploadForm.append('folder', CONTENT_CLOUDINARY_FOLDER);
    uploadForm.append('public_id', publicId);
    uploadForm.append('overwrite', 'true');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadForm,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || 'No se pudo subir la imagen.';
      return json({ ok: false, message }, { status: 502 });
    }

    const url = data.secure_url || data.url;
    if (!url) {
      return json({ ok: false, message: 'Cloudinary no devolvio la URL.' }, { status: 502 });
    }

    return json({
      ok: true,
      url,
      publicId: data.public_id || `${CONTENT_CLOUDINARY_FOLDER}/${publicId}`,
      width: data.width || null,
      height: data.height || null,
      bytes: data.bytes || buffer.byteLength,
      format: data.format || file.type,
      originalName: file.name || '',
    });
  } catch (err) {
    return json(
      { ok: false, message: err.message || 'No se pudo subir la imagen.' },
      { status: err.status || 500 },
    );
  }
}
