/**
 * Daily Perplexity spend guard.
 *
 * Sums today's Perplexity cost from the `cost_audit` collection and compares it
 * to a configurable cap (PERPLEXITY_DAILY_USD_CAP, default $5/day). Probe routes
 * call `perplexityBudget()` after auth and hard-stop (HTTP 429) when over, so a
 * runaway loop or abuse can't quietly drain the account between billing checks.
 *
 * Relies on complete cost logging (the orchestrator now records Perplexity calls,
 * and the probe routes log their own cost), so the daily sum reflects real spend.
 */

export const PERPLEXITY_DAILY_USD_CAP = Number(process.env.PERPLEXITY_DAILY_USD_CAP || '5');

/** Pure predicate, unit-testable. */
export function isOverCap(spentTodayUsd: number, cap: number = PERPLEXITY_DAILY_USD_CAP): boolean {
  return cap > 0 && spentTodayUsd >= cap;
}

/** A cost_audit row may store the figure under any of these keys. */
function rowCostUsd(d: any): number {
  return Number(d?.totalCostUsd ?? d?.estimatedCostUsd ?? d?.cost ?? 0) || 0;
}

/**
 * Returns today's Perplexity spend and whether the cap is exceeded. Fail-open:
 * if the DB is unavailable or the query errors, returns over=false so a logging
 * problem never blocks legitimate probes.
 */
export async function perplexityBudget(dbAdmin: any): Promise<{ over: boolean; spentToday: number; cap: number }> {
  const cap = PERPLEXITY_DAILY_USD_CAP;
  try {
    if (!dbAdmin) return { over: false, spentToday: 0, cap };
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    // Single-field range query (no composite index needed); filter provider in code.
    const snap = await dbAdmin
      .collection('cost_audit')
      .where('timestamp', '>=', dayStart.toISOString())
      .limit(5000)
      .get();
    const spentToday = snap.docs
      .map((doc: any) => doc.data())
      .filter((d: any) => d.provider === 'perplexity')
      .reduce((sum: number, d: any) => sum + rowCostUsd(d), 0);
    return { over: isOverCap(spentToday, cap), spentToday, cap };
  } catch {
    return { over: false, spentToday: 0, cap };
  }
}
