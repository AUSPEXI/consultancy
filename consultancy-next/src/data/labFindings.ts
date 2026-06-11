// Public GEO Lab findings. Each entry mirrors the finding.json committed by the
// geo-lab CI pipeline (geo-lab/experiments/*/finding.json). Keep verdicts and
// numbers in exact sync with those files — this page's value is that it never
// overstates a result.

export type Verdict = 'preliminary' | 'supported' | 'rejected' | 'null';

export interface LabFinding {
  id: string;
  title: string;
  hypothesis: string;
  runAt: string; // ISO date
  platforms: string[];
  sampleDescription: string;
  resultSummary: string;
  headlineNumbers: { label: string; value: string }[];
  verdict: Verdict;
  verdictReason: string;
  whatWeDoNext: string;
}

export const labFindings: LabFinding[] = [
  {
    id: '001-statistical-anchors',
    title: 'Do statistical anchors in the opening sentence increase AI citation?',
    hypothesis:
      'If the opening sentence contains a specific number ("cut latency 43%"), citation rate will be higher than a version with vague language ("improved latency significantly") for product-performance queries — because LLMs weight precise, citable data points as credibility signals.',
    runAt: '2026-06-10',
    platforms: ['Gemini', 'ChatGPT', 'Perplexity', 'Claude'],
    sampleDescription:
      '32 trials per variant across 4 engines (8 per engine) — below our pre-registered threshold of 30 per engine.',
    resultSummary:
      'The specific-number variant (B) was cited in 16 of 32 trials (50%) versus 7 of 32 (21.9%) for the vague variant (A). The only statistically significant per-engine effect was on Claude (+62.5pp, p=0.007) — which was not the pre-registered primary platform. Gemini returned 8/8 null responses due to API failures (since fixed), so its data is missing entirely.',
    headlineNumbers: [
      { label: 'Variant A (vague) citation rate', value: '21.9%' },
      { label: 'Variant B (specific number) citation rate', value: '50%' },
      { label: 'Significant effect (Claude only)', value: '+62.5pp, p=0.007' },
    ],
    verdict: 'preliminary',
    verdictReason:
      'Sample size (n=8 per variant per engine) is below the pre-registered n≥30; the significant effect appeared on Claude rather than the pre-registered primary platform (Perplexity); and Gemini data is missing due to API failures. Encouraging direction — not yet a finding we will state as fact.',
    whatWeDoNext:
      'Re-run at n≥30 per engine with the Gemini API fix in place, keeping Perplexity as the pre-registered primary platform. If the effect holds, it graduates to "supported" and we will say so plainly.',
  },
];
