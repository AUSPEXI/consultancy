#!/usr/bin/env node
/**
 * GEO Lab Orchestrator
 *
 * Decides what to do next and does it. Run daily by GitHub Actions.
 *
 * Phases (auto-selected based on lab-state.json):
 *   design   — pick next experiment, generate DESIGN.md + variants via Claude API
 *   probe    — run probes for the active experiment, accumulate n
 *   analyze  — run statistics, generate video package, send email report
 *
 * Usage:
 *   node orchestrate.mjs [--force-phase design|probe|analyze] [--dry-run]
 *
 * Env (from .env or GitHub Actions secrets):
 *   ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY,
 *   PERPLEXITY_API_KEY, EMAIL_USER, EMAIL_APP_PASSWORD, REPORT_EMAIL
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { config } from 'dotenv';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');

config({ path: path.join(__dir, '.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const VALID_PHASES = ['design', 'probe', 'analyze', 'retest'];
const forcePhase = (() => {
  const idx = process.argv.indexOf('--force-phase');
  const v = idx !== -1 ? process.argv[idx + 1] : null;
  if (v && !VALID_PHASES.includes(v)) {
    console.warn(`[orchestrate] Ignoring invalid --force-phase "${v}" (expected ${VALID_PHASES.join(' / ')}); auto-detecting phase instead.`);
    return null;
  }
  return v;
})();

const MIN_N = 120; // pooled per variant ≈ 30 per platform-variant (4 platforms); accrues over ~4 daily runs, which also spreads collection across days for temporal robustness
const MAX_PROBES_PER_RUN = 2; // probe batches per daily run (each batch = 1 trial × all queries × all platforms)

// ── Helpers ──────────────────────────────────────────────────────────────────

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function callClaude(systemPrompt, userPrompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    log(`Running: node ${path.basename(scriptPath)} ${args.join(' ')}`);
    if (DRY_RUN) { log('[dry-run] skipped'); return resolve(''); }
    const child = spawn('node', [scriptPath, ...args], { stdio: 'inherit', env: process.env });
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Script exited with code ${code}`)));
  });
}

// ── Load experiment raw.json and count n ──────────────────────────────────────

async function countN(experimentDir) {
  const rawPath = path.join(experimentDir, 'results', 'raw.json');
  try {
    const raw = await readJson(rawPath);
    if (!raw.results || !raw.meta?.variants) return 0;
    const variants = raw.meta.variants;
    // n per variant = scored trials (a trial with a null/failed response has an
    // empty citations object and must NOT count toward n).
    const perVariant = {};
    for (const v of variants) perVariant[v] = 0;
    for (const r of raw.results) {
      for (const v of variants) {
        if (r.citations && r.citations[v] !== undefined) perVariant[v]++;
      }
    }
    return Math.min(...Object.values(perVariant));
  } catch {
    return 0;
  }
}

// ── DESIGN PHASE ─────────────────────────────────────────────────────────────

async function designPhase(state, backlog) {
  const nextExp = backlog.experiments.find(e => e.status === 'queued' && e.n_per_variant > 0);
  if (!nextExp) {
    log('No queued experiments with n > 0 found. All done!');
    return;
  }

  log(`Designing experiment ${nextExp.id}: ${nextExp.title}`);

  const experimentDir = path.join(ROOT, 'experiments', `${nextExp.id}-${nextExp.slug}`);
  await fs.mkdir(path.join(experimentDir, 'variants'), { recursive: true });
  await fs.mkdir(path.join(experimentDir, 'results'), { recursive: true });
  await fs.mkdir(path.join(experimentDir, 'video'), { recursive: true });

  // Read context files
  const geoPrinciples = await fs.readFile(path.join(ROOT, 'context', 'geo-principles.md'), 'utf8');
  const methodology = await fs.readFile(path.join(ROOT, 'context', 'experiment-methodology.md'), 'utf8');
  const templateDesign = await fs.readFile(path.join(ROOT, 'experiments', '_template', 'DESIGN.md'), 'utf8');
  const templateA = await fs.readFile(path.join(ROOT, 'experiments', '_template', 'variants', 'A.md'), 'utf8');
  const templateB = await fs.readFile(path.join(ROOT, 'experiments', '_template', 'variants', 'B.md'), 'utf8');

  const systemPrompt = `You are the GEO Lab's experiment designer. You write rigorous, falsifiable A/B experiments on LLM citation behaviour.

RULES:
- One variable per experiment — variants differ in EXACTLY ONE factor.
- Write concrete, realistic content about a fictional B2B SaaS called "NovaCRM" that helps sales teams close deals faster. Use NovaCRM as the subject of all variants so the brand is neutral.
- Variants must be equal length (within 10%) unless length is the variable being tested.
- Queries must be phrased as real user questions, 3-5 paraphrases.
- The DESIGN.md hypothesis section must be a single sentence in the format: "If [change], then [citation rate will be higher/lower] for [query type], because [mechanism]."
- Return ONLY the file contents, clearly delimited as instructed.`;

  const userPrompt = `Design experiment ${nextExp.id}.

Hypothesis from queue: ${nextExp.hypothesis}
Variable: ${nextExp.variable}
Predicted winner: ${nextExp.predicted_winner}
Platforms: ${nextExp.platforms.join(', ')}
n per variant: ${nextExp.n_per_variant}

GEO Principles context:
${geoPrinciples}

Methodology context:
${methodology}

DESIGN.md template:
${templateDesign}

Variant A template:
${templateA}

Variant B template:
${templateB}

Produce three outputs, each delimited exactly as shown:

<DESIGN_MD>
[complete DESIGN.md content]
</DESIGN_MD>

<VARIANT_A>
[complete variants/A.md content — the CONTROL, 150-200 words about NovaCRM WITHOUT the lever]
</VARIANT_A>

<VARIANT_B>
[complete variants/B.md content — the TREATMENT, same length about NovaCRM WITH the lever applied]
</VARIANT_B>`;

  log('Calling Claude to write experiment design...');
  if (DRY_RUN) {
    log('[dry-run] Skipping Claude call');
  } else {
    const response = await callClaude(systemPrompt, userPrompt);

    const designMatch = response.match(/<DESIGN_MD>([\s\S]*?)<\/DESIGN_MD>/);
    const variantAMatch = response.match(/<VARIANT_A>([\s\S]*?)<\/VARIANT_A>/);
    const variantBMatch = response.match(/<VARIANT_B>([\s\S]*?)<\/VARIANT_B>/);

    if (!designMatch || !variantAMatch || !variantBMatch) {
      throw new Error('Claude response missing expected delimiters. Response:\n' + response.slice(0, 500));
    }

    await fs.writeFile(path.join(experimentDir, 'DESIGN.md'), designMatch[1].trim() + '\n');
    await fs.writeFile(path.join(experimentDir, 'variants', 'A.md'), variantAMatch[1].trim() + '\n');
    await fs.writeFile(path.join(experimentDir, 'variants', 'B.md'), variantBMatch[1].trim() + '\n');
    log(`Written: DESIGN.md, variants/A.md, variants/B.md`);
  }

  // Update backlog
  nextExp.status = 'running';
  nextExp.started_at = new Date().toISOString();
  await writeJson(path.join(ROOT, 'experiments', 'backlog.json'), backlog);

  // Update state
  state.active_experiment = {
    id: nextExp.id,
    slug: nextExp.slug,
    dir: `experiments/${nextExp.id}-${nextExp.slug}`,
    started_at: nextExp.started_at,
    n_target: Math.max(nextExp.n_per_variant || 0, MIN_N),
    platforms: nextExp.platforms,
  };
  state.last_design_run = new Date().toISOString();
  await writeJson(path.join(ROOT, 'lab-state.json'), state);

  log(`Experiment ${nextExp.id} designed. Pre-registration timestamp: ${nextExp.started_at}`);
}

// ── PROBE PHASE ───────────────────────────────────────────────────────────────

async function probePhase(state) {
  if (!state.active_experiment) {
    log('No active experiment. Run design phase first.');
    return false;
  }

  const exp = state.active_experiment;
  const experimentDir = path.join(ROOT, exp.dir);

  const currentN = await countN(experimentDir);
  log(`Current n: ${currentN} / ${exp.n_target}`);

  if (currentN >= exp.n_target) {
    log('n target reached — triggering analyze phase');
    return true; // signal to caller: ready to analyze
  }

  const trialsThisRun = Math.min(MAX_PROBES_PER_RUN, exp.n_target - currentN);
  const platformArg = exp.platforms.join(',');

  log(`Running ${trialsThisRun} trial batch across [${platformArg}]...`);

  await runScript(path.join(__dir, 'probe.mjs'), [
    experimentDir,
    '--platform', platformArg,
    '--trials', String(trialsThisRun),
  ]);

  const newN = await countN(experimentDir);
  log(`n after probe: ${newN} / ${exp.n_target}`);

  state.last_probe_run = new Date().toISOString();
  await writeJson(path.join(ROOT, 'lab-state.json'), state);

  return newN >= exp.n_target;
}

// ── ANALYZE PHASE ─────────────────────────────────────────────────────────────

async function analyzePhase(state, backlog) {
  if (!state.active_experiment) {
    log('No active experiment to analyze.');
    return;
  }

  const exp = state.active_experiment;
  const experimentDir = path.join(ROOT, exp.dir);

  // Canonically re-score all stored responses by content fingerprint BEFORE stats,
  // so every record (across all daily batches) is scored by one consistent method.
  log('Canonically re-scoring citations from stored responses...');
  await runScript(path.join(__dir, 'rescore.mjs'), [experimentDir]);

  // Independent LLM-judge attribution cross-check (semantic, robust to paraphrase
  // and to the verbatim scorer's quotability bias). Non-fatal: skips with no key.
  log('Running LLM-judge attribution cross-check...');
  try {
    await runScript(path.join(__dir, 'llm-judge.mjs'), [experimentDir]);
  } catch (err) {
    log(`⚠ LLM-judge cross-check failed (non-fatal): ${err.message}`);
  }

  // Run statistical analysis
  log('Running statistical analysis...');
  await runScript(path.join(__dir, 'analyze.mjs'), [experimentDir]);

  // Generate video package
  log('Generating video package...');
  await runScript(path.join(__dir, 'generate-video-package.mjs'), [experimentDir]);

  // Send email report (non-fatal — a bad SMTP credential must not fail the run
  // after results/FINDING.md are already written, or the commit step never runs)
  log('Sending report email...');
  try {
    await runScript(path.join(__dir, 'send-report.mjs'), [experimentDir]);
  } catch (err) {
    log(`⚠️ Report email failed (non-fatal): ${err.message}`);
  }

  // Publish the finding into the dashboard recommendation loop (non-fatal)
  log('Publishing finding to dashboard...');
  try {
    await runScript(path.join(__dir, 'publish-finding.mjs'), [experimentDir]);
  } catch (err) {
    log(`Publish step failed (non-fatal): ${err.message}`);
  }

  // Sync latest outputs to Cowork local folder so Cowork Desktop can read
  // without needing GitHub access — overwrites previous experiment's copy.
  const coworkDir = path.join(process.env.HOME || '/root', 'L8EntSpace-Cowork', 'geo-lab-latest');
  try {
    await fs.mkdir(coworkDir, { recursive: true });
    const filesToSync = [
      path.join(experimentDir, 'FINDING.md'),
      path.join(experimentDir, 'finding.json'),
    ];
    for (const src of filesToSync) {
      try {
        await fs.copyFile(src, path.join(coworkDir, path.basename(src)));
      } catch { /* file may not exist on dry-run */ }
    }
    // Sync entire video/ folder
    const videoSrc = path.join(experimentDir, 'video');
    const videoDst = path.join(coworkDir, 'video');
    await fs.mkdir(videoDst, { recursive: true });
    try {
      const videoFiles = await fs.readdir(videoSrc);
      await Promise.all(videoFiles.map(f => fs.copyFile(path.join(videoSrc, f), path.join(videoDst, f))));
    } catch { /* video/ may not exist */ }
    log(`Cowork sync complete: ${coworkDir}`);
  } catch (err) {
    log(`⚠ Cowork sync failed (non-fatal): ${err.message}`);
  }

  // Mark experiment complete
  const expEntry = backlog.experiments.find(e => e.id === exp.id);
  if (expEntry) {
    expEntry.status = 'complete';
    expEntry.completed_at = new Date().toISOString();
    await writeJson(path.join(ROOT, 'experiments', 'backlog.json'), backlog);
  }

  // Archive and reset state
  if (!state.history) state.history = [];
  state.history.push({ ...exp, completed_at: new Date().toISOString() });
  state.active_experiment = null;
  state.queue_position = (state.queue_position || 0) + 1;
  await writeJson(path.join(ROOT, 'lab-state.json'), state);

  log(`Experiment ${exp.id} complete. Designing next experiment immediately.`);
}

// ── LONGITUDINAL RE-TEST PHASE ────────────────────────────────────────────────
// Every 30 days, re-probe completed experiments to check if the effect still
// holds under current model versions. This is the core of "realtime temporal
// data" — not just collecting slowly, but returning to measure drift over time.
// A finding that reverses after a model update is itself a video: "We re-tested
// our #1 finding 60 days later. Here's what happened."
//
// Re-test records go into <experiment-dir>/results/retest-<ISO-date>.json so
// they never corrupt the original raw.json. A separate retest FINDING is
// appended to the experiment folder.
async function longitudinalRetestPhase(state, backlog) {
  const completedWithFindings = backlog.experiments.filter(e => e.status === 'complete');
  if (completedWithFindings.length === 0) return;

  const now = Date.now();
  const RETEST_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  const retestLog = state.retestLog ?? {}; // { [expId]: lastRetestAt ISO }

  for (const exp of completedWithFindings) {
    const lastRetest = retestLog[exp.id] ? new Date(retestLog[exp.id]).getTime() : 0;
    const completedAt = exp.completed_at ? new Date(exp.completed_at).getTime() : 0;
    const refTime = Math.max(lastRetest, completedAt);
    if (now - refTime < RETEST_INTERVAL_MS) continue;

    const expDir = path.join(ROOT, 'experiments', `${exp.id}-${exp.slug}`);
    try { await fs.access(expDir); } catch { continue; } // folder must exist

    const findingPath = path.join(expDir, 'finding.json');
    let finding;
    try { finding = JSON.parse(await fs.readFile(findingPath, 'utf8')); } catch { continue; }

    // Only re-test experiments that had a significant result — null findings
    // don't need drift-tracking.
    if (finding.verdict !== 'significant') {
      retestLog[exp.id] = new Date().toISOString();
      continue;
    }

    log(`Longitudinal re-test: experiment ${exp.id} (${exp.slug})`);

    // Run a small re-probe batch (5 trials per variant) — cheap signal check
    const platformArg = (exp.platforms ?? ['gemini', 'openai', 'perplexity', 'claude']).join(',');
    const retestDir = expDir; // probe reads variants/ from the same folder

    const retestResultsPath = path.join(expDir, 'results', `retest-${new Date().toISOString().slice(0, 10)}.json`);

    if (!DRY_RUN) {
      // Temporarily point probe output to the retest path by running it with a
      // custom --out flag (added to probe.mjs above).
      await runScript(path.join(__dir, 'probe.mjs'), [
        retestDir,
        '--platform', platformArg,
        '--trials', '5',
        '--out', retestResultsPath,
      ]);

      // Append retest summary to the finding for dashboard visibility
      try {
        const retestRaw = JSON.parse(await fs.readFile(retestResultsPath, 'utf8'));
        const retestAgg = {};
        for (const v of (finding.variants ?? [])) {
          const citedCount = retestRaw.results.filter(r => r.citations?.[v]).length;
          const total = retestRaw.results.filter(r => r.citations && v in r.citations).length;
          retestAgg[v] = { cited: citedCount, total, rate: total > 0 ? +((citedCount / total) * 100).toFixed(1) : 0 };
        }
        finding.retests = finding.retests ?? [];
        finding.retests.push({
          retestAt: new Date().toISOString(),
          collectionDate: new Date().toISOString().slice(0, 10),
          modelVersions: retestRaw.meta?.modelVersions ?? {},
          aggregate: retestAgg,
        });
        await fs.writeFile(findingPath, JSON.stringify(finding, null, 2) + '\n');
        log(`Re-test complete for ${exp.id}. Aggregate: ${JSON.stringify(retestAgg)}`);

        // Re-publish so the dashboard recommendation reflects the latest
        // verification status (verified/decayed) — a decayed finding is
        // deactivated server-side. Non-fatal.
        try {
          await runScript(path.join(__dir, 'publish-finding.mjs'), [expDir]);
        } catch (pubErr) {
          log(`⚠ Re-publish after re-test failed (non-fatal): ${pubErr.message}`);
        }
      } catch (e) {
        log(`⚠ Re-test result parse failed (non-fatal): ${e.message}`);
      }
    } else {
      log(`[dry-run] Would re-test ${exp.id} with 5 trials per variant`);
    }

    retestLog[exp.id] = new Date().toISOString();
    break; // one re-test per daily run to keep costs minimal
  }

  state.retestLog = retestLog;
  await writeJson(statePath, state);
}

// ── Main ─────────────────────────────────────────────────────────────────────

const statePath = path.join(ROOT, 'lab-state.json');
const backlogPath = path.join(ROOT, 'experiments', 'backlog.json');

const state = await readJson(statePath);
const backlog = await readJson(backlogPath);

const hasActiveExperiment = !!state.active_experiment;

// Determine phase.
// Design runs immediately when no experiment is active — removing the Monday
// gate means we don't lose days between experiments across a 20-experiment run.
let phase = forcePhase;
if (!phase) {
  if (!hasActiveExperiment) {
    phase = 'design';
  } else {
    phase = 'probe'; // will self-escalate to analyze if n is reached
  }
}

log(`Phase: ${phase}${DRY_RUN ? ' [DRY RUN]' : ''}`);

switch (phase) {
  case 'design':
    await designPhase(state, backlog);
    break;

  case 'probe': {
    const ready = await probePhase(state, backlog);
    if (ready) {
      // Re-read state in case probe updated it
      const freshState = await readJson(statePath);
      await analyzePhase(freshState, backlog);
    }
    break;
  }

  case 'analyze': {
    const freshState = await readJson(statePath);
    await analyzePhase(freshState, backlog);
    break;
  }

  case 'retest': {
    const freshState = await readJson(statePath);
    await longitudinalRetestPhase(freshState, backlog);
    break;
  }

  default:
    log(`Unknown phase: ${phase}`);
    process.exit(1);
}

// After every run, check whether any completed experiment is due a 30-day
// longitudinal re-test. This piggybacks on the existing daily cron with no
// schedule change — the re-tester checks elapsed time internally and is a no-op
// if nothing is due.
if (phase !== 'retest') {
  const finalState = await readJson(statePath);
  await longitudinalRetestPhase(finalState, backlog);
}

log('Orchestrator done.');
