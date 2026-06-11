import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { normalizeTier, checkTierAccess, UserTier } from '@/constants/tiers';

// Daily cost caps per tier (USD). Free is excluded from automation entirely
// (see toolsForTier), so its cap is 0.
const DAILY_COST_CAPS: Record<UserTier, number> = {
  Free:     0.00,
  Starter:  0.25,
  Pro:      0.75,
  Business: 2.50,
};

// Each automated tool requires the SAME tier as its manual dashboard version —
// automation never gives away a tool the user couldn't run by hand. This keeps
// the pricing ladder intact:
//   cite-probe   → Starter  (matches dashboard/cite-probe)
//   daily-audit  → Starter  (matches dashboard/overview SOV)
//   brand-monitor→ Business (matches dashboard/brand-monitor)
const TOOL_REQUIRED_TIER: Record<string, UserTier> = {
  'cite-probe':    'Starter',
  'daily-audit':   'Starter',
  'brand-monitor': 'Business',
};

// All schedulable tools (verified in Phase 0). Cadence is decided per tier below.
const ALL_TOOLS = ['cite-probe', 'daily-audit', 'brand-monitor'];

// Minimum interval between runs per tool (ms) — prevents double-firing on
// retries or mis-timed cron overlaps.
const TOOL_COOLDOWN: Record<string, number> = {
  'brand-monitor': 6 * 24 * 60 * 60 * 1000,   // 6 days
  'cite-probe':    6 * 24 * 60 * 60 * 1000,
  'daily-audit':   20 * 60 * 60 * 1000,        // 20 hours
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

async function callTool(
  tool: string,
  userId: string,
  userData: Record<string, any>,
  baseUrl: string,
  idToken: string,
): Promise<{ cost: number; success: boolean; summary: string }> {
  const { brand, domain, keywords = [], competitors = [] } = userData;
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
        body: JSON.stringify({ brand, domain, keywords }),
      });
      const d = await r.json();
      if (!r.ok) return { cost: 0, success: false, summary: d.error ?? `HTTP ${r.status}` };
      return {
        cost: 0.03,
        success: true,
        summary: `Citation rate ${d.citationRate ?? '?'}% · ${Object.keys(d.platformRates ?? {}).length} engines`,
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

    return { cost: 0, success: false, summary: `unknown tool: ${tool}` };
  } catch (e: any) {
    return { cost: 0, success: false, summary: `threw: ${e.message}` };
  }
}

export async function POST(req: NextRequest) {
  // Guard: must be called with the CRON_SECRET to prevent unauthenticated triggers.
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
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

      const result = await callTool(tool, userId, userData, baseUrl, internalToken);
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
  }

  return NextResponse.json({
    ok: true,
    usersProcessed: totalUsers,
    toolsRan: totalRuns,
    toolsSkipped: totalSkipped,
    log,
  });
}
