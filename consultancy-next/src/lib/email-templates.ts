/**
 * L8ENTSPACE branded email templates — pink (#ff1493) on near-black, matching
 * the website. One shared shell wraps every email so branding stays consistent.
 *
 * Ported from the legacy Vite/Express funnel (_legacy/server.ts), rebranded to
 * L8EntSpace / l8entspace.com (legacy said "Auspexi"). The founding offer is the
 * real one: the highest (Business) tier — normally $1,899/mo — for £499/month,
 * locked for the lifetime of the subscription; cancelling forfeits the rate.
 * A 7-day countdown runs across the sequence.
 */

const SITE = 'https://l8entspace.com';
const PINK = '#ff1493';

/** Minimal, safe markdown → HTML for report bodies (escapes first, then formats). */
export function mdToHtml(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc(md)
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (!t) return '';
      if (t.startsWith('### ')) return `<h3 style="font-size:16px;font-weight:700;color:#fff;margin:18px 0 6px;">${t.slice(4)}</h3>`;
      if (t.startsWith('## ')) return `<h2 style="font-size:18px;font-weight:700;color:#fff;margin:20px 0 8px;">${t.slice(3)}</h2>`;
      if (t.startsWith('# ')) return `<h1 style="font-size:20px;font-weight:700;color:#fff;margin:22px 0 8px;">${t.slice(2)}</h1>`;
      if (/^[-*]\s+/.test(t)) return `<p style="margin:4px 0 4px 16px;color:#d4d4d8;">• ${t.replace(/^[-*]\s+/, '')}</p>`;
      const withBold = t.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fafafa;">$1</strong>');
      return `<p style="margin:10px 0;color:#d4d4d8;line-height:1.6;">${withBold}</p>`;
    })
    .join('\n');
}

/** Pink CTA button. */
function cta(label: string, href: string): string {
  return `<div style="text-align:center;margin-top:32px;">
    <a href="${href}" style="display:inline-block;background-color:${PINK};color:#ffffff;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>
  </div>`;
}

/** Shared branded shell. `eyebrow` is the small line under the wordmark. */
export function brandedEmail(opts: { eyebrow: string; bodyHtml: string }): string {
  return `<div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background-color:#09090b;color:#fafafa;border-radius:12px;overflow:hidden;border:1px solid #27272a;">
  <div style="padding:32px;border-bottom:1px solid #27272a;background:linear-gradient(to right,#18181b,#09090b);">
    <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.04em;color:#ffffff;">L8<span style="color:${PINK};">EntSpace</span></h1>
    <p style="margin:8px 0 0;color:#a1a1aa;font-size:13px;">${opts.eyebrow}</p>
  </div>
  <div style="padding:32px;background-color:#09090b;">
    ${opts.bodyHtml}
  </div>
  <div style="padding:24px 32px;text-align:center;border-top:1px solid #27272a;color:#71717a;font-size:12px;line-height:1.6;">
    © ${new Date().getFullYear()} L8EntSpace. All rights reserved.<br/>
    You're receiving this because you requested a free GEO report at l8entspace.com.
    <a href="${SITE}/unsubscribe?email=__UNSUB_EMAIL__" style="color:#71717a;text-decoration:underline;">Unsubscribe</a>.
  </div>
</div>`;
}

/** Initial report email (sent immediately from /api/generate-report). */
export function reportEmail(domain: string, reportHtml: string): { subject: string; html: string } {
  const body = `
    <h2 style="margin-top:0;font-size:20px;color:#ffffff;">Your GEO Visibility Report for ${domain}</h2>
    <p style="color:#d4d4d8;line-height:1.6;">Here's your custom Generative Engine Optimization report. We analysed your domain's current AI visibility and surfaced the highest-impact opportunities to get cited by ChatGPT, Gemini, Claude, and Perplexity.</p>
    <div style="background-color:#18181b;padding:24px;border-radius:8px;margin:24px 0;border:1px solid #27272a;color:#d4d4d8;line-height:1.6;">
      ${reportHtml}
    </div>
    ${cta('View Plans', `${SITE}/#pricing`)}`;
  return {
    subject: `Your GEO Visibility Report for ${domain}`,
    html: brandedEmail({ eyebrow: 'Master brand visibility in the era of AI search', bodyHtml: body }),
  };
}

/**
 * The founding offer block, shared across the funnel with a per-email countdown.
 * Terms are exactly as set: Business tier (highest) at £499/mo, locked for the
 * life of the subscription; cancelling ends the rate.
 */
function offerBlock(countdown: string): string {
  return `<div style="background-color:#18181b;border:1px solid ${PINK};border-radius:10px;padding:20px 22px;margin:24px 0;">
    <p style="margin:0 0 6px;color:${PINK};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Founding offer · ${countdown}</p>
    <p style="margin:0;color:#d4d4d8;line-height:1.6;">Lock our highest <strong style="color:#fafafa;">Business tier</strong> (normally $1,899/mo) at <strong style="color:#fafafa;">£499/month for the lifetime of your subscription</strong>. The rate holds for as long as you stay subscribed — cancel and the founding price is gone for good.</p>
  </div>${cta('Claim your £499 founding rate', `${SITE}/#pricing`)}`;
}

/** One step in the 7-email post-report drip. */
export interface FunnelEmail {
  index: number;       // lastEmailSentIndex this email advances FROM (0-based)
  minHours: number;    // send once hoursSinceSignup >= this
  subject: string;
  build: (domain: string) => string; // full HTML
}

/**
 * 7-email sequence over 7 days, fired by the email-funnel cron. Themes match
 * the legacy funnel; copy is L8EntSpace-accurate and offer-neutral.
 */
export const FUNNEL_EMAILS: FunnelEmail[] = [
  {
    index: 0, minHours: 24,
    subject: 'Why traditional SEO is quietly failing your brand (+ a founding offer)',
    build: (domain) => brandedEmail({
      eyebrow: 'Day 1 — the AI visibility gap',
      bodyHtml: `
        <p style="color:#d4d4d8;line-height:1.6;">Hi there,</p>
        <p style="color:#d4d4d8;line-height:1.6;">Yesterday we sent your GEO Visibility Report for <strong style="color:#fafafa;">${domain}</strong>. A quick follow-up on why it matters.</p>
        <p style="color:#d4d4d8;line-height:1.6;">Traditional SEO optimises for blue links. Generative Engine Optimization optimises for <strong style="color:#fafafa;">citations inside ChatGPT, Gemini, and Claude</strong> — where a growing share of buyers now start. If you're not structured to be cited, competitors who are will fill that space.</p>
        ${offerBlock('6 days left')}`,
    }),
  },
  {
    index: 1, minHours: 48,
    subject: 'Displace competitor data inside AI — and lock £499/mo for life',
    build: (domain) => brandedEmail({
      eyebrow: 'Day 2 — the freshness advantage',
      bodyHtml: `
        <p style="color:#d4d4d8;line-height:1.6;">Hi again,</p>
        <p style="color:#d4d4d8;line-height:1.6;">AI models train on a lag, so much of what they "know" about any market is already stale. By structuring your newest facts as machine-readable JSON-LD, you feed current, citable data to AI crawlers for <strong style="color:#fafafa;">${domain}</strong>.</p>
        <p style="color:#d4d4d8;line-height:1.6;">That's what the L8EntSpace Fact Vault automates — turning your verified facts into the evidence AI engines prefer to quote.</p>
        ${offerBlock('5 days left')}`,
    }),
  },
  {
    index: 2, minHours: 72,
    subject: 'Automating your GEO strategy with Citacious',
    build: (domain) => brandedEmail({
      eyebrow: 'Day 3 — your AI analyst',
      bodyHtml: `
        <p style="color:#d4d4d8;line-height:1.6;">Hi there,</p>
        <p style="color:#d4d4d8;line-height:1.6;">Tracking your AI Share of Voice by hand doesn't scale. Citacious, the L8EntSpace analyst, reads your dashboard, learns from past results, and recommends the next actions to grow citations for <strong style="color:#fafafa;">${domain}</strong>.</p>
        <p style="color:#d4d4d8;line-height:1.6;">Pair it with Fact Vault extraction to find your highest-value data points and turn them into cite-magnets automatically.</p>
        ${offerBlock('4 days left')}`,
    }),
  },
  {
    index: 3, minHours: 96,
    subject: 'How visible are you in ChatGPT, really?',
    build: (domain) => brandedEmail({
      eyebrow: 'Day 4 — measure it',
      bodyHtml: `
        <p style="color:#d4d4d8;line-height:1.6;">Hi there,</p>
        <p style="color:#d4d4d8;line-height:1.6;">If you can't measure it, you can't improve it. The L8EntSpace SOV Simulator and Brand Monitor track how often <strong style="color:#fafafa;">${domain}</strong> is recommended across Gemini, ChatGPT, Claude, and Perplexity — versus your competitors.</p>
        <p style="color:#d4d4d8;line-height:1.6;">It's the report you can confidently put in front of stakeholders.</p>
        ${offerBlock('3 days left')}`,
    }),
  },
  {
    index: 4, minHours: 120,
    subject: 'Why you need AI to defend your brand from AI',
    build: (domain) => brandedEmail({
      eyebrow: 'Day 5 — the agent crew',
      bodyHtml: `
        <p style="color:#d4d4d8;line-height:1.6;">Hi again,</p>
        <p style="color:#d4d4d8;line-height:1.6;">Holding position in AI answers takes continuous work. The L8EntSpace multi-agent crew crawls, analyses, and refreshes your brand's facts across multiple LLMs — so <strong style="color:#fafafa;">${domain}</strong> stays current and cited without manual effort.</p>
        ${offerBlock('2 days left')}`,
    }),
  },
  {
    index: 5, minHours: 144,
    subject: '⏳ 48 hours left: your £499/mo lifetime rate',
    build: (domain) => brandedEmail({
      eyebrow: 'Day 6 — 48 hours left',
      bodyHtml: `
        <p style="color:#d4d4d8;line-height:1.6;">Hi there,</p>
        <p style="color:#d4d4d8;line-height:1.6;">A quick reminder: your founding rate for <strong style="color:#fafafa;">${domain}</strong> — the full Business tier at £499/month, locked for the life of your subscription — closes in about 48 hours.</p>
        <p style="color:#d4d4d8;line-height:1.6;">That's unlimited feature access, the Citacious analyst, Fact Vault, and the multi-agent crew, at the lowest price we'll ever offer it.</p>
        ${offerBlock('48 hours left')}`,
    }),
  },
  {
    index: 6, minHours: 168,
    subject: '🚨 Final call: your £499/mo founding rate ends today',
    build: (domain) => brandedEmail({
      eyebrow: 'Day 7 — final call',
      bodyHtml: `
        <p style="color:#d4d4d8;line-height:1.6;">Hi there,</p>
        <p style="color:#d4d4d8;line-height:1.6;">This is the last email in your GEO report series — and the last day of your founding rate for <strong style="color:#fafafa;">${domain}</strong>. After today, the Business tier returns to standard pricing.</p>
        <p style="color:#d4d4d8;line-height:1.6;">If you'd like to lock £499/month for the lifetime of your subscription, now's the moment. Questions? Just reply — a real person reads these.</p>
        ${offerBlock('Ends today')}`,
    }),
  },
];

/**
 * Cold-outreach template (pink/black, single column, conversational body).
 * `bodyHtml` is the short personalised message; keep it human and brief.
 */
export function outreachEmail(opts: { bodyHtml: string; ctaLabel?: string; ctaHref?: string }): string {
  const action = opts.ctaLabel && opts.ctaHref ? cta(opts.ctaLabel, opts.ctaHref) : '';
  return brandedEmail({
    eyebrow: 'Get cited in AI search',
    bodyHtml: `${opts.bodyHtml}${action}`,
  });
}
