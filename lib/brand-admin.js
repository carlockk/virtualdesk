import crypto from 'crypto';
import { ensureAdmin as ensureAdminGuard } from '@/lib/admin-auth';

const BRAND_CLOUDINARY_FOLDER = 'virtualdesk/brand';
const BRAND_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const BRAND_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export const ensureAdmin = ensureAdminGuard;

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

export async function uploadBrandLogo(file, publicIdHint) {
  if (!file || typeof file === 'string') {
    const error = new Error('El logo es obligatorio.');
    error.status = 400;
    throw error;
  }

  if (!BRAND_ALLOWED_MIME.includes(file.type)) {
    const error = new Error('Formato de imagen no soportado.');
    error.status = 400;
    throw error;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength === 0 || buffer.byteLength > BRAND_IMAGE_MAX_SIZE) {
    const error = new Error('La imagen debe pesar menos de 5 MB.');
    error.status = 400;
    throw error;
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId =
    publicIdHint || `brand_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;

  const params = {
    folder: BRAND_CLOUDINARY_FOLDER,
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  };
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  const signature = crypto.createHash('sha1').update(signatureBase + apiSecret).digest('hex');

  const form = new FormData();
  form.append('file', `data:${file.type};base64,${buffer.toString('base64')}`);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', BRAND_CLOUDINARY_FOLDER);
  form.append('public_id', publicId);
  form.append('overwrite', 'true');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'No se pudo subir el logo.');
    error.status = 502;
    throw error;
  }

  const logoUrl = data.secure_url || data.url;
  if (!logoUrl) {
    const error = new Error('La respuesta de Cloudinary no contiene la URL.');
    error.status = 502;
    throw error;
  }

  return {
    logoUrl,
    publicId: data.public_id || `${BRAND_CLOUDINARY_FOLDER}/${publicId}`,
  };
}

export async function deleteBrandLogo(publicId) {
  if (!publicId) return;

  let credentials;
  try {
    credentials = getCloudinaryCredentials();
  } catch (err) {
    return;
  }

  const { cloudName, apiKey, apiSecret } = credentials;
  const timestamp = Math.floor(Date.now() / 1000);
  const fullPublicId = publicId.startsWith(`${BRAND_CLOUDINARY_FOLDER}/`)
    ? publicId
    : `${BRAND_CLOUDINARY_FOLDER}/${publicId}`;

  const params = {
    public_id: fullPublicId,
    timestamp,
  };
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  const signature = crypto.createHash('sha1').update(signatureBase + apiSecret).digest('hex');

  const form = new URLSearchParams();
  form.set('public_id', fullPublicId);
  form.set('timestamp', String(timestamp));
  form.set('api_key', apiKey);
  form.set('signature', signature);

  try {
    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
    });
  } catch (err) {
    // No interrumpir si falla el borrado.
  }
}
