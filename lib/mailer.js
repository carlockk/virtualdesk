// lib/mailer.js
import nodemailer from 'nodemailer';

const g = globalThis; // cache global en Vercel

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

function extractEmail(maybeDisplay) {
  // "Nombre <correo@dominio>" -> correo@dominio
  if (!maybeDisplay) return '';
  const m = /<([^>]+)>/.exec(maybeDisplay);
  return (m ? m[1] : maybeDisplay).trim().replace(/^"+|"+$/g, ''); // quita comillas
}

export function getMailerConfig() {
  const host = must('SMTP_HOST');                 // smtp-relay.brevo.com
  const port = Number(process.env.SMTP_PORT || 587);
  // fuerza false en 587; true solo si explícitamente pones puerto 465
  const secure = port === 465
    ? true
    : resolveBoolean(process.env.SMTP_SECURE, false);

  const user = must('SMTP_USER');                 // virtualdeskspa@gmail.com
  const pass = must('SMTP_PASS');                 // API KEY de Brevo

  // Remitentes y destino
  const rawFrom = (process.env.MAIL_FROM || user).trim();
  const fromEmail = extractEmail(rawFrom) || user;

  // ⚠️ Recomendación: el remitente debe ser exactamente el verificado (tu Gmail)
  if (fromEmail.toLowerCase() !== user.toLowerCase()) {
    // Evita bloqueos de Brevo usando el mismo remitente que autentica
    // y mantén (si quieres) el display name.
    console.warn('[mailer] Ajustando FROM para coincidir con SMTP_USER (recomendado por Brevo).');
  }

  const from = rawFrom.includes('<')
    ? `VirtualDesk <${user}>`
    : user;

  const to = process.env.CONTACT_EMAIL_TO || process.env.MAIL_TO || user;

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

export async function verifyTransporter() {
  const t = getTransporter();
  return t.verify(); // lanza si hay problema de credenciales/red
}
