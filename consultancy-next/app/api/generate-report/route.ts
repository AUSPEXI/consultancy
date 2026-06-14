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
 * The response also carries diagnostic flags (grounded / emailSent / leadSaved)
 * so the funnel can be debugged from the client during rollout.
 */
export async function POST(request: Request) {
  try {
    const { email, domain } = await request.json();
    if (!domain) return NextResponse.json({ error: 'Missing domain' }, { status: 400 });

    const cleanDomain = String(domain).trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // Fetch the domain's real content so the report is grounded, not guessed.
    // Restricting to the domain (includeDomains) reliably returns THEIR pages;
    // a bare `site:` neural query does not. Non-fatal — we record `grounded`.
    let domainContext = '';
    try {
      const { getExa } = await import('@/lib/exa');
      const exa = getExa();
      const search = await exa.searchAndContents(`${cleanDomain} — what this company does, products, services`, {
        type: 'keyword',
        includeDomains: [cleanDomain],
        numResults: 8,
        text: { maxCharacters: 2500 },
      });
      domainContext = search.results
        .map((r: any) => `URL: ${r.url}\n${r.text || ''}`)
        .filter(Boolean)
        .join('\n\n')
        .substring(0, 14000);
    } catch (err) {
      console.warn('[generate-report] Exa grounding failed, continuing:', (err as any)?.message);
    }
    const grounded = domainContext.trim().length > 200;

    const prompt = grounded
      ? `You are an expert GEO (Generative Engine Optimization) auditor analysing the website ${cleanDomain}.

Below is REAL content scraped from ${cleanDomain}. Base EVERY statement strictly on it. Do NOT guess or invent the company's industry, products, or business model — read what they actually do from the content.

CONTENT FROM ${cleanDomain}:
"""
${domainContext}
"""

Write a professional, specific, ~400-word GEO Visibility Report in clean markdown with these sections:
1. What ${cleanDomain} does (one accurate sentence, drawn only from the content above) and its estimated AI Share of Voice for that category
2. Top 3 cite-magnet opportunities — specific, real facts THIS company should publish to get cited
3. Which AI platforms (ChatGPT, Gemini, Claude, Perplexity) they are likely visible on and why
4. Two immediate actions to improve AI citation likelihood

Rules: Do NOT include a date line, an "Auditor:" line, or any [bracketed placeholders]. Write directly to the site owner. Be concrete and accurate.`
      : `You are an expert GEO (Generative Engine Optimization) auditor. A user requested a free report for the domain ${cleanDomain}, but we could not retrieve its public content.

Write a ~350-word GEO Visibility Report in clean markdown that:
1. States plainly that we could not retrieve enough public content from ${cleanDomain} to analyse its specific business, so this report gives general GEO guidance rather than domain-specific findings. Do NOT guess or invent what the company does.
2. Explains general GEO best practices: cite-magnet facts, JSON-LD schema, entity clarity, and being cited across ChatGPT, Gemini, Claude, and Perplexity.
3. Gives two immediate, universally-applicable actions to improve AI citation likelihood.

Rules: Do NOT fabricate an industry, products, A-SOV percentages, a date line, an "Auditor:" line, or any [bracketed placeholders]. Write directly to the site owner.`;

    const result = await llmOrchestrator.executeCall<string>({
      userId: email || 'anonymous',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      feature: 'generate-report',
    });

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

    const reportMarkdown = result.rawOutput || '';

    // Side-effects: email the report + register the lead for the drip. Captured
    // (not just settled) so the response can report what actually happened.
    let emailSent = false;
    let emailError: string | undefined;
    let leadSaved = false;

    if (email && typeof email === 'string') {
      if (emailConfigured()) {
        const { subject, html } = reportEmail(cleanDomain, mdToHtml(reportMarkdown));
        const r = await sendMail({ to: email, subject, html });
        emailSent = r.ok;
        emailError = r.error;
      } else {
        emailError = 'not_configured';
      }

      try {
        if (dbAdmin) {
          const id = email.toLowerCase().replace(/\//g, '_');
          const ref = dbAdmin.collection('report_leads').doc(id);
          const existing = await ref.get();
          if (!existing.exists) {
            await ref.set({
              email: email.toLowerCase(),
              domain: cleanDomain,
              signupDate: Date.now(),
              lastEmailSentIndex: 0,
              createdAt: new Date().toISOString(),
            });
          }
          leadSaved = true;
        }
      } catch (err) {
        console.error('[generate-report] lead save failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      report: reportMarkdown,
      // Diagnostics (safe booleans + short error) — useful during funnel rollout.
      grounded,
      emailConfigured: emailConfigured(),
      emailSent,
      emailError,
      leadSaved,
    });
  } catch (error) {
    console.error('generate-report error:', error);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}
