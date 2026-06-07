#!/usr/bin/env node
/**
 * GEO Lab — Finding Publisher
 *
 * Closes the loop: pushes a completed experiment's verdict into the consultancy
 * dashboard so it can surface evidence-backed content recommendations to users.
 *
 * Reads:  <experiment-dir>/finding.json  (written by analyze.mjs)
 *         experiments/backlog.json        (for lever / title / hypothesis)
 * Posts:  ${DASHBOARD_URL}/api/geo-findings  (Bearer ${GEO_FINDINGS_SECRET})
 *
 * Non-fatal by design: if the dashboard URL or secret isn't configured, it logs
 * and exits 0 so it never breaks the orchestrator's analyze phase.
 *
 * Usage:
 *   node publish-finding.mjs <experiment-dir>
 *
 * Env: DASHBOARD_URL, GEO_FINDINGS_SECRET
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import nodemailer from 'nodemailer';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');
config({ path: path.join(__dir, '.env') });

const experimentDir = process.argv[2];
if (!experimentDir) {
  console.error('Usage: node publish-finding.mjs <experiment-dir>');
  process.exit(1);
}

// Human guidance per lever. The lab owns the semantics of each experiment, so
// the actionable recommendation is authored here and the empirical result is
// attached from finding.json at publish time. Levers absent from this map fall
// back to a hypothesis-derived recommendation.
const LEVER_GUIDANCE = {
  'statistical-anchors':       { headline: 'Lead with a specific statistic',          guidance: 'Open with a precise, citable number (e.g. "cut latency 43%") rather than vague language. LLMs weight concrete data points as credibility signals.', appliesTo: ['opening', 'claims'] },
  'inverted-pyramid':          { headline: 'Front-load the answer',                    guidance: 'Put the citable conclusion in sentence 1, not paragraph 3. Models favour content that states the answer first.', appliesTo: ['structure', 'opening'] },
  'definition-sentences':      { headline: 'Use definitional structure',               guidance: 'Phrase key facts as "X is a Y that does Z". Definitions are citation magnets for "what is X" queries.', appliesTo: ['structure', 'claims'] },
  'entity-density':            { headline: 'Increase entity density',                  guidance: 'Name 3+ concrete entities (products, people, standards, orgs) per 100 words. Dense, graspable content is easier for retrieval systems to attribute.', appliesTo: ['body', 'entities'] },
  'list-vs-prose':             { headline: 'Present facts as lists',                   guidance: 'Use bulleted lists for discrete facts. List items are copy-pasteable and easier for LLMs to extract and cite than equivalent prose.', appliesTo: ['structure', 'formatting'] },
  'quotability':               { headline: 'Write short, quotable sentences',          guidance: 'Prefer short, punchy sentences over long compound ones. Quotable units are lifted into AI answers more readily.', appliesTo: ['style'] },
  'freshness-signals':         { headline: 'Add explicit freshness signals',           guidance: 'Include current dates and "updated" markers. Recency cues raise citation likelihood for time-sensitive queries.', appliesTo: ['metadata', 'body'] },
  'source-framing':            { headline: 'Frame claims as third-party verifiable',   guidance: 'Present facts in a third-party, verifiable voice rather than first-person marketing. Models trust attributable framing.', appliesTo: ['style', 'claims'] },
  'contradiction-handling':    { headline: 'Address contradictions head-on',           guidance: 'Acknowledge and resolve competing claims explicitly. Models prefer content that disambiguates.', appliesTo: ['body'] },
  'brand-frequency':           { headline: 'Tune brand-name frequency',                guidance: 'Repeat the brand name at a natural cadence near key facts so the entity binds to the citable claim — without keyword stuffing.', appliesTo: ['entities', 'body'] },
  'active-voice':              { headline: 'Use active voice',                         guidance: 'Active constructions ("Auspexi reduces…") are cited more than passive ("…is reduced by Auspexi").', appliesTo: ['style'] },
  'anchor-stacking':           { headline: 'Stack multiple GEO levers',                guidance: 'Combine statistical anchors, definitions and front-loading in one passage for compounding citation gains.', appliesTo: ['structure', 'body'] },
  'heading-structure':         { headline: 'Use clear heading hierarchy',              guidance: 'Structure content with descriptive H2/H3 headings. Clear hierarchy helps models locate and attribute the relevant section.', appliesTo: ['structure', 'formatting'] },
  'claim-specificity':         { headline: 'Make claims specific',                     guidance: 'Replace generic claims with specific, bounded ones. Specificity is a credibility and citability signal.', appliesTo: ['claims'] },
  'opening-structure':         { headline: 'Open with a statement, not a question',    guidance: 'Lead with a declarative answer rather than a rhetorical question. (Experiment found the statement opening performs better.)', appliesTo: ['opening'] },
  'json-ld':                   { headline: 'Ship JSON-LD schema',                      guidance: 'Embed structured JSON-LD on the page. Schema presence improves how reliably engines parse and cite the content.', appliesTo: ['technical', 'metadata'] },
  'anchor-length-interaction': { headline: 'Pair statistics with shorter content',     guidance: 'Statistical anchors pay off most in shorter content; in long pages the effect dilutes. Keep anchored pieces tight.', appliesTo: ['structure', 'claims'] },
  'live-parametric':           { headline: 'Publish early for parametric uptake',      guidance: 'Get content indexed well ahead of need — parametric (training-weight) citation requires lead time, unlike in-context retrieval.', appliesTo: ['strategy'] },
};

async function readJsonSafe(p) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); }
  catch { return null; }
}

const finding = await readJsonSafe(path.join(experimentDir, 'finding.json'));
if (!finding) {
  console.error('No finding.json found — run analyze.mjs first. Skipping publish.');
  process.exit(0);
}

// Resolve the backlog entry from the experiment directory id (e.g. "001-...").
const expId = path.basename(experimentDir).split('-')[0];
const backlog = await readJsonSafe(path.join(ROOT, 'experiments', 'backlog.json'));
const entry = backlog?.experiments?.find(e => e.id === expId) || {};
const lever = entry.lever || path.basename(experimentDir).replace(/^\d+-/, '');

const guide = LEVER_GUIDANCE[lever];
const isNull = finding.verdict === 'null';

const recommendation = guide
  ? guide.guidance
  : `Experiment "${entry.title || lever}" tested: ${finding.hypothesis}`;
const headline = guide?.headline || entry.title || lever;

const payload = {
  id: expId,
  lever,
  slug: entry.slug || path.basename(experimentDir).replace(/^\d+-/, ''),
  title: entry.title || lever,
  hypothesis: finding.hypothesis,
  verdict: finding.verdict,                  // 'significant' | 'null'
  headline,
  recommendation,
  appliesTo: guide?.appliesTo || [],
  bestVariant: finding.bestVariant,
  topEffect: finding.topEffect,              // { platform, treatment, diffPp, pValue } | null
  significant: finding.significant,
  aggregate: finding.aggregate,
  platforms: finding.platforms,
  trialsPerVariant: finding.trialsPerVariant,
  runAt: finding.runAt,
  // Only significant findings become active recommendations; null results are
  // stored for transparency but won't be surfaced as advice.
  active: !isNull,
};

// S6.4: one-line digest email when a SIGNIFICANT finding is published.
// Reuses the same Gmail transport as send-report.mjs. Non-fatal by design.
async function sendDigestEmail() {
  if (isNull) return; // only significant findings warrant a digest
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  const toEmail = process.env.REPORT_EMAIL || user;
  if (!user || !pass) {
    console.log('EMAIL_USER / EMAIL_APP_PASSWORD not set — skipping digest email (non-fatal).');
    return;
  }
  const eff = finding.topEffect;
  const effLine = eff
    ? `${eff.diffPp > 0 ? '+' : ''}${eff.diffPp.toFixed(1)}pp on ${eff.platform} (p=${eff.pValue.toFixed(3)})`
    : 'significant effect detected';
  try {
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
    await transporter.sendMail({
      from: `"GEO Lab" <${user}>`,
      to: toEmail,
      subject: `New GEO Lab result: ${headline}`,
      text: `New significant GEO Lab finding.\n\n${headline}\nEffect: ${effLine}\nLever: ${lever}\n\nRecommendation: ${recommendation}\n\nSee the dashboard GEO Lab page for full details.`,
    });
    console.log(`Digest email sent to ${toEmail}.`);
  } catch (err) {
    console.error('Digest email error (non-fatal):', err.message);
  }
}

const dashboardUrl = process.env.DASHBOARD_URL;
const secret = process.env.GEO_FINDINGS_SECRET;

if (!dashboardUrl || !secret) {
  console.log('DASHBOARD_URL / GEO_FINDINGS_SECRET not set — skipping dashboard publish (non-fatal).');
  console.log('Would have published:', JSON.stringify({ lever, verdict: finding.verdict, headline }, null, 2));
  await sendDigestEmail(); // digest can still go out even without the dashboard
  process.exit(0);
}

try {
  const res = await fetch(`${dashboardUrl.replace(/\/$/, '')}/api/geo-findings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Publish failed (${res.status}): ${text}`);
    await sendDigestEmail();
    process.exit(0); // non-fatal — don't break the pipeline
  }
  console.log(`Published finding for lever "${lever}" (${finding.verdict}) → dashboard.`);
} catch (err) {
  console.error('Publish error (non-fatal):', err.message);
}

await sendDigestEmail();
