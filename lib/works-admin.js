import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';

export const WORKS_CLOUDINARY_FOLDER = 'virtualdesk/works';
export const WORK_IMAGE_MAX_SIZE = 6 * 1024 * 1024;
export const WORK_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function serializeWork(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    imageUrl: doc.imageUrl,
    projectUrl: doc.projectUrl || '',
    order: typeof doc.order === 'number' ? doc.order : 0,
    createdAt: doc.createdAt?.toISOString() || null,
    updatedAt: doc.updatedAt?.toISOString() || null,
  };
}

export async function ensureSuperAdmin() {
  const session = getSession();
  if (!session?.uid) {
    throw Object.assign(new Error('Autenticación requerida.'), { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(session.uid).lean();
  if (!user) {
    throw Object.assign(new Error('Usuario no encontrado.'), { status: 404 });
  }

  const isSuperAdmin = user.role === 'admin' && user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
  if (!isSuperAdmin) {
    throw Object.assign(new Error('No autorizado.'), { status: 403 });
  }

  return { session, user };
}

function getCloudinaryCredentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw Object.assign(new Error('Configuración de Cloudinary incompleta.'), { status: 500 });
  }
  return { cloudName, apiKey, apiSecret };
}

export async function uploadWorkImage(file, publicIdHint) {
  if (!file || typeof file === 'string') {
    throw Object.assign(new Error('Imagen requerida.'), { status: 400 });
  }
  if (!WORK_ALLOWED_MIME.includes(file.type)) {
    throw Object.assign(new Error('Formato de imagen no soportado.'), { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength === 0 || buffer.byteLength > WORK_IMAGE_MAX_SIZE) {
    throw Object.assign(new Error('La imagen debe pesar menos de 6 MB.'), { status: 400 });
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = publicIdHint || `work_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;

  const paramsToSign = {
    folder: WORKS_CLOUDINARY_FOLDER,
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
  uploadForm.append('folder', WORKS_CLOUDINARY_FOLDER);
  uploadForm.append('public_id', publicId);
  uploadForm.append('overwrite', 'true');

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const uploadResponse = await fetch(uploadUrl, { method: 'POST', body: uploadForm });
  const uploadData = await uploadResponse.json().catch(() => ({}));

  if (!uploadResponse.ok) {
    const message = uploadData?.error?.message || 'No se pudo subir la imagen.';
    throw Object.assign(new Error(message), { status: 502 });
  }

  const secureUrl = uploadData.secure_url || uploadData.url;
  if (!secureUrl) {
    throw Object.assign(new Error('La respuesta de Cloudinary no contiene la URL.'), { status: 502 });
  }

  return { imageUrl: secureUrl, publicId };
}

export function extractWorkPublicId(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl) {
    return null;
  }
  const folderSegment = `${WORKS_CLOUDINARY_FOLDER}/`;
  const folderIndex = imageUrl.indexOf(folderSegment);
  if (folderIndex === -1) {
    return null;
  }
  const afterFolder = imageUrl.substring(folderIndex + folderSegment.length);
  if (!afterFolder) {
    return null;
  }
  const withoutExtension = afterFolder.replace(/\.[^/.]+$/, '');
  return withoutExtension;
}

export async function deleteWorkImage(publicId) {
  if (!publicId) return;

  let credentials;
  try {
    credentials = getCloudinaryCredentials();
  } catch (err) {
    return;
  }

  const { cloudName, apiKey, apiSecret } = credentials;
  const timestamp = Math.floor(Date.now() / 1000);
  const fullPublicId = publicId.startsWith(`${WORKS_CLOUDINARY_FOLDER}/`)
    ? publicId
    : `${WORKS_CLOUDINARY_FOLDER}/${publicId}`;

  const paramsToSign = {
    public_id: fullPublicId,
    timestamp,
  };
  const signatureBase = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');
  const signature = crypto.createHash('sha1').update(signatureBase + apiSecret).digest('hex');

  const destroyForm = new URLSearchParams();
  destroyForm.set('public_id', fullPublicId);
  destroyForm.set('timestamp', String(timestamp));
  destroyForm.set('api_key', apiKey);
  destroyForm.set('signature', signature);

  try {
    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: destroyForm,
    });
  } catch (err) {
    // Ignorar fallas de borrado para no bloquear la operación principal.
  }
}
