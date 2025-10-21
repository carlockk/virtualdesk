import crypto from 'crypto';
import { ensureAdmin as ensureAdminGuard } from '@/lib/admin-auth';

export const SERVICES_CLOUDINARY_FOLDER = 'virtualdesk/services';
export const SERVICE_IMAGE_MAX_SIZE = 6 * 1024 * 1024;
export const SERVICE_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

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

export function serializeService(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    description: doc.description || '',
    imageUrl: doc.imageUrl || '',
    imagePublicId: doc.imagePublicId || '',
    icon: doc.icon || '',
    category: doc.category || '',
    price: typeof doc.price === 'number' ? doc.price : null,
    order: typeof doc.order === 'number' ? doc.order : 0,
    active: doc.active !== false,
    createdAt: doc.createdAt?.toISOString() || null,
    updatedAt: doc.updatedAt?.toISOString() || null,
  };
}

export function extractServicePublicId(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl) return null;
  const folderSegment = `${SERVICES_CLOUDINARY_FOLDER}/`;
  const folderIndex = imageUrl.indexOf(folderSegment);
  if (folderIndex === -1) return null;
  const afterFolder = imageUrl.substring(folderIndex + folderSegment.length);
  if (!afterFolder) return null;
  return afterFolder.replace(/\.[^/.]+$/, '');
}

export async function uploadServiceImage(file, publicIdHint) {
  if (!file || typeof file === 'string') {
    const error = new Error('Imagen requerida.');
    error.status = 400;
    throw error;
  }
  if (!SERVICE_ALLOWED_MIME.includes(file.type)) {
    const error = new Error('Formato de imagen no soportado.');
    error.status = 400;
    throw error;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength === 0 || buffer.byteLength > SERVICE_IMAGE_MAX_SIZE) {
    const error = new Error('La imagen debe pesar menos de 6 MB.');
    error.status = 400;
    throw error;
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId =
    publicIdHint || `service_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;

  const paramsToSign = {
    folder: SERVICES_CLOUDINARY_FOLDER,
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  };
  const signatureBase = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');
  const signature = crypto.createHash('sha1').update(signatureBase + apiSecret).digest('hex');

  const form = new FormData();
  form.append('file', `data:${file.type};base64,${buffer.toString('base64')}`);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', SERVICES_CLOUDINARY_FOLDER);
  form.append('public_id', publicId);
  form.append('overwrite', 'true');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'No se pudo subir la imagen.');
    error.status = 502;
    throw error;
  }

  const imageUrl = data.secure_url || data.url;
  if (!imageUrl) {
    const error = new Error('La respuesta de Cloudinary no contiene la URL.');
    error.status = 502;
    throw error;
  }

  return {
    imageUrl,
    publicId: data.public_id || `${SERVICES_CLOUDINARY_FOLDER}/${publicId}`,
  };
}

export async function deleteServiceImage(publicId) {
  if (!publicId) return;

  let credentials;
  try {
    credentials = getCloudinaryCredentials();
  } catch (err) {
    return;
  }

  const { cloudName, apiKey, apiSecret } = credentials;
  const timestamp = Math.floor(Date.now() / 1000);
  const fullPublicId = publicId.startsWith(`${SERVICES_CLOUDINARY_FOLDER}/`)
    ? publicId
    : `${SERVICES_CLOUDINARY_FOLDER}/${publicId}`;

  const paramsToSign = {
    public_id: fullPublicId,
    timestamp,
  };
  const signatureBase = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
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
    // Ignoramos errores de borrado para no afectar la operacion principal.
  }
}
