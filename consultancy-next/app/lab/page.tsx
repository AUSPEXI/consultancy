import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { labFindings, type Verdict } from '@/data/labFindings';

export const metadata: Metadata = {
  title: 'GEO Lab: Published Experiment Results | L8EntSpace',
  description:
    'Controlled A/B experiments on what makes AI engines cite a brand. Pre-registered hypotheses, real statistical tests, and published results (including null and preliminary findings).',
  alternates: { canonical: 'https://l8entspace.com/lab' },
};

const VERDICT_STYLES: Record<Verdict, { label: string; cls: string }> = {
  preliminary: { label: '⚠ Preliminary', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  supported: { label: '✓ Supported', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: '✗ Rejected', cls: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  null: { label: '∅ Null result', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export default function LabPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'L8EntSpace GEO Lab: Published Experiment Results',
    description: metadata.description,
    url: 'https://l8entspace.com/lab',
    hasPart: labFindings.map(f => ({
      '@type': 'ScholarlyArticle',
      headline: f.title,
      datePublished: f.runAt,
      abstract: f.resultSummary,
      author: { '@type': 'Organization', name: 'L8EntSpace' },
    })),
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <header className="mb-12">
          <p className="text-xs font-black tracking-[0.25em] text-pink-500 uppercase mb-3">GEO Lab</p>
          <h1 className="text-4xl font-black text-white mb-4">What actually changes AI citations: tested, not guessed</h1>
          <p className="text-zinc-400 leading-relaxed">
            Most GEO advice is confident guessing. The GEO Lab runs controlled A/B experiments instead:
            pre-registered hypotheses, identical content except one variable, real queries across multiple AI engines,
            and a proper statistical test. We publish every result here (including the preliminary ones and the failures),
            with the caveats stated up front. If a number on this page has an asterisk in spirit, we write the asterisk out.
          </p>
        </header>

        <section className="space-y-10">
          {labFindings.map(f => {
            const v = VERDICT_STYLES[f.verdict];
            return (
              <article key={f.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-2.5 py-1 rounded-md border text-xs font-bold ${v.cls}`}>{v.label}</span>
                  <span className="text-xs text-zinc-500 font-mono">{f.id} · {f.runAt}</span>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">{f.title}</h2>

                <div className="space-y-5 text-sm leading-relaxed">
                  <div>
                    <p className="text-[11px] font-black tracking-widest text-zinc-500 uppercase mb-1">Hypothesis</p>
                    <p className="text-zinc-300">{f.hypothesis}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black tracking-widest text-zinc-500 uppercase mb-1">Setup</p>
                    <p className="text-zinc-300">
                      Engines: {f.platforms.join(', ')}. {f.sampleDescription}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black tracking-widest text-zinc-500 uppercase mb-2">Result</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      {f.headlineNumbers.map(n => (
                        <div key={n.label} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                          <p className="text-lg font-black text-white">{n.value}</p>
                          <p className="text-[11px] text-zinc-500 mt-1">{n.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-zinc-300">{f.resultSummary}</p>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-4">
                    <p className="text-[11px] font-black tracking-widest text-amber-400/80 uppercase mb-1">Why this verdict</p>
                    <p className="text-zinc-400">{f.verdictReason}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black tracking-widest text-zinc-500 uppercase mb-1">What we do next</p>
                    <p className="text-zinc-300">{f.whatWeDoNext}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-16 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-3">How the lab works</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-300">
            <li><strong className="text-white">Pre-register the hypothesis</strong>: the prediction, primary platform, and sample threshold are written down before the run.</li>
            <li><strong className="text-white">Change exactly one thing</strong>: variant B is identical to variant A except for the variable under test.</li>
            <li><strong className="text-white">Probe real engines</strong>: the same query set runs across Gemini, ChatGPT, Perplexity, and Claude, with randomised variant order.</li>
            <li><strong className="text-white">Test for significance</strong>: a two-proportion z-test decides whether the difference beats chance.</li>
            <li><strong className="text-white">Publish whatever comes out</strong>: supported, rejected, null, or preliminary. Preliminary means "promising but underpowered," and we say so.</li>
          </ol>
          <p className="text-sm text-zinc-400 mt-6">
            Want to run experiments like these on your own content?{' '}
            <Link href="/#pricing" className="text-pink-400 hover:text-pink-300 underline">The Citability Lab</Link>{' '}
            in the L8EntSpace dashboard runs the same head-to-head methodology on your drafts. Or read more on{' '}
            <Link href="/blog" className="text-pink-400 hover:text-pink-300 underline">the blog</Link>.
          </p>
        </section>
      </main>

      <Footerdemo />
    </div>
  );
}
