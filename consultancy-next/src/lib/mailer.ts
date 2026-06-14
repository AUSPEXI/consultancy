/**
 * L8ENTSPACE transactional email helper.
 *
 * Thin wrapper around the same Gmail SMTP + nodemailer pattern already used by
 * notify-article and cron/run-automations, centralised so the report endpoint
 * and the email-funnel cron share one sender. Sending is fully gated on
 * EMAIL_USER / EMAIL_APP_PASSWORD — with no creds it is a safe no-op that
 * returns false rather than throwing, so callers never fail because email is
 * unconfigured.
 */

import nodemailer from 'nodemailer';

export function emailConfigured(): boolean {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!emailConfigured()) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }
  return cachedTransporter;
}

/**
 * Send a single HTML email. Returns { ok, error? } — ok=false (never throws) if
 * email is unconfigured or the send fails, with a short error for diagnostics.
 */
export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[mailer] EMAIL_USER/EMAIL_APP_PASSWORD not set — skipping send to', opts.to);
    return { ok: false, error: 'not_configured' };
  }
  try {
    // Send From the verified mailbox by default (EMAIL_USER = sales@auspexi.com),
    // which is guaranteed to send. To present the public l8entspace.com alias,
    // set EMAIL_FROM=sales@l8entspace.com once Gmail "send mail as" is verified.
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    // Fill the per-recipient unsubscribe link placeholder used by the templates.
    const html = opts.html.replace(/__UNSUB_EMAIL__/g, encodeURIComponent(opts.to));
    await transporter.sendMail({
      from: `"L8EntSpace" <${from}>`,
      to: opts.to,
      subject: opts.subject,
      html,
    });
    return { ok: true };
  } catch (err: any) {
    console.error('[mailer] send failed:', err);
    return { ok: false, error: String(err?.message || err).slice(0, 200) };
  }
}
