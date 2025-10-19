// lib/mailer.js
import nodemailer from 'nodemailer';

const g = globalThis; // cache global para lambdas Vercel

function must(name) {
  const v = process.env[name];
  if (v === undefined || v === '') throw new Error(`Missing env: ${name}`);
  return v;
}

function resolveBoolean(value, fallback = false) {
  if (typeof value === 'string') {
    const x = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y'].includes(x)) return true;
    if (['0', 'false', 'no', 'n'].includes(x)) return false;
  }
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'boolean') return value;
  return fallback;
}

export function getMailerConfig() {
  const host = must('SMTP_HOST');                   // smtp-relay.brevo.com
  const port = Number(process.env.SMTP_PORT || 587);
  // 587 => STARTTLS (secure=false). 465 => SSL directo (secure=true)
  const secure = port === 465
    ? true
    : resolveBoolean(process.env.SMTP_SECURE, false);

  // En Brevo, el usuario de login es el "Iniciar sesión" (algo@smtp-brevo.com)
  const user = must('SMTP_USER');
  const pass = must('SMTP_PASS');                   // clave SMTP larga de Brevo

  // 👇 Remitente visible (usa tu Gmail verificado en Brevo)
  // Ej: MAIL_FROM=VirtualDesk <virtualdeskspa@gmail.com>
  const from = (process.env.MAIL_FROM || user).trim();

  // Destino por defecto (puedes cambiarlo por MAIL_TO si lo tienes)
  const to = process.env.CONTACT_EMAIL_TO || process.env.MAIL_TO || 'virtualdeskspa@gmail.com';

  return {
    transport: { host, port, secure, auth: { user, pass } },
    defaults: { from, to },
  };
}

export function getTransporter() {
  if (g.__mailer_transporter) return g.__mailer_transporter;
  const cfg = getMailerConfig();
  const t = nodemailer.createTransport(cfg.transport);
  g.__mailer_transporter = t;
  return t;
}
