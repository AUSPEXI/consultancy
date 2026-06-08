// Pure data — safe to import from both client components and the server core.
// (geo-experiment-core.ts pulls in server-only SDKs, so keep these separate.)

export type PlatformKey = 'gemini' | 'chatgpt' | 'perplexity' | 'claude';
export const EXPERIMENT_ENGINES: PlatformKey[] = ['gemini', 'chatgpt', 'perplexity', 'claude'];

export const ENGINE_LABELS: Record<PlatformKey, string> = {
  gemini: 'Gemini',
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  claude: 'Claude',
};

export interface Lever {
  id: string;
  label: string;
  description: string;
  transform: string;
}

export const EXPERIMENT_LEVERS: Lever[] = [
  {
    id: 'key-takeaways',
    label: 'Add a Key Takeaways section',
    description: 'Appends a bulleted "Key Takeaways" block of the most citable facts.',
    transform: 'Add a clearly-headed "## Key Takeaways" section near the top containing 4–6 bullet points of the most concrete, citable facts from the article. Change nothing else.',
  },
  {
    id: 'stat-density',
    label: 'Increase statistic density',
    description: 'Surfaces concrete numbers, dates and named entities into the prose.',
    transform: 'Rewrite so that concrete statistics, dates, percentages and named entities are stated explicitly and early in each section. Do not invent any new facts — only surface and sharpen the ones already present. Keep the same structure and length.',
  },
  {
    id: 'declarative',
    label: 'Tighten to declarative sentences',
    description: 'Removes hedging; states facts directly the way engines prefer to quote.',
    transform: 'Rewrite every sentence to be direct and declarative. Remove hedging language ("may", "could", "perhaps", "it is thought"). State facts as facts. Keep the same information, structure and length.',
  },
  {
    id: 'qa-framing',
    label: 'Reframe headers as questions',
    description: 'Converts H2/H3 headers into the question form users actually ask AI.',
    transform: 'Convert the H2/H3 section headers into natural-language questions that match how users ask AI engines (e.g. "Pricing" → "How much does it cost?"). Keep the body text and order unchanged.',
  },
  {
    id: 'entity-first',
    label: 'Lead with the brand entity',
    description: 'States who/what the entity is, plainly, in the opening lines.',
    transform: 'Rewrite the opening paragraph so it states plainly what the entity is, what it does, and its single most distinctive fact — in the first two sentences. Keep the rest unchanged.',
  },
];

export function getLever(id: string): Lever | undefined {
  return EXPERIMENT_LEVERS.find(l => l.id === id);
}
