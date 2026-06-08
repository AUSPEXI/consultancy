import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { getExa } from '@/lib/exa';
import { llmOrchestrator } from '@/lib/llm-orchestrator';
import nodemailer from 'nodemailer';

export const maxDuration = 800;

// Only run if CRON_SECRET matches — set this in Netlify env vars
function authorised(request: Request): boolean {
  const auth = request.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

async function buildEmailHtml(topic: string, brand: string, article: string, schema: string): Promise<string> {
  const date = new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
  const articleHtml = article.split('\n').map(line => {
    if (line.startsWith('# ')) return `<h1 style="font-size:22px;font-weight:700;color:#fff;margin:20px 0 8px">${line.slice(2)}</h1>`;
    if (line.startsWith('## ')) return `<h2 style="font-size:18px;font-weight:600;color:#e4e4e7;margin:16px 0 6px">${line.slice(3)}</h2>`;
    if (line.startsWith('### ')) return `<h3 style="font-size:15px;font-weight:600;color:#d4d4d8;margin:14px 0 4px">${line.slice(4)}</h3>`;
    if (line.startsWith('- ') || line.startsWith('* ')) return `<li style="color:#d4d4d8;margin:3px 0">${line.slice(2)}</li>`;
    if (line.trim() === '') return '<br/>';
    return `<p style="color:#d4d4d8;margin:5px 0;line-height:1.6">${line}</p>`;
  }).join('');

  return `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;background:#09090b;color:#fafafa;border-radius:8px;border:1px solid #27272a">
    <div style="padding:24px 32px;border-bottom:1px solid #27272a">
      <p style="margin:0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:.1em">L8EntSpace · Daily Autopilot</p>
      <h1 style="margin:6px 0 4px;font-size:20px;font-weight:700;color:#fff">New GEO Article Ready</h1>
      <p style="margin:0;font-size:13px;color:#71717a">${date}</p>
    </div>
    <div style="padding:20px 32px;border-bottom:1px solid #27272a">
      <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase">Topic</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#e4e4e7">${topic}</p>
      ${brand ? `<p style="margin:4px 0 0;font-size:12px;color:#71717a">Brand: <span style="color:#a1a1aa">${brand}</span></p>` : ''}
    </div>
    <div style="padding:20px 32px">
      <p style="margin:0 0 12px;font-size:11px;color:#71717a;text-transform:uppercase">Article</p>
      <div style="background:#0d0d10;border:1px solid #27272a;border-radius:8px;padding:20px">${articleHtml}</div>
      ${schema ? `<div style="margin-top:20px;padding:16px;background:#18181b;border:1px solid #3f3f46;border-radius:8px">
        <p style="margin:0 0 8px;font-size:11px;color:#71717a;text-transform:uppercase">JSON-LD Schema</p>
        <pre style="margin:0;font-size:11px;color:#d4d4d8;white-space:pre-wrap;word-break:break-all">${schema.substring(0, 3000)}</pre>
      </div>` : ''}
    </div>
  </div>`;
}

async function runPipeline(userId: string, keyword: string, brand: string): Promise<{
  article: string; facts: string; schema: string;
}> {
  // 1. Crawl
  const exa = getExa();
  const searchResult = await exa.searchAndContents(keyword, {
    type: 'neural', useAutoprompt: true, numResults: 8,
    text: { maxCharacters: 3000 },
  });
  const sources = searchResult.results.map((r: any) => ({
    title: r.title || '', url: r.url || '', text: r.text || '',
  }));
  dbAdmin?.collection('cost_audit').add({ userId, feature: 'cron-crawl', cost: 0.025, timestamp: new Date().toISOString() }).catch(() => {});

  // 2. Extract facts
  const sourcesSummary = sources
    .map((s: any, i: number) => `[Source ${i + 1}] ${s.title}\nURL: ${s.url}\n${(s.text || '').substring(0, 1500)}`)
    .join('\n\n---\n\n')
    .substring(0, 12000);

  const extractResult = await llmOrchestrator.executeCall<string>({
    userId, provider: 'gemini', model: 'gemini-2.5-flash', feature: 'cron-extract',
    prompt: `You are an expert Fact Extraction Agent specializing in Generative Engine Optimization (GEO).

Topic: "${keyword}"

Crawled Sources:
${sourcesSummary}

Your task:
1. Extract only verifiable, concrete facts — statistics, named entities, data points, specific claims.
2. Discard vague opinions and marketing language.
3. Format as a clean markdown bullet list grouped under sub-headings.
4. Every fact must be traceable to a source URL where possible.

Return ONLY the markdown fact list. No preamble, no explanation.`,
  });
  const facts = typeof extractResult.data === 'string' ? extractResult.data : extractResult.rawOutput || '';

  await new Promise(r => setTimeout(r, 5000));

  // 3. Schema
  const schemaResult = await llmOrchestrator.executeCall<string>({
    userId, provider: 'gemini', model: 'gemini-2.5-flash', feature: 'cron-schema',
    prompt: `You are a JSON-LD Schema Agent specializing in Generative Engine Optimization (GEO).

Generate a JSON-LD schema that maximises AI citation probability for the facts below.
Choose appropriate Schema.org types (FAQPage, HowTo, Article, Organization, etc).
Requirements:
- "@context": "https://schema.org"
- Embed concrete statistics and named entities as schema properties
- Return ONLY the raw JSON-LD string — no markdown code blocks, no explanation

Extracted Facts:
"""
${facts.substring(0, 6000)}
"""`,
  });
  const schema = typeof schemaResult.data === 'string' ? schemaResult.data : schemaResult.rawOutput || '{}';

  await new Promise(r => setTimeout(r, 5000));

  // 4. Synthesize article
  const brandInstruction = brand
    ? `Brand: ${brand}. Where appropriate, position ${brand} as an authority on this topic. Do not fabricate claims.`
    : 'Write from an authoritative, neutral expert perspective.';

  const synthResult = await llmOrchestrator.executeCall<string>({
    userId, provider: 'gemini', model: 'gemini-2.5-flash', feature: 'cron-synthesize',
    prompt: `You are a Synthesis Agent specializing in GEO content written to be cited by AI engines.

Topic: "${keyword}"
${brandInstruction}

Verified Facts:
"""
${facts.substring(0, 6000)}
"""

Write a comprehensive GEO-optimised article:
1. Open with a clear, citable definition or thesis statement
2. Use H2/H3 headers that match common AI query patterns
3. Embed statistics and named entities from the facts
4. Include a "Key Takeaways" section with 4–6 bullet points of the most citable facts
5. Use direct, declarative sentences — no hedging language
6. Target 600–900 words
7. Format in clean markdown

Return ONLY the markdown article.`,
  });
  const article = typeof synthResult.data === 'string' ? synthResult.data : synthResult.rawOutput || '';

  return { article, facts, schema };
}

async function sendEmail(toEmail: string, topic: string, brand: string, article: string, schema: string): Promise<boolean> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) return false;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', auth: { user, pass },
    });
    const html = await buildEmailHtml(topic, brand, article, schema);
    await transporter.sendMail({
      from: `"L8EntSpace Autopilot" <${user}>`,
      to: toEmail,
      subject: `GEO Article Ready: ${topic}`,
      html,
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: 'Firebase Admin not initialised' }, { status: 500 });
  }

  const startedAt = new Date().toISOString();
  const processed: { userId: string; keyword: string; status: 'ok' | 'error'; emailed?: boolean; error?: string }[] = [];

  try {
    // Get all users who have keywords + brand configured
    const usersSnap = await dbAdmin.collection('users')
      .where('brand', '!=', '')
      .get();

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const keywords: string[] = (userData.keywords || []).filter(Boolean);
      if (!keywords.length) continue;

      // Look up the user's email from the auth_users collection if available,
      // otherwise fall back to the email field on the user doc
      const email: string = userData.email || '';

      for (const keyword of keywords) {
        // Skip if we already ran this keyword in the last 6 days (avoid duplicate runs).
        // Equality-only query avoids the composite index that orderBy would require.
        const recentRun = await dbAdmin.collection('autopilot_runs')
          .where('userId', '==', userDoc.id)
          .where('keyword', '==', keyword)
          .where('status', '==', 'complete')
          .get();

        if (!recentRun.empty) {
          const lastCreatedAt = recentRun.docs
            .map(d => d.data().createdAt as string)
            .filter(Boolean)
            .sort()
            .pop();
          if (lastCreatedAt) {
            const daysSinceLast = (Date.now() - new Date(lastCreatedAt).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLast < 6) {
              processed.push({ userId: userDoc.id, keyword, status: 'ok', error: 'skipped — ran within 6 days' });
              continue;
            }
          }
        }

        // Create a run record
        const runRef = await dbAdmin.collection('autopilot_runs').add({
          userId: userDoc.id, keyword, status: 'running',
          createdAt: new Date().toISOString(), source: 'cron',
        });

        try {
          const { article, facts, schema } = await runPipeline(userDoc.id, keyword, userData.brand || '');

          const payload = {
            userId: userDoc.id, topic: keyword, article, facts, schema,
            brand: userData.brand || '', geoScore: 0,
            timestamp: new Date().toISOString(), source: 'cron-daily',
          };

          await dbAdmin.collection('articles').add(payload);

          let emailed = false;
          if (email) {
            emailed = await sendEmail(email, keyword, userData.brand || '', article, schema);
          }

          await runRef.update({ status: 'complete', emailed, completedAt: new Date().toISOString() });
          processed.push({ userId: userDoc.id, keyword, status: 'ok', emailed });

          // Pause between keywords to stay within rate limits
          await new Promise(r => setTimeout(r, 8000));

        } catch (err: any) {
          await runRef.update({ status: 'failed', error: err.message });
          processed.push({ userId: userDoc.id, keyword, status: 'error', error: err.message });
        }
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message, processed, startedAt }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    startedAt,
    completedAt: new Date().toISOString(),
    totalProcessed: processed.filter(p => p.status === 'ok' && !p.error?.includes('skipped')).length,
    totalSkipped: processed.filter(p => p.error?.includes('skipped')).length,
    totalErrors: processed.filter(p => p.status === 'error').length,
    processed,
  });
}
