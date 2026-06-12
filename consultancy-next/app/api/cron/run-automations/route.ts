import { NextRequest, NextResponse } from 'next/server';
import admin, { dbAdmin } from '@/lib/firebase-admin';
import { normalizeTier, checkTierAccess, UserTier } from '@/constants/tiers';
import nodemailer from 'nodemailer';

// Daily cost caps per tier (USD). Free is excluded from automation entirely
// (see toolsForTier), so its cap is 0.
// Costs are real: cite-probe ~$0.17/pass, brand-monitor ~$0.025.
const DAILY_COST_CAPS: Record<UserTier, number> = {
  Free:     0.00,
  Starter:  0.25,  // 1 cite-probe pass (brand only) + brand-monitor
  Pro:      0.75,  // brand + 2 competitor passes
  Business: 2.75,  // brand + up to 14 competitor passes
};

// Max competitors to probe in automated runs per tier.
// Keeps each automated cite-probe within the daily cost cap:
//   Starter: 0 extras → ~$0.17/run
//   Pro: 2 extras → ~$0.50/run
//   Business: 14 extras → ~$2.49/run
const AUTO_MAX_COMPETITORS: Record<UserTier, number> = {
  Free:     0,
  Starter:  0,
  Pro:      2,
  Business: 14,
};

// Each automated tool requires the SAME tier as its manual dashboard version —
// automation never gives away a tool the user couldn't run by hand. This keeps
// the pricing ladder intact:
//   cite-probe   → Starter  (matches dashboard/cite-probe)
//   daily-audit  → Starter  (matches dashboard/overview SOV)
//   brand-monitor→ Pro      (matches dashboard/brand-monitor)
//   indexnow-sync→ Starter  (matches dashboard/geo-health; free — no LLM calls)
const TOOL_REQUIRED_TIER: Record<string, UserTier> = {
  'cite-probe':    'Starter',
  'daily-audit':   'Starter',
  'brand-monitor': 'Pro',
  'indexnow-sync': 'Starter',
};

// All schedulable tools (verified in Phase 0). Cadence is decided per tier below.
const ALL_TOOLS = ['cite-probe', 'daily-audit', 'brand-monitor', 'indexnow-sync'];

// Minimum interval between runs per tool (ms) — prevents double-firing on
// retries or mis-timed cron overlaps.
const TOOL_COOLDOWN: Record<string, number> = {
  'brand-monitor': 6 * 24 * 60 * 60 * 1000,   // 6 days
  'cite-probe':    6 * 24 * 60 * 60 * 1000,
  'daily-audit':   20 * 60 * 60 * 1000,        // 20 hours
  'indexnow-sync': 20 * 60 * 60 * 1000,        // daily — pushes only NEW sitemap URLs
};

// Returns the tools a user's tier is ENTITLED to automate. Free → none.
// Cadence (how often) is enforced separately via TOOL_COOLDOWN: Starter gets a
// weekly cooldown, Pro/Business get the shorter (daily) cooldown.
function toolsForTier(tier: UserTier): string[] {
  if (tier === 'Free') return []; // Free has no automation — it's a paid accelerator.
  return ALL_TOOLS.filter(tool => checkTierAccess(tier, TOOL_REQUIRED_TIER[tool]));
}

// Starter runs weekly; Pro/Business run daily. We implement this by lengthening
// the cooldown for Starter so a daily cron only actually fires weekly for them.
function cooldownFor(tool: string, tier: UserTier): number {
  const base = TOOL_COOLDOWN[tool] ?? 0;
  if (tier === 'Starter') return Math.max(base, 6 * 24 * 60 * 60 * 1000); // weekly floor
  return base;
}

function isOnCooldown(lastRun: string | undefined, toolName: string, tier: UserTier): boolean {
  if (!lastRun) return false;
  const elapsed = Date.now() - new Date(lastRun).getTime();
  return elapsed < cooldownFor(toolName, tier);
}

// Check whether daily-audit output has moved off the synthetic floor.
// The floor is every platform at 5-15% — if all values are in that band we
// consider it floor data and skip the automated run.
async function auditHasRealData(userId: string): Promise<boolean> {
  if (!dbAdmin) return false;
  try {
    const snap = await dbAdmin
      .collection('sovMetrics')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return false;
    const platforms = snap.docs[0].data()?.platforms as Record<string, number> | undefined;
    if (!platforms) return false;
    const vals = Object.values(platforms).filter(v => typeof v === 'number');
    if (vals.length === 0) return false;
    // If ALL values are in the 5-15% synthetic floor band, it's not real data.
    return !vals.every(v => v >= 5 && v <= 15);
  } catch { return false; }
}

// Closes the publish → Bing loop with zero user action: diff the user's
// sitemap.xml against the URLs we've already seen, and push only the new ones
// to IndexNow via /api/bing-index. The first run records a baseline without
// pushing (avoids blasting an entire back-catalogue and 403s on sites that
// haven't hosted their key file yet).
async function syncSitemapToIndexNow(
  userId: string,
  domain: string,
  baseUrl: string,
  headers: Record<string, string>,
): Promise<{ cost: number; success: boolean; summary: string }> {
  if (!dbAdmin) return { cost: 0, success: false, summary: 'DB unavailable' };
  const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  let xml: string;
  try {
    const res = await fetch(`https://${host}/sitemap.xml`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return { cost: 0, success: false, summary: `sitemap.xml HTTP ${res.status} — skipped` };
    xml = await res.text();
  } catch (e: any) {
    return { cost: 0, success: false, summary: `sitemap fetch failed: ${e.message}` };
  }

  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]);
  if (locs.length === 0) return { cost: 0, success: false, summary: 'sitemap has no <loc> entries' };

  const seenRef = dbAdmin.collection('indexnow_seen').doc(userId);
  const seenSnap = await seenRef.get();
  const seen: string[] = seenSnap.data()?.urls ?? [];
  const seenSet = new Set(seen);
  const newUrls = locs.filter(u => !seenSet.has(u));

  // Persist the union (capped — Firestore doc limit) regardless of push outcome.
  const union = [...new Set([...seen, ...locs])].slice(-5000);
  await seenRef.set({ urls: union, lastSyncAt: new Date().toISOString(), domain: host }, { merge: true });

  if (!seenSnap.exists) {
    return { cost: 0, success: true, summary: `baseline recorded — ${locs.length} URLs; new pages will auto-push from next run` };
  }
  if (newUrls.length === 0) {
    return { cost: 0, success: true, summary: 'sitemap unchanged — nothing to push' };
  }

  const r = await fetch(`${baseUrl}/api/bing-index`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ domain: host, urls: newUrls.slice(0, 100) }),
  });
  const d = await r.json();
  if (!r.ok || !d.success) {
    return { cost: 0, success: false, summary: `IndexNow push failed: ${d.error ?? d.message ?? `HTTP ${r.status}`}` };
  }
  return { cost: 0, success: true, summary: `${newUrls.length} new URL${newUrls.length > 1 ? 's' : ''} pushed to Bing via IndexNow` };
}

async function callTool(
  tool: string,
  userId: string,
  userData: Record<string, any>,
  baseUrl: string,
  idToken: string,
  tier: UserTier,
): Promise<{ cost: number; success: boolean; summary: string }> {
  const { brand, domain, keywords = [], competitors: primaryComps = [], watchlistCompetitors: watchlistComps = [] } = userData;
  // Merge primary + watchlist; clamp to per-tier automation cap to stay within daily cost budget.
  const allCompetitors = [...new Set([...primaryComps, ...watchlistComps].filter(Boolean))];
  const competitors = allCompetitors.slice(0, AUTO_MAX_COMPETITORS[tier]);
  if (!brand || !domain) return { cost: 0, success: false, summary: 'no brand/domain configured' };

  const headers = {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
    'X-Automation-Run': '1', // signals this is a scheduled call, not a user click
  };

  try {
    if (tool === 'brand-monitor') {
      const r = await fetch(`${baseUrl}/api/brand-monitor`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ brand }),
      });
      const d = await r.json();
      if (!r.ok) return { cost: 0, success: false, summary: d.error ?? `HTTP ${r.status}` };
      return {
        cost: 0.02,
        success: true,
        summary: `Risk score ${d.riskScore ?? '?'}/100 · sentiment: ${d.overallSentiment ?? '?'} · ${d.threads?.length ?? 0} threads analysed`,
      };
    }

    if (tool === 'cite-probe') {
      const r = await fetch(`${baseUrl}/api/cite-probe`, {
        method: 'POST',
        headers,
        // Include saved competitors so the automated probe also refreshes the
        // Overview head-to-head card with zero user interaction. The route
        // applies the per-tier cap (20 / 50 for Business) server-side.
        body: JSON.stringify({ brand, domain, keywords, competitors }),
      });
      const d = await r.json();
      if (!r.ok) return { cost: 0, success: false, summary: d.error ?? `HTTP ${r.status}` };
      // Real cost: ~$0.166 per pass (brand + each competitor).
      const passes = 1 + (d.competitors?.length ?? 0);
      return {
        cost: parseFloat((passes * 0.166).toFixed(3)),
        success: true,
        summary: `Citation rate ${d.citationRate ?? '?'}% · ${Object.keys(d.platformRates ?? {}).length} engines · ${passes} passes`,
      };
    }

    if (tool === 'daily-audit') {
      if (keywords.length === 0) return { cost: 0, success: false, summary: 'no keywords configured — skipped' };
      const r = await fetch(`${baseUrl}/api/run-daily-audit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ brand, domain, keywords, competitors }),
      });
      const d = await r.json();
      if (!r.ok) return { cost: 0, success: false, summary: d.error ?? `HTTP ${r.status}` };
      const aSov = d.metrics?.aSov;
      return {
        cost: 0.05,
        success: true,
        summary: `Share of voice ${aSov ?? '?'}% · platforms: ${JSON.stringify(d.metrics?.platforms ?? {})}`,
      };
    }

    if (tool === 'indexnow-sync') {
      return await syncSitemapToIndexNow(userId, domain, baseUrl, headers);
    }

    return { cost: 0, success: false, summary: `unknown tool: ${tool}` };
  } catch (e: any) {
    return { cost: 0, success: false, summary: `threw: ${e.message}` };
  }
}

// Automation Phase 2 #6: digest email after a run that actually executed tools.
// Starter's weekly cooldown makes this naturally weekly; Pro/Business get it on
// run days. Users opt out with automation.emailDigest === false.
const TOOL_LABELS: Record<string, string> = {
  'cite-probe': 'Citation Probe',
  'daily-audit': 'Daily SOV Audit',
  'brand-monitor': 'Brand Monitor',
  'indexnow-sync': 'Bing IndexNow Sync',
};

async function sendDigestEmail(
  userId: string,
  brand: string,
  runResults: Record<string, { success: boolean; summary: string; ranAt: string }>,
): Promise<boolean> {
  const ran = Object.entries(runResults);
  if (ran.length === 0) return false;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailPass) return false;

  let to: string | null = null;
  try {
    to = (await admin.auth().getUser(userId)).email || null;
  } catch {
    const snap = await dbAdmin?.collection('users').doc(userId).get();
    to = snap?.data()?.email || null;
  }
  if (!to) return false;

  // Headline metrics: latest citation rate, delta vs previous probe, and
  // content gaps (uncited queries with no vault fact within cosine 0.5 —
  // geometry logged by the cite-probe route). All non-fatal: a digest with
  // just the run table is still worth sending.
  let highlightsHtml = '';
  try {
    const probesSnap = await dbAdmin!
      .collection('citation_tests')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(2)
      .get();
    if (!probesSnap.empty) {
      const latest = probesSnap.docs[0].data();
      const prev = probesSnap.docs[1]?.data();
      const rate = typeof latest.citationRate === 'number' ? Math.round(latest.citationRate) : null;
      const delta = rate !== null && typeof prev?.citationRate === 'number'
        ? rate - Math.round(prev.citationRate)
        : null;
      const results: { query: string; cited: boolean; minFactDistance?: number | null }[] = latest.results ?? [];
      const gaps = results.filter(r => !r.cited && typeof r.minFactDistance === 'number' && r.minFactDistance > 0.5);
      const closed = prev
        ? (latest.results ?? []).filter((r: any) =>
            r.cited && (prev.results ?? []).some((p: any) => p.query === r.query && !p.cited)
          )
        : [];

      const deltaBadge = delta === null ? '' : delta === 0
        ? `<span style="color:#a1a1aa;font-size:14px;font-weight:600;"> · unchanged</span>`
        : `<span style="color:${delta > 0 ? '#4ade80' : '#f87171'};font-size:14px;font-weight:700;"> ${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}pp since last probe</span>`;

      const gapRows = gaps.slice(0, 3).map(g =>
        `<li style="margin:4px 0;color:#a1a1aa;font-size:13px;">"${g.query}" — <span style="color:#c4b5fd;">no content nearby; write a dedicated answer</span></li>`
      ).join('');

      const closedRows = closed.slice(0, 3).map((c: any) =>
        `<li style="margin:4px 0;color:#4ade80;font-size:13px;">✓ "${c.query}" flipped to cited</li>`
      ).join('');

      highlightsHtml = `
  <div style="padding:24px 32px;border-bottom:1px solid #27272a;">
    ${rate !== null ? `<p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;">Citation rate</p>
    <p style="margin:0;font-size:32px;font-weight:800;color:#fff;">${rate}%${deltaBadge}</p>` : ''}
    ${closedRows ? `<p style="margin:16px 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;">Wins since last probe</p><ul style="margin:0;padding-left:18px;">${closedRows}</ul>` : ''}
    ${gapRows ? `<p style="margin:16px 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;">Content gaps to close (${gaps.length})</p><ul style="margin:0;padding-left:18px;">${gapRows}</ul>
    <p style="margin:10px 0 0;font-size:12px;color:#71717a;">Each gap is a query AI engines answer without you. <a href="https://l8entspace.com/dashboard/cite-probe" style="color:#c4b5fd;">Open the gap list →</a></p>` : ''}
  </div>`;
    }
  } catch (e) {
    console.warn('[run-automations] digest highlights failed (non-fatal):', e);
  }

  const rows = ran.map(([tool, r]) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-weight:600;font-size:13px;">${TOOL_LABELS[tool] ?? tool}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #27272a;font-size:13px;color:${r.success ? '#4ade80' : '#f87171'};">${r.success ? '✓' : '✗'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:13px;">${r.summary}</td>
    </tr>`).join('');

  const html = `
<div style="font-family:'Inter',sans-serif;max-width:680px;margin:0 auto;background:#09090b;color:#fafafa;border-radius:8px;overflow:hidden;border:1px solid #27272a;">
  <div style="padding:28px 32px;border-bottom:1px solid #27272a;background:linear-gradient(to right,#18181b,#09090b);">
    <p style="margin:0;font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.1em;">L8EntSpace · GEO Autopilot</p>
    <h1 style="margin:8px 0 4px;font-size:20px;font-weight:700;color:#fff;">Your automated GEO run for ${brand}</h1>
    <p style="margin:0;font-size:13px;color:#71717a;">${new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}</p>
  </div>
  ${highlightsHtml}
  <div style="padding:24px 32px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <th style="text-align:left;padding:8px 12px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Tool</th>
        <th style="text-align:left;padding:8px 12px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;"></th>
        <th style="text-align:left;padding:8px 12px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Result</th>
      </tr>
      ${rows}
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#a1a1aa;">Full details in your <a href="https://l8entspace.com/dashboard/autopilot" style="color:#22d3ee;">Autopilot dashboard</a>. To change schedule or unsubscribe from these digests, visit Settings → Automation.</p>
  </div>
  <div style="padding:20px 32px;text-align:center;border-top:1px solid #27272a;color:#52525b;font-size:11px;">© ${new Date().getFullYear()} L8EntSpace. All rights reserved.</div>
</div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
    });
    await transporter.sendMail({
      from: `"L8EntSpace Autopilot" <${emailUser}>`,
      to,
      subject: `GEO Autopilot ran ${ran.length} tool${ran.length > 1 ? 's' : ''} for ${brand}`,
      html,
    });
    return true;
  } catch (e) {
    console.error('[run-automations] digest email failed:', e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Guard: must be called with the CRON_SECRET to prevent unauthenticated triggers.
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  const { secretsMatch } = await import('@/lib/api-auth');
  if (!secretsMatch(secret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: 'DB not available' }, { status: 503 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://l8entspace.com';

  // Fetch all users with a brand configured.
  const usersSnap = await dbAdmin.collection('users').where('brand', '!=', '').get();
  const log: Array<{ userId: string; tool: string; result: string }> = [];
  let totalUsers = 0, totalRuns = 0, totalSkipped = 0;

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const userId = userDoc.id;
    const tier = normalizeTier(userData.tier) as UserTier;
    const automation = userData.automation ?? {};

    // Respect explicit opt-out (default is opted-in).
    if (automation.enabled === false) continue;

    // Tier entitlement: Free has no automation; each tool requires its manual tier.
    const tools = toolsForTier(tier);
    if (tools.length === 0) continue; // nothing this tier may automate

    totalUsers++;
    const dailyCap = DAILY_COST_CAPS[tier];
    let spentToday = automation.spentToday ?? 0;

    // Reset daily spend counter if it's a new day.
    const lastResetDate = automation.lastSpendReset
      ? new Date(automation.lastSpendReset).toDateString()
      : null;
    if (lastResetDate !== new Date().toDateString()) {
      spentToday = 0;
    }

    const lastRuns: Record<string, string> = automation.lastRuns ?? {};
    const runResults: Record<string, { success: boolean; summary: string; ranAt: string }> = {};
    let sessionCost = 0;

    // We need a service-account ID token to call the API routes on behalf of
    // the automation system. We pass a synthetic bearer token that the routes
    // will accept via the admin SDK path.
    // For the cron context we use the userId directly; requireAuth in each route
    // validates the token — for cron calls we use the internal token from the
    // service account signed by firebase-admin.
    // Routes called with X-Automation-Run: 1 + valid CRON_SECRET are trusted.
    // We pass userId as the token for internal calls — the routes check
    // X-Automation-Run and skip Firebase token verification when the cron header
    // is present (patched in requireAuth below).
    const internalToken = `automation:${userId}`;

    for (const tool of tools) {
      // Respect per-tool toggles.
      if (automation.tools?.[tool] === false) {
        log.push({ userId, tool, result: 'disabled by user' });
        totalSkipped++;
        continue;
      }

      // Cooldown check.
      if (isOnCooldown(lastRuns[tool], tool, tier)) {
        log.push({ userId, tool, result: 'on cooldown' });
        totalSkipped++;
        continue;
      }

      // Daily Audit: only run if SOV data has moved off the floor.
      if (tool === 'daily-audit') {
        const hasReal = await auditHasRealData(userId);
        if (!hasReal) {
          log.push({ userId, tool, result: 'skipped — SOV floor data (no real web presence yet)' });
          totalSkipped++;
          continue;
        }
      }

      // Cost cap check.
      if (spentToday + sessionCost >= dailyCap) {
        log.push({ userId, tool, result: `cost cap reached ($${dailyCap}/day for ${tier})` });
        totalSkipped++;
        continue;
      }

      const result = await callTool(tool, userId, userData, baseUrl, internalToken, tier);
      const ranAt = new Date().toISOString();

      runResults[tool] = { ...result, ranAt };
      log.push({ userId, tool, result: `${result.success ? '✓' : '✗'} ${result.summary}` });

      if (result.success) {
        sessionCost += result.cost;
        lastRuns[tool] = ranAt;
        totalRuns++;
      }
    }

    // Write automation state back to the user doc.
    const newSpent = spentToday + sessionCost;
    await userDoc.ref.update({
      'automation.lastRuns': lastRuns,
      'automation.spentToday': newSpent,
      'automation.lastSpendReset': new Date().toDateString(),
      'automation.lastRunAt': new Date().toISOString(),
      'automation.lastResults': runResults,
    });

    // Digest email — only if something actually ran and the user hasn't opted out.
    if (Object.keys(runResults).length > 0 && automation.emailDigest !== false) {
      await sendDigestEmail(userId, userData.brand, runResults);
    }
  }

  return NextResponse.json({
    ok: true,
    usersProcessed: totalUsers,
    toolsRan: totalRuns,
    toolsSkipped: totalSkipped,
    log,
  });
}
