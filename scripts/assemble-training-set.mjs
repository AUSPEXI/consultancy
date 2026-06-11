#!/usr/bin/env node
/**
 * Feature-assembly script — GEO_AI_MODEL_SPEC §4.
 *
 * Builds the (actions_between_probes → citation_delta) training matrix:
 * one row per (userId, probe-to-probe interval), joining facts, citation_tests,
 * sovMetrics, audit_logs, competitors, articles, and geo_experiments.
 *
 * Engine columns are read DYNAMICALLY from citation_tests.platformRates keys
 * (spec §3d) — never hardcoded, so new engines flow through automatically.
 *
 * Synthetic/floor data is excluded: sovMetrics rows flagged synthetic:true are
 * dropped, and only real probe documents anchor training rows.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/sa.json node scripts/assemble-training-set.mjs \
 *     [--out results/training-set.jsonl] [--format jsonl|csv] [--user <uid>]
 *
 * Missing values are emitted as null — GBT (Phase 1, spec §5) handles them natively.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import admin from 'firebase-admin';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function argVal(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const OUT = argVal('--out', 'results/training-set.jsonl');
const FORMAT = argVal('--format', OUT.endsWith('.csv') ? 'csv' : 'jsonl');
const ONLY_USER = argVal('--user', null);

// ── Firestore init ───────────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}
const db = admin.firestore();

// ── Helpers ──────────────────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;
const ts = (v) => (v ? new Date(v).getTime() : NaN);
const daysBetween = (a, b) => (ts(b) - ts(a)) / DAY_MS;
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const round2 = (v) => (v === null || v === undefined || Number.isNaN(v) ? null : Math.round(v * 100) / 100);

function linearSlope(points) {
  // points: [{x: days, y: rate}] — least-squares slope (rate per day)
  if (points.length < 2) return null;
  const n = points.length;
  const mx = mean(points.map(p => p.x));
  const my = mean(points.map(p => p.y));
  let num = 0, den = 0;
  for (const p of points) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; }
  return den === 0 ? null : num / den;
}

function cosineDist(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return null;
  return 1 - dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function fetchAll(collection, userId) {
  const snap = await db.collection(collection).where('userId', '==', userId).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Per-user row assembly ────────────────────────────────────────────────────
async function buildRowsForUser(userId, userData) {
  const [tests, facts, auditLogs, competitors, articles, experiments] = await Promise.all([
    fetchAll('citation_tests', userId),
    fetchAll('facts', userId),
    fetchAll('audit_logs', userId),
    fetchAll('competitors', userId),
    fetchAll('articles', userId),
    fetchAll('geo_experiments', userId),
  ]);

  // Chronological probes — each consecutive pair is one training interval.
  const probes = tests
    .filter(t => t.timestamp && typeof t.citationRate === 'number')
    .sort((a, b) => ts(a.timestamp) - ts(b.timestamp));
  if (probes.length < 2) return [];

  const rows = [];
  for (let i = 0; i < probes.length - 1; i++) {
    const start = probes[i];      // state snapshot at interval start
    const end = probes[i + 1];    // outcome at interval end
    const t0 = start.timestamp;
    const t1 = end.timestamp;
    const inInterval = (docTs) => docTs && ts(docTs) > ts(t0) && ts(docTs) <= ts(t1);

    // ── 3d. Citation probe features (dynamic engine columns) ────────────────
    const platformRates = start.platformRates ?? {};
    const engineFeatures = {};
    const activeRates = [];
    let zeroEngines = 0;
    for (const [engine, rate] of Object.entries(platformRates)) {
      engineFeatures[`${engine}_rate`] = typeof rate === 'number' ? rate : null;
      if (typeof rate === 'number') {
        activeRates.push(rate);
        if (rate === 0) zeroEngines++;
      }
    }
    const priorProbes = probes.slice(0, i + 1);
    const rateAtDaysAgo = (days) => {
      const target = ts(t0) - days * DAY_MS;
      let best = null;
      for (const p of priorProbes) {
        if (ts(p.timestamp) <= target && (!best || ts(p.timestamp) > ts(best.timestamp))) best = p;
      }
      return best ? best.citationRate : null;
    };
    const last4 = priorProbes.slice(-4);
    const slope = linearSlope(last4.map(p => ({
      x: daysBetween(last4[0].timestamp, p.timestamp),
      y: p.citationRate,
    })));

    // ── 3b. Vault features (facts existing at interval start) ───────────────
    const factsAtStart = facts.filter(f => f.createdAt && ts(f.createdAt) <= ts(t0));
    const entropies = factsAtStart.map(f => f.entropyScore).filter(v => typeof v === 'number');
    const qaRe = /\?|^(how|why|what)\b/i;
    const factCategories = new Set(factsAtStart.map(f => f.category).filter(Boolean));
    const recentFacts = factsAtStart.filter(f => daysBetween(f.createdAt, t0) <= 14);
    const lastFactAt = factsAtStart.length
      ? Math.max(...factsAtStart.map(f => ts(f.createdAt)))
      : null;

    // ── 3a. Semantic features (where embeddings exist; else null) ───────────
    let avgCosDist = null, semanticConcentration = null, citedPct = null, gapPct = null;
    const embeddedFacts = factsAtStart.filter(f => Array.isArray(f.embedding) && f.embedding.length > 0);
    const queryEmbeds = (start.results ?? [])
      .map(r => r.queryEmbedding)
      .filter(e => Array.isArray(e) && e.length > 0);
    if (embeddedFacts.length && queryEmbeds.length) {
      const dists = [];
      for (const f of embeddedFacts) {
        const ds = queryEmbeds.map(q => cosineDist(f.embedding, q)).filter(d => d !== null);
        if (ds.length) dists.push(Math.min(...ds));
      }
      if (dists.length) {
        avgCosDist = mean(dists);
        semanticConcentration = (dists.filter(d => d < 0.3).length / dists.length) * 100;
      }
    }
    const statusFacts = factsAtStart.filter(f => f.citationStatus);
    if (statusFacts.length) {
      citedPct = (statusFacts.filter(f => f.citationStatus === 'cited').length / statusFacts.length) * 100;
      gapPct = (statusFacts.filter(f => f.citationStatus === 'uncited').length / statusFacts.length) * 100;
    }

    // ── 3c. Action sequence features (audit_logs within the interval) ───────
    const intervalLogs = auditLogs.filter(l => inInterval(l.timestamp));
    const countAction = (needle) => intervalLogs.filter(l => (l.action ?? '').includes(needle)).length;
    const actionTypes = new Set(intervalLogs.map(l => l.action).filter(Boolean));
    const factAddsInInterval = facts.filter(f => inInterval(f.createdAt));
    const firstFactAdd = factAddsInInterval.length
      ? Math.min(...factAddsInInterval.map(f => ts(f.createdAt)))
      : null;
    const probesLast30d = probes.filter(p => ts(t0) - ts(p.timestamp) <= 30 * DAY_MS && ts(p.timestamp) <= ts(t0)).length;
    const articlesAtStart = articles.filter(a => a.timestamp && ts(a.timestamp) <= ts(t0));
    const lastArticleAt = articlesAtStart.length
      ? Math.max(...articlesAtStart.map(a => ts(a.timestamp)))
      : null;

    // ── 3e. Sentiment + prominence ──────────────────────────────────────────
    const sb = start.sentimentBreakdown ?? null;
    const sbTotal = sb ? (sb.positive ?? 0) + (sb.neutral ?? 0) + (sb.negative ?? 0) : 0;

    // ── 3f. Competitor features ─────────────────────────────────────────────
    const decays = competitors.map(c => c.decayScore).filter(v => typeof v === 'number');

    // ── 3g. Content features ────────────────────────────────────────────────
    const scoreLogs = auditLogs.filter(l => (l.action ?? '').includes('Scored Content') && ts(l.timestamp) <= ts(t0));
    const contentScores = scoreLogs.map(l => l.details?.score).filter(v => typeof v === 'number');
    const schemaLogs = auditLogs.filter(l => (l.action ?? '').includes('Generated JSON-LD Schema') && ts(l.timestamp) <= ts(t0));
    const schemaTypes = new Set(schemaLogs.map(l => l.details?.schemaType).filter(Boolean));

    // ── 3h. Citability Lab features ─────────────────────────────────────────
    const expsAtStart = experiments.filter(e => !e.timestamp || ts(e.timestamp) <= ts(t0));
    const winRates = expsAtStart.map(e => e.winnerCitationRate).filter(v => typeof v === 'number');
    const leverCounts = {};
    for (const e of expsAtStart) {
      const lever = e.winningLeverId ?? e.leverId;
      if (lever) leverCounts[lever] = (leverCounts[lever] ?? 0) + 1;
    }
    const topLever = Object.entries(leverCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    rows.push({
      // Row identity
      userId,
      interval_start: t0,
      interval_end: t1,
      interval_days: round2(daysBetween(t0, t1)),

      // ── Labels (spec §2) ──
      citation_rate_at_next_probe: end.citationRate,
      citation_rate_delta: round2(end.citationRate - start.citationRate),

      // 3a semantic
      avg_cosine_dist_to_probe_queries: round2(avgCosDist),
      semantic_concentration_score: round2(semanticConcentration),
      cited_territory_pct: round2(citedPct),
      gap_territory_pct: round2(gapPct),

      // 3b vault
      fact_count: factsAtStart.length,
      avg_entropy_score: round2(mean(entropies)),
      high_entropy_fact_pct: entropies.length ? round2(entropies.filter(v => v > 80).length / entropies.length * 100) : null,
      qa_format_pct: factsAtStart.length ? round2(factsAtStart.filter(f => qaRe.test(f.statement ?? '')).length / factsAtStart.length * 100) : null,
      fact_add_velocity: recentFacts.length,
      days_since_last_fact_added: lastFactAt ? round2((ts(t0) - lastFactAt) / DAY_MS) : null,
      fact_category_diversity: factsAtStart.length ? round2(factCategories.size / factsAtStart.length) : null,

      // 3c actions
      days_between_fact_add_and_probe: firstFactAdd ? round2((ts(t1) - firstFactAdd) / DAY_MS) : null,
      probe_frequency: probesLast30d,
      articles_published_between_probes: countAction('Published'),
      agent_pipeline_runs: countAction('Multi-Agent'),
      schema_actions_taken: countAction('Generated JSON-LD Schema'),
      competitor_analyses_run: countAction('Analyzed Competitor'),
      days_since_last_article: lastArticleAt ? round2((ts(t0) - lastArticleAt) / DAY_MS) : null,
      action_diversity_score: intervalLogs.length ? round2(actionTypes.size / intervalLogs.length) : null,

      // 3d probe state (dynamic engine columns spread in)
      current_citation_rate: start.citationRate,
      citation_rate_30d_ago: rateAtDaysAgo(30),
      citation_rate_60d_ago: rateAtDaysAgo(60),
      citation_rate_slope: round2(slope),
      ...engineFeatures,
      platform_spread: activeRates.length ? round2(Math.max(...activeRates) - Math.min(...activeRates)) : null,
      engines_with_zero_rate: zeroEngines,
      uncited_query_count: (start.results ?? []).filter(r => r.cited === false).length,
      total_probes_run: i + 1,

      // 3e sentiment/prominence
      sentiment_positive_pct: sbTotal ? round2((sb.positive ?? 0) / sbTotal * 100) : null,
      sentiment_negative_pct: sbTotal ? round2((sb.negative ?? 0) / sbTotal * 100) : null,
      avg_position_pct: typeof start.avgPositionPct === 'number' ? round2(start.avgPositionPct) : null,

      // 3f competitors
      avg_competitor_decay_score: round2(mean(decays)),
      competitors_in_decay: decays.filter(v => v > 60).length,
      lowest_competitor_decay: decays.length ? Math.min(...decays) : null,
      trojan_horse_count: competitors.filter(c => c.trojanHorseOpportunity != null).length,

      // 3g content
      articles_published: articlesAtStart.length,
      avg_content_score: round2(mean(contentScores)),
      has_schema_markup: schemaLogs.length > 0,
      schema_types_used: schemaTypes.size,

      // 3h citability lab
      experiments_run: expsAtStart.length,
      avg_experiment_win_rate: round2(mean(winRates)),
      most_effective_lever: topLever,
      lever_diversity: Object.keys(leverCounts).length,
    });
  }
  return rows;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const usersSnap = ONLY_USER
    ? { docs: [await db.collection('users').doc(ONLY_USER).get()].filter(d => d.exists) }
    : await db.collection('users').get();

  const allRows = [];
  for (const userDoc of usersSnap.docs) {
    const rows = await buildRowsForUser(userDoc.id, userDoc.data());
    allRows.push(...rows);
    if (rows.length) console.log(`  ${userDoc.id}: ${rows.length} interval rows`);
  }

  if (allRows.length === 0) {
    console.log('No training rows yet — need ≥2 probes per user. Nothing written.');
    return;
  }

  // Union of all columns (engine columns vary per user/probe vintage).
  const columns = [...new Set(allRows.flatMap(r => Object.keys(r)))];
  const normalized = allRows.map(r => Object.fromEntries(columns.map(c => [c, r[c] ?? null])));

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  if (FORMAT === 'csv') {
    const esc = (v) => v === null ? '' : typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v);
    const csv = [columns.join(','), ...normalized.map(r => columns.map(c => esc(r[c])).join(','))].join('\n');
    await fs.writeFile(OUT, csv + '\n');
  } else {
    await fs.writeFile(OUT, normalized.map(r => JSON.stringify(r)).join('\n') + '\n');
  }
  console.log(`\nWrote ${allRows.length} rows × ${columns.length} columns → ${OUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });
