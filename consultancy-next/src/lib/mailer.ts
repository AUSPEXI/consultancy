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
 * Send a single HTML email. Returns true on success, false if email is not
 * configured or the send fails. Never throws — email is always best-effort.
 */
export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[mailer] EMAIL_USER/EMAIL_APP_PASSWORD not set — skipping send to', opts.to);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"L8EntSpace" <${process.env.EMAIL_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error('[mailer] send failed:', err);
    return false;
  }
}
