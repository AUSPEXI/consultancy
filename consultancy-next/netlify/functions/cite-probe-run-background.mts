// Netlify BACKGROUND function (the "-background" suffix is what makes Netlify run
// it asynchronously with up to a 15-minute budget, instead of the ~26s limit on
// synchronous functions). It runs the heavy grounded citation probe that would
// otherwise time out, and writes the result into the cite_probe_jobs/{jobId} doc
// for the dashboard to poll.
//
// Imports are relative (not the "@/" alias) so esbuild bundles them into the
// function: cite-probe-job pulls only cite-probe-core (@google/genai, openai),
// stats, and attribution — all alias-free.
import { dbAdmin } from '../../src/lib/firebase-admin';
import { runProbeJob } from '../../src/lib/cite-probe-job';

export default async (req: Request): Promise<Response> => {
  let jobId: string | undefined;
  let secret: string | undefined;
  try {
    const body = await req.json();
    jobId = body?.jobId;
    secret = body?.secret;
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // Optional shared-secret gate (only enforced if the env var is set).
  const expected = process.env.CITE_PROBE_WORKER_SECRET;
  if (expected && secret !== expected) {
    return new Response('forbidden', { status: 403 });
  }

  if (!jobId || !dbAdmin) {
    return new Response('no job / no db', { status: 202 });
  }

  const ref = dbAdmin.collection('cite_probe_jobs').doc(jobId);
  const snap = await ref.get();
  if (!snap.exists) return new Response('job not found', { status: 202 });
  const job = snap.data() as any;
  if (job.status !== 'pending') return new Response('already processed', { status: 202 });

  await ref.update({ status: 'running', startedAt: new Date().toISOString() });

  try {
    const result = await runProbeJob(job.params, dbAdmin);
    await ref.update({ status: 'done', result, finishedAt: new Date().toISOString() });
  } catch (e: any) {
    await ref.update({
      status: 'error',
      error: e?.message || String(e),
      finishedAt: new Date().toISOString(),
    });
  }

  return new Response('ok', { status: 202 });
};
