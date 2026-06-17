import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import admin from '@/lib/firebase-admin';
import { requireTier } from '@/lib/api-auth';

function buildArticleEmail(topic: string, brand: string, article: string, schema: string, timestamp: string): string {
  const date = new Date(timestamp || Date.now()).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
  const schemaBlock = schema
    ? `<div style="margin-top:24px;padding:16px;background:#18181b;border:1px solid #3f3f46;border-radius:8px;">
        <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.05em;">JSON-LD Schema</p>
        <pre style="margin:0;font-size:11px;color:#d4d4d8;white-space:pre-wrap;word-break:break-all;">${schema.substring(0, 3000)}${schema.length > 3000 ? '\n... (truncated)' : ''}</pre>
      </div>`
    : '';

  const articleLines = article
    .split('\n')
    .map(line => {
      if (line.startsWith('# ')) return `<h1 style="font-size:22px;font-weight:700;color:#fff;margin:24px 0 8px;">${line.slice(2)}</h1>`;
      if (line.startsWith('## ')) return `<h2 style="font-size:18px;font-weight:600;color:#e4e4e7;margin:20px 0 6px;">${line.slice(3)}</h2>`;
      if (line.startsWith('### ')) return `<h3 style="font-size:15px;font-weight:600;color:#d4d4d8;margin:16px 0 4px;">${line.slice(4)}</h3>`;
      if (line.startsWith('- ') || line.startsWith('* ')) return `<li style="color:#d4d4d8;margin:4px 0;">${line.slice(2)}</li>`;
      if (line.startsWith('**') && line.endsWith('**')) return `<p style="font-weight:600;color:#e4e4e7;margin:8px 0;">${line.slice(2, -2)}</p>`;
      if (line.trim() === '') return '<br/>';
      return `<p style="color:#d4d4d8;margin:6px 0;line-height:1.6;">${line}</p>`;
    })
    .join('');

  return `
<div style="font-family:'Inter',sans-serif;max-width:680px;margin:0 auto;background:#09090b;color:#fafafa;border-radius:8px;overflow:hidden;border:1px solid #27272a;">
  <div style="padding:28px 32px;border-bottom:1px solid #27272a;background:linear-gradient(to right,#18181b,#09090b);">
    <p style="margin:0;font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.1em;">L8EntSpace · Agent Orchestration</p>
    <h1 style="margin:8px 0 4px;font-size:20px;font-weight:700;color:#fff;">New GEO Article Ready</h1>
    <p style="margin:0;font-size:13px;color:#71717a;">${date}</p>
  </div>

  <div style="padding:24px 32px;background:#0d0d10;border-bottom:1px solid #27272a;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.05em;">Topic</p>
    <p style="margin:0;font-size:16px;font-weight:600;color:#e4e4e7;">${topic}</p>
    ${brand ? `<p style="margin:6px 0 0;font-size:12px;color:#71717a;">Brand: <span style="color:#a1a1aa;">${brand}</span></p>` : ''}
  </div>

  <div style="padding:24px 32px;">
    <p style="margin:0 0 16px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.05em;">Generated Article</p>
    <div style="background:#0d0d10;border:1px solid #27272a;border-radius:8px;padding:20px;">
      ${articleLines}
    </div>
    ${schemaBlock}
  </div>

  <div style="padding:20px 32px;background:#0d0d10;border-top:1px solid #27272a;">
    <p style="margin:0 0 8px;font-size:12px;color:#71717a;">To publish this article:</p>
    <ol style="margin:0;padding-left:20px;color:#a1a1aa;font-size:12px;line-height:1.8;">
      <li>Copy the article above and paste it into your website CMS or page editor</li>
      <li>Add the JSON-LD schema in a &lt;script type="application/ld+json"&gt; tag in your &lt;head&gt;</li>
      <li>Publish the page, then re-run the Citation Probe in 2–4 weeks</li>
    </ol>
  </div>

  <div style="padding:20px 32px;text-align:center;border-top:1px solid #27272a;color:#52525b;font-size:11px;">
    © ${new Date().getFullYear()} L8EntSpace. All rights reserved.
  </div>
</div>`;
}

export async function POST(request: Request) {
  const auth = await requireTier(request, 'Starter');
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { topic, article, facts, schema, brand, timestamp } = await request.json();

    if (!article) {
      return NextResponse.json({ error: 'article required' }, { status: 400 });
    }

    // Resolve recipient email via Firebase Auth
    let recipientEmail: string | null = null;
    try {
      const authAdmin = admin.auth();
      const userRecord = await authAdmin.getUser(userId);
      recipientEmail = userRecord.email || null;
    } catch {
      // Try user doc as fallback
      if (dbAdmin) {
        const snap = await dbAdmin.collection('users').doc(userId).get();
        recipientEmail = snap.data()?.email || null;
      }
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Could not resolve user email' }, { status: 400 });
    }

    const { sendMail, emailConfigured } = await import('@/lib/mailer');
    if (!emailConfigured()) {
      // No email config — still return success (article is already in Firestore)
      return NextResponse.json({ success: true, emailed: false, note: 'Email not configured (set RESEND_API_KEY or EMAIL_USER/EMAIL_APP_PASSWORD)' });
    }

    const r = await sendMail({
      to: recipientEmail,
      subject: `New GEO Article Ready: "${topic}"`,
      html: buildArticleEmail(topic, brand || '', article, schema || '', timestamp || new Date().toISOString()),
    });

    return NextResponse.json({ success: true, emailed: r.ok, error: r.error, to: recipientEmail });
  } catch (err: any) {
    console.error('[notify-article] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
