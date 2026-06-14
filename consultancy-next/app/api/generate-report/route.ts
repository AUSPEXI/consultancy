import { NextResponse } from 'next/server';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import { dbAdmin } from '@/lib/firebase-admin';
import { sendMail, emailConfigured } from '@/lib/mailer';
import { reportEmail, mdToHtml } from '@/lib/email-templates';

/**
 * Public lead-capture endpoint behind the homepage hero (domain + email).
 * Generates a GEO Visibility Report, emails it (branded), and registers the
 * lead so the email-funnel cron can run the 7-day follow-up sequence.
 *
 * Report generation always runs and is returned to the client; emailing and
 * lead persistence are best-effort side-effects that never block the response.
 */
export async function POST(request: Request) {
  try {
    const { email, domain } = await request.json();
    if (!domain) return NextResponse.json({ error: 'Missing domain' }, { status: 400 });

    // Optional Exa context — grounds the report in the domain's real pages.
    // Non-fatal: falls back to a context-free report if Exa is unavailable.
    let domainContext = '';
    try {
      const { getExa } = await import('@/lib/exa');
      const exa = getExa();
      const search = await exa.searchAndContents(`site:${domain} OR "${domain}"`, {
        type: 'neural',
        useAutoprompt: true,
        numResults: 6,
        text: true,
      });
      domainContext = search.results.map((r: any) => r.text).filter(Boolean).join('\n\n').substring(0, 12000);
    } catch (err) {
      console.warn('[generate-report] Exa context unavailable, continuing without it:', (err as any)?.message);
    }

    const prompt = `
      You are an expert GEO Auditor. A user submitted their domain for a free GEO Visibility Report.
      Domain: ${domain}
      ${domainContext ? `\nReal context gathered from their site:\n"""${domainContext}"""\n` : ''}
      Write a professional, dense, ~400-word GEO Visibility Report in clean markdown covering:
      1. Estimated AI Share of Voice (A-SOV) for this domain's category
      2. Top 3 cite-magnet opportunities (specific facts they should publish)
      3. Which AI platforms (ChatGPT, Gemini, Claude, Perplexity) they are likely visible on
      4. Two immediate actions to improve AI citation likelihood

      Be specific and data-driven${domainContext ? ', grounding observations in the provided context' : ''}. This is a public-facing report.
    `;

    const result = await llmOrchestrator.executeCall<string>({
      userId: email || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      feature: 'generate-report',
    });

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    const reportMarkdown = result.rawOutput || '';

    // Side-effects: email the report + register the lead for the drip. Only when
    // an email was supplied; all failures are swallowed so the report still returns.
    if (email && typeof email === 'string') {
      await Promise.allSettled([
        (async () => {
          if (!emailConfigured()) return;
          const { subject, html } = reportEmail(domain, mdToHtml(reportMarkdown));
          await sendMail({ to: email, subject, html });
        })(),
        (async () => {
          if (!dbAdmin) return;
          const id = email.toLowerCase().replace(/\//g, '_');
          const ref = dbAdmin.collection('report_leads').doc(id);
          const existing = await ref.get();
          if (!existing.exists) {
            await ref.set({
              email: email.toLowerCase(),
              domain,
              signupDate: Date.now(),
              lastEmailSentIndex: 0,
              createdAt: new Date().toISOString(),
            });
          }
        })(),
      ]);
    }

    return NextResponse.json({ success: true, report: reportMarkdown });
  } catch (error) {
    console.error('generate-report error:', error);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}
