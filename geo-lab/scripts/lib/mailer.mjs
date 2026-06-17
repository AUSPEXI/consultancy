/**
 * GEO Lab email sender. Prefers Resend's HTTP API (RESEND_API_KEY); falls back
 * to Gmail SMTP (EMAIL_USER + EMAIL_APP_PASSWORD). Never throws — returns
 * { ok, error }. The From address is EMAIL_FROM || EMAIL_USER (a verified
 * l8entspace.com sender for Resend).
 */

import nodemailer from 'nodemailer';

function fromAddress() {
  return (process.env.EMAIL_FROM || process.env.EMAIL_USER || 'sales@l8entspace.com').trim();
}

export async function sendEmail({ to, subject, html, text, fromName = 'L8EntSpace' }) {
  const toAddr = (to || '').trim();

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromAddress()}>`,
          to: [toAddr],
          subject,
          ...(html ? { html } : {}),
          ...(text ? { text } : {}),
        }),
      });
      if (res.ok) return { ok: true };
      return { ok: false, error: `resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    } catch (err) {
      return { ok: false, error: String(err?.message || err).slice(0, 200) };
    }
  }

  // Fallback: Gmail SMTP
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  if (!user || !pass) return { ok: false, error: 'not_configured' };
  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress()}>`,
      to: toAddr,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err).slice(0, 200) };
  }
}
