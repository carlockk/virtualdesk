// app/api/contact/route.js
// ✅ Nodemailer requiere runtime Node (no Edge)
// ✅ Forzamos dynamic para evitar caché en Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getMailerConfig, getTransporter } from '@/lib/mailer';

// Lee JSON o FormData sin romper si cambias el form
async function readBody(req) {
  const ctype = req.headers.get('content-type') || '';
  if (ctype.includes('application/json')) {
    return await req.json();
  }
  if (ctype.includes('multipart/form-data')) {
    const fd = await req.formData();
    return {
      name: fd.get('name') || fd.get('nombre') || '',
      email: fd.get('email') || '',
      message: fd.get('message') || fd.get('mensaje') || '',
      phone: fd.get('phone') || fd.get('telefono') || '',
      subject: fd.get('subject') || fd.get('asunto') || '',
    };
  }
  try { return await req.json(); } catch { return {}; }
}

// GET → healthcheck (para abrir en el navegador sin 405)
export async function GET() {
  try {
    const mailConfig = getMailerConfig();    // valida envs
    const transporter = getTransporter();
    await transporter.verify();              // valida credenciales/conexión

    return Response.json({
      ok: true,
      transport: 'ready',
      from: mailConfig.defaults.from,
      to: mailConfig.defaults.to,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// POST → envío real desde el formulario
export async function POST(req) {
  try {
    const body = await readBody(req);
    const name    = (body?.name    || '').toString().trim();
    const email   = (body?.email   || '').toString().trim();
    const message = (body?.message || '').toString().trim();
    const phone   = (body?.phone   || '').toString().trim();
    const subject = (body?.subject || `Nuevo contacto — ${name || 'Sin nombre'}`).toString().trim();

    if (!name || !email || !message) {
      return Response.json(
        { ok: false, message: 'Datos incompletos: name, email, message' },
        { status: 400 }
      );
    }

    const mailConfig = getMailerConfig();     // lee env + defaults (from / to)
    const transporter = getTransporter();

    // Verifica credenciales antes de enviar (útil en Vercel)
    await transporter.verify();

    const info = await transporter.sendMail({
      from: mailConfig.defaults.from,        // ⚠️ Debe ser remitente verificado en Brevo
      to:   mailConfig.defaults.to,
      replyTo: email,                         // para responderle directo al cliente
      subject,
      text:
`De: ${name} <${email}>
Teléfono: ${phone || '—'}

Mensaje:
${message}
`,
      html:
`<p><strong>De:</strong> ${name} &lt;${email}&gt;</p>
<p><strong>Teléfono:</strong> ${phone || '—'}</p>
<p><strong>Mensaje:</strong></p>
<p style="white-space:pre-line;">${message}</p>`,
    });

    return Response.json({ ok: true, messageId: info?.messageId || null }, { status: 200 });
  } catch (err) {
    // Devuelve detalle útil para ver en Network/Logs de Vercel
    return Response.json(
      { ok: false, message: err?.message || 'Mail error' },
      { status: 500 }
    );
  }
}
