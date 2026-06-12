/**
 * Citacious version config — single source of truth for dashboard tool manifest.
 *
 * Update this file at the end of any sprint that adds, removes, renames, or
 * changes the purpose of a dashboard tool. Bump CITACIOUS_CONFIG_VERSION so
 * audit logs and conversation history reflect which prompt version was in use.
 */

export const CITACIOUS_CONFIG_VERSION = '2026-06-07-v8';

export type ToolStatus = 'active' | 'beta' | 'deprecated';

export interface DashboardTool {
  /** Route segment after /dashboard/ */
  id: string;
  /** Display name */
  name: string;
  /** Status — deprecated tools are excluded from Citacious navigation suggestions */
  status: ToolStatus;
  /** One-sentence description of what this tool does */
  purpose: string;
  /** Which metrics or data this tool exposes (for Citacious to reference) */
  metrics?: string[];
  /** Key actions the user can take here */
  actions?: string[];
  /** Citacious gamified label (optional flavour text) */
  flavor?: string;
}

/**
 * Master tool manifest. This is what Citacious knows about the dashboard.
 *
 * Sprint discipline: when a tool is removed, set status: 'deprecated' rather
 * than deleting it — this prevents Citacious referencing it while preserving
 * audit history. Delete after two sprints with no references.
 */
export const DASHBOARD_TOOLS: DashboardTool[] = [
  {
    id: 'overview',
    name: 'AI SOV Overview',
    status: 'active',
    purpose: 'AI Share of Voice command centre: shows A-SOV trend from real Citation Probe history, 768-D Latent Space Map of vault facts, Competitive Citation Dominance chart, and Cite-Magnet Scorecard.',
    metrics: ['A-SOV %', 'Entity Recall Rate (ERR)', 'Competitor Gap', 'AI Referral Traffic', 'Sentiment Index'],
    actions: ['View SOV trend chart', 'Inspect latent space map', 'Review scorecard', 'Generate a "Dark AI" Shadow Link (UTM-tagged URL for JSON-LD) to attribute AI traffic in Google Analytics'],
    flavor: 'AI SOV Command Center',
  },
  {
    id: 'cite-probe',
    name: 'Citation Probe',
    status: 'active',
    purpose: 'THE PRIMARY MEASUREMENT TOOL. Sends live questions through the L8EntSpace Citation Engine across ChatGPT, Gemini, Claude, and Perplexity, checks if the brand is cited in each answer, and tracks citation rate over time.',
    metrics: ['Citation rate %', 'Per-platform citation rates (Gemini/ChatGPT/Perplexity/Claude)', 'Cited queries', 'Missed queries', 'Since-last-probe attribution (newly-won queries + likely-contributing facts/articles)'],
    actions: ['Run probe', 'View citation history chart', 'Export training set (JSONL/CSV)', 'Identify content gaps from missed queries', 'See which facts/articles correlate with newly-cited queries'],
    flavor: 'Citation Engine',
  },
  {
    id: 'geo-pulse',
    name: 'GEO Pulse',
    status: 'active',
    purpose: 'First-party data lake scanner. Query any keyword to get AI Share of Voice, entity density scores, context drift detection, and trojan horse displacement opportunities.',
    metrics: ['Keyword AI SOV', 'Entity density score', 'Drift z-score', 'Trojan horse opportunities'],
    actions: ['Scan keyword', 'Detect content drift', 'Find displacement opportunities'],
    flavor: 'Data Lake Scanner',
  },
  {
    id: 'competitors',
    name: 'Competitor Radar',
    status: 'active',
    purpose: 'Enemy Radar. Tracks competitor decay scores: competitors with stale, low-entropy content are vulnerable to displacement via the Trojan Horse strategy.',
    metrics: ['Competitor decay score', 'Competitor AI SOV', 'Stale topic clusters'],
    actions: ['Add competitor', 'View decay trend', 'Generate counter-facts', 'Identify Trojan Horse targets'],
    flavor: 'Enemy Radar',
  },
  {
    id: 'fact-vault',
    name: 'Fact Vault',
    status: 'active',
    purpose: 'Knowledge Vault. Brand Cite-Magnet facts stored here are injected into every LLM call via RAG context. Also stores 768-D embeddings (API + local synonym-based) with alignment scores. Foundation of all GEO authority.',
    metrics: ['Fact count', 'Embedding alignment scores', 'Entropy scores per fact'],
    actions: ['Add fact manually', 'Extract facts from URL (Agents)', 'Research facts via Perplexity', 'View embedding alignment'],
    flavor: 'Knowledge Vault / 768-D Moat',
  },
  {
    id: 'content-scorer',
    name: 'Content Scorer',
    status: 'active',
    purpose: "Analyst's Forge. Paste content to grade it on GEO readiness: entity density, fact entropy, schema coverage, and overall citation probability. Suggests specific edits before publishing, and surfaces Lab-Validated GEO Levers (content tactics proven to lift citation rate by real A/B experiments in the L8EntSpace GEO Lab, with effect sizes and p-values).",
    metrics: ['GEO score %', 'Entity density', 'Fact count extracted', 'Schema coverage', 'Lab-validated levers (live from GEO Lab)'],
    actions: ['Score content', 'Extract facts to Fact Vault', 'Get edit suggestions', 'Apply lab-validated GEO levers'],
    flavor: "Analyst's Forge",
  },
  {
    id: 'simulator',
    name: 'SOV Simulator',
    status: 'active',
    purpose: 'Scrying Pool. Fire a single high-intent query at every live AI engine (ChatGPT, Claude, Gemini, Perplexity) and measure the real Share of Voice: which engines actually cite the brand. Engines without a configured key are skipped, never faked.',
    metrics: ['Live Share of Voice %', 'Engines citing the brand', 'Per-engine response text'],
    actions: ['Query live engines', 'Compare per-engine brand citations', 'Identify which engines ignore the brand'],
    flavor: 'Scrying Pool',
  },
  {
    id: 'brand-monitor',
    name: 'Brand Monitor',
    status: 'active',
    purpose: 'Perception Watchtower. Tracks web mentions of brand, products, and key terms across news, forums, and social platforms. Surfaces positive signals to amplify and negative content to counter before it influences AI training.',
    metrics: ['Mention volume', 'Sentiment trend', 'Positive / negative split'],
    actions: ['Scan brand mentions', 'Flag counter-content opportunities', 'Generate seed content for Reddit & LinkedIn (Business)'],
    flavor: 'Perception Watchtower',
  },
  {
    id: 'technical',
    name: 'Schema Engine',
    status: 'active',
    purpose: 'Edge & Schema Engine Room. Manages JSON-LD Schema Injectors, audits AI crawlability (GPTBot, ClaudeBot, PerplexityBot, Google-Extended), and generates technical remediation tasks.',
    metrics: ['Schema coverage', 'AI crawler access score', 'Core Web Vitals'],
    actions: ['Audit crawlability', 'Generate JSON-LD schema', 'Deploy schema snippet'],
    flavor: 'Schema Engine Room',
  },
  {
    id: 'agents',
    name: 'Agent Orchestration',
    status: 'active',
    purpose: 'Multi-Agent Orchestration Guild. Full pipeline: Crawler (L8EntSpace Neural Crawler) → Extraction Agent (fact isolation, no hallucinations) → Schema Agent (JSON-LD generator) → Synthesis Agent (GEO-optimised article). Output published directly to CMS via webhook.',
    metrics: ['Articles generated', 'Facts extracted per run', 'Schema blocks generated'],
    actions: ['Run full pipeline on target query', 'Extract facts', 'Generate article', 'Publish via webhook', 'Deploy schema'],
    flavor: 'Multi-Agent Orchestration Guild',
  },
  {
    id: 'audit-logs',
    name: 'Audit Logs',
    status: 'active',
    purpose: "Scribe's Journal. Security and activity audit trail for all platform actions: fact additions, agent runs, probe executions, settings changes.",
    metrics: ['Action count', 'Recent activity timeline'],
    actions: ['Review activity history'],
    flavor: "Scribe's Journal",
  },
  {
    id: 'settings',
    name: 'Settings',
    status: 'active',
    purpose: 'Brand configuration. Set brand name and domain here (required before Citation Probe and Agent runs). Also manages keywords, competitor list, CMS webhook, and sitemap URL.',
    metrics: [],
    actions: ['Set brand name', 'Set domain', 'Add keywords', 'Add competitors', 'Configure webhook', 'Submit sitemap'],
    flavor: 'Brand Configuration',
  },
  {
    id: 'entity-hub',
    name: 'Entity Hub',
    status: 'active',
    purpose: 'Brand entity establishment for Wikidata, Google Knowledge Panel, schema.org, and other knowledge graphs. Generates complete entity profile with Wikidata descriptions, key statements, sameAs links. One-time setup with permanent compounding GEO value.',
    metrics: ['Entity completeness score', 'sameAs link count'],
    actions: ['Generate entity profile', 'Export Wikidata statements', 'Add sameAs links'],
    flavor: 'Entity Registry',
  },
  {
    id: 'schema-deploy',
    name: 'Schema Deploy',
    status: 'active',
    purpose: 'One JavaScript snippet on the customer website that injects dynamically-generated JSON-LD structured data from the Fact Vault. Every new fact added to the vault appears in schema within minutes. Works on any platform.',
    metrics: ['Deployed schema types', 'Fact coverage in schema'],
    actions: ['Copy deploy snippet', 'Preview schema output', 'Validate schema'],
    flavor: 'Schema Deploy',
  },
  {
    id: 'geo-lab',
    name: 'GEO Lab Results',
    status: 'active',
    purpose: 'Live findings from the L8EntSpace GEO Lab: real A/B experiments measuring which content tactics (statistical anchors, entity density, inverted pyramid, etc.) lift AI citation rate. Only statistically significant findings surface as recommendations, sorted by effect size.',
    metrics: ['Active findings count', 'Effect size (pp)', 'p-value', 'Null result count'],
    actions: ['Browse lab findings', 'Expand a finding for full recommendation', 'Apply lever to content via Content Scorer'],
    flavor: 'Experimental Evidence Vault',
  },
  {
    id: 'autopilot',
    name: 'Autopilot',
    status: 'active',
    purpose: 'Automated GEO task scheduling and execution. The complete probe→generate→publish→re-probe loop in one action. Targets a query, identifies what is being cited, generates counter-content, publishes it, and measures impact.',
    metrics: ['Autopilot runs', 'Citation rate delta per run'],
    actions: ['Configure autopilot schedule', 'Run full GEO loop'],
    flavor: 'GEO Autopilot',
  },
];

/** Returns only active tool IDs — used for the navigateToTab function declaration */
export function getActiveToolIds(): string[] {
  return DASHBOARD_TOOLS.filter(t => t.status !== 'deprecated').map(t => t.id);
}

/**
 * Formats the tool manifest as a numbered list for injection into a system instruction.
 * Active tools only; deprecated tools are silently excluded.
 */
export function buildToolsSection(): string {
  const active = DASHBOARD_TOOLS.filter(t => t.status !== 'deprecated');
  const lines = active.map((t, i) => {
    let line = `${i + 1}. ${t.id.padEnd(14)}: ${t.purpose}`;
    if (t.status === 'beta') line += ' [BETA]';
    return line;
  });
  return lines.join('\n');
}

/**
 * Returns the quest path section — the ordered workflow Citacious guides users through.
 * Kept here so a single edit updates both voice and text prompts.
 */
export function buildQuestPath(): string {
  return `0. CONFIGURE  → settings: brand name, domain, keywords, competitors
1. MEASURE    → cite-probe: establish baseline. What is my current citation rate?
2. BUILD MOAT → fact-vault: add verified brand Cite-Magnet facts (aim for 50+)
3. GENERATE   → agents: GEO-optimised articles for each uncited query
4. SCORE      → content-scorer: quality-check each article before publishing
5. SCHEMA     → technical (Schema Engine): set up JSON-LD injectors, audit AI crawlability
6. DEPLOY     → schema-deploy: push live; swap standard links for Shadow Links in JSON-LD
7. PROBE AGAIN → re-run cite-probe; expect improvement in 2–6 weeks
8. DEFEND     → monthly freshness updates; monitor via overview + geo-pulse`;
}

/**
 * Returns the tools-connection section explaining how modules feed each other.
 */
export function buildToolConnections(): string {
  return `- Fact Vault facts → injected into Agent Extract step as RAG context → improves article accuracy
- Agent articles → published on website → LLMs index → Citation Probe rate rises
- Citation Probe missed queries → content gaps → feed directly into Agent topic queue
- GEO Pulse drift detection → content decay alert → trigger freshness update
- Latent Space Map (Overview) → shows vault facts as real 768-D embeddings projected to 3D axes
- Content Scorer → grades content before publishing → flags low-entropy facts to fix
- Schema Deploy → Fact Vault changes appear in live JSON-LD within minutes`;
}
