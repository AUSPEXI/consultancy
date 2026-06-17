/**
 * L8ENTSPACE transactional email.
 *
 * Prefers Resend's HTTP API (works fine on serverless and isn't subject to
 * Gmail's SMTP/app-password policy), and falls back to Gmail SMTP when
 * RESEND_API_KEY is not set. Always returns { ok, error } — never throws.
 *
 * The send From address is the verified domain sender (EMAIL_FROM, default
 * EMAIL_USER → sales@l8entspace.com). For Resend, that domain must be verified
 * in the Resend dashboard.
 */

import nodemailer from 'nodemailer';

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
    || !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
}

function fromAddress(): string {
  return (process.env.EMAIL_FROM || process.env.EMAIL_USER || 'sales@l8entspace.com').trim();
}

export interface MailOpts {
  to: string;
  subject: string;
  html: string;
  /** Display name on the From header. Defaults to "L8EntSpace". */
  fromName?: string;
}

async function viaResend(opts: MailOpts): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${opts.fromName || 'L8EntSpace'} <${fromAddress()}>`,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: `resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err).slice(0, 200) };
  }
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD)) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        // Strip whitespace — Gmail shows app passwords as "abcd efgh ijkl mnop".
        user: (process.env.EMAIL_USER || '').trim(),
        pass: (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
      },
    });
  }
  return cachedTransporter;
}

async function viaSmtp(opts: MailOpts): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, error: 'not_configured' };
  try {
    await transporter.sendMail({
      from: `"${opts.fromName || 'L8EntSpace'}" <${fromAddress()}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err).slice(0, 200) };
  }
}

/**
 * Send a single HTML email via Resend (preferred) or Gmail SMTP (fallback).
 * Returns { ok, error }; ok=false (never throws) if unconfigured or it fails.
 */
export async function sendMail(opts: MailOpts): Promise<{ ok: boolean; error?: string }> {
  if (!emailConfigured()) {
    console.log('[mailer] no email provider configured — skipping send to', opts.to);
    return { ok: false, error: 'not_configured' };
  }
  // Fill the per-recipient unsubscribe link placeholder used by the templates.
  const html = opts.html.replace(/__UNSUB_EMAIL__/g, encodeURIComponent(opts.to));
  const filled = { ...opts, html };
  return process.env.RESEND_API_KEY ? viaResend(filled) : viaSmtp(filled);
}
