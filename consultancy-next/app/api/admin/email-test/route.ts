import { NextResponse } from 'next/server';
import { secretsMatch } from '@/lib/api-auth';
import { sendMail, emailConfigured } from '@/lib/mailer';

/**
 * One-shot email self-test. Gated by CRON_SECRET (same trust as the cron jobs).
 * Attempts a real send through the shared mailer to your own REPORT_EMAIL inbox
 * and returns exactly what happened — including the auth user and the app-password
 * length (never the value) — so a 535 / wrong-account / whitespace issue is obvious.
 *
 * Usage: GET/POST /api/admin/email-test?secret=<CRON_SECRET>
 * Remove once email is confirmed working.
 */
async function handle(req: Request) {
  const url = new URL(req.url);
  const secret = req.headers.get('x-cron-secret') ?? url.searchParams.get('secret');
  if (!secretsMatch(secret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = (process.env.EMAIL_USER || '').trim();
  const from = (process.env.EMAIL_FROM || process.env.EMAIL_USER || '').trim();
  const toEmail = (process.env.REPORT_EMAIL || process.env.EMAIL_USER || '').trim();
  const passLen = (process.env.EMAIL_APP_PASSWORD || '').replace(/\s+/g, '').length;
  const diag = { user, from, toEmail, passLen };

  if (!emailConfigured()) {
    return NextResponse.json({ ok: false, error: 'not_configured', ...diag });
  }

  const r = await sendMail({
    to: toEmail,
    subject: 'L8EntSpace email self-test',
    html: '<p>If you can read this, Gmail SMTP auth is working. ✅</p>',
  });

  return NextResponse.json({ ok: r.ok, error: r.error, ...diag });
}

export async function GET(req: Request) { return handle(req); }
export async function POST(req: Request) { return handle(req); }
