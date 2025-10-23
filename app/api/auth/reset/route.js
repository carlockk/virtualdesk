import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { getMailerConfig, getTransporter } from '@/lib/mailer';

const requestSchema = z.object({
  email: z.string().email().max(254),
});

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$!#%';
  const bytes = crypto.randomBytes(12);
  let result = '';
  for (let i = 0; i < bytes.length; i += 1) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result.slice(0, 12);
}

export async function POST(req) {
  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return json({ ok: false, message: 'Correo no válido' }, { status: 400 });
    }

    const emailNorm = parsed.data.email.trim().toLowerCase();
    await dbConnect();

    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return json({ ok: false, message: 'No encontramos una cuenta con ese correo' }, { status: 404 });
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    const mailerConfig = getMailerConfig();
    const transporter = getTransporter();

    const subject = 'VirtualDesk - Contraseña temporal';
    const plainText = [
      'Hola,',
      '',
      'Recibimos una solicitud para restablecer tu contraseña en VirtualDesk.',
      'Estos son los datos para reingresar:',
      `Correo: ${user.email}`,
      `Contraseña temporal: ${temporaryPassword}`,
      '',
      'Te recomendamos iniciar sesión y actualizar tu contraseña por una nueva lo antes posible.',
      '',
      'Si no solicitaste este cambio, contacta al soporte de VirtualDesk.',
      '',
      'Equipo VirtualDesk',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h1 style="font-size: 18px; color: #111827;">Hola ${user.name || ''},</h1>
        <p>Recibimos una solicitud para restablecer tu contraseña en <strong>VirtualDesk</strong>.</p>
        <p>Utiliza estas credenciales para ingresar nuevamente:</p>
        <ul style="background:#f3f4f6; border-radius:8px; padding:12px 16px; list-style:none;">
          <li><strong>Correo:</strong> ${user.email}</li>
          <li><strong>Contraseña temporal:</strong> ${temporaryPassword}</li>
        </ul>
        <p>Una vez que inicies sesión, cambia tu contraseña por una nueva desde tu perfil.</p>
        <p>Si no solicitaste este cambio, responde este correo o comunícate con soporte.</p>
        <p style="margin-top:24px;">Equipo VirtualDesk</p>
      </div>
    `;

    await transporter.sendMail({
      from: mailerConfig.defaults.from,
      to: user.email,
      subject,
      text: plainText,
      html,
    });

    return json({
      ok: true,
      message: 'Listo, revisa tu correo. Te enviamos una contraseña temporal.',
    });
  } catch (error) {
    console.error('Password reset error', error);
    return json({ ok: false, message: 'No pudimos completar el restablecimiento.' }, { status: 500 });
  }
}
