/**
 * Local synonym dictionary — the zero-cost embedding backbone.
 *
 * Each entry is a synonym GROUP: a list of words that should be treated as
 * semantically equivalent. The local embedder maps every token to its group's
 * canonical key BEFORE feature-hashing, so "rapid", "fast" and "quick" all
 * collide into the same vector dimensions — giving semantic similarity with no
 * API call.
 *
 * This is deliberately weighted toward the GEO / business / SaaS / tech domain
 * the product operates in, plus a base of common English, so domain text embeds
 * with useful signal. Extend freely: more groups = better local recall.
 */

export const SYNONYM_GROUPS: string[][] = [
  // --- Speed / time ---
  ['fast', 'rapid', 'quick', 'swift', 'speedy', 'instant', 'immediate', 'prompt', 'expeditious'],
  ['slow', 'sluggish', 'gradual', 'delayed', 'lagging', 'laggy'],
  ['now', 'currently', 'presently', 'today', 'immediately'],
  ['often', 'frequently', 'regularly', 'repeatedly', 'commonly'],
  ['rarely', 'seldom', 'infrequently', 'occasionally'],
  ['always', 'constantly', 'continually', 'perpetually', 'persistently'],
  ['quickly', 'rapidly', 'swiftly', 'speedily', 'promptly'],

  // --- Magnitude / quantity ---
  ['big', 'large', 'huge', 'massive', 'enormous', 'vast', 'substantial', 'sizable', 'gigantic'],
  ['small', 'tiny', 'little', 'minor', 'minimal', 'compact', 'modest'],
  ['increase', 'grow', 'rise', 'boost', 'expand', 'climb', 'surge', 'escalate', 'amplify'],
  ['decrease', 'reduce', 'drop', 'decline', 'shrink', 'lower', 'cut', 'diminish', 'lessen'],
  ['many', 'numerous', 'multiple', 'several', 'countless', 'abundant'],
  ['few', 'scarce', 'limited', 'sparse', 'handful'],
  ['more', 'additional', 'extra', 'further', 'greater'],
  ['less', 'fewer', 'reduced', 'lower'],
  ['high', 'elevated', 'tall', 'lofty', 'steep'],
  ['low', 'reduced', 'depressed', 'shallow'],

  // --- Quality / value ---
  ['good', 'great', 'excellent', 'superb', 'outstanding', 'strong', 'solid', 'quality', 'superior'],
  ['bad', 'poor', 'weak', 'inferior', 'subpar', 'deficient', 'flawed'],
  ['best', 'top', 'leading', 'premier', 'foremost', 'finest', 'optimal'],
  ['worst', 'lowest', 'poorest'],
  ['important', 'critical', 'crucial', 'vital', 'essential', 'key', 'significant', 'pivotal'],
  ['useful', 'helpful', 'valuable', 'beneficial', 'advantageous', 'practical'],
  ['reliable', 'dependable', 'trustworthy', 'consistent', 'stable', 'robust'],
  ['accurate', 'precise', 'correct', 'exact', 'faithful', 'truthful'],
  ['efficient', 'effective', 'productive', 'streamlined', 'optimized'],
  ['powerful', 'potent', 'strong', 'mighty', 'formidable'],
  ['innovative', 'novel', 'cutting-edge', 'pioneering', 'groundbreaking', 'advanced'],
  ['secure', 'safe', 'protected', 'guarded', 'hardened'],
  ['scalable', 'extensible', 'elastic', 'flexible', 'adaptable'],

  // --- Business / SaaS ---
  ['company', 'business', 'firm', 'organization', 'enterprise', 'corporation', 'vendor', 'provider'],
  ['customer', 'client', 'user', 'buyer', 'consumer', 'subscriber', 'account'],
  ['product', 'solution', 'offering', 'platform', 'tool', 'service', 'software', 'app', 'application'],
  ['price', 'cost', 'pricing', 'fee', 'rate', 'charge', 'expense'],
  ['revenue', 'income', 'earnings', 'sales', 'turnover', 'proceeds'],
  ['profit', 'margin', 'gain', 'return', 'surplus'],
  ['market', 'industry', 'sector', 'space', 'segment', 'vertical', 'niche'],
  ['competitor', 'rival', 'challenger', 'alternative', 'incumbent'],
  ['feature', 'capability', 'function', 'functionality', 'option', 'tool'],
  ['startup', 'venture', 'scaleup'],
  ['founder', 'entrepreneur', 'creator', 'owner', 'ceo'],
  ['team', 'staff', 'workforce', 'personnel', 'crew', 'group'],
  ['strategy', 'plan', 'approach', 'roadmap', 'tactic', 'playbook'],
  ['growth', 'expansion', 'scaling', 'traction', 'momentum'],
  ['deal', 'contract', 'agreement', 'transaction', 'sale'],
  ['enterprise', 'corporate', 'business-grade', 'commercial'],
  ['subscription', 'plan', 'tier', 'membership', 'license'],
  ['onboarding', 'setup', 'activation', 'enrollment'],
  ['retention', 'loyalty', 'stickiness'],
  ['churn', 'attrition', 'cancellation', 'turnover'],

  // --- GEO / AI / search domain ---
  ['ai', 'artificial-intelligence', 'machine-intelligence'],
  ['llm', 'language-model', 'large-language-model', 'model', 'chatbot'],
  ['cite', 'citation', 'reference', 'mention', 'cited', 'referenced', 'sourced'],
  ['search', 'query', 'lookup', 'retrieval', 'find'],
  ['rank', 'ranking', 'position', 'placement', 'visibility'],
  ['optimize', 'optimise', 'tune', 'improve', 'refine', 'enhance'],
  ['content', 'copy', 'text', 'article', 'material', 'writing', 'document'],
  ['brand', 'name', 'identity', 'label', 'trademark'],
  ['answer', 'response', 'reply', 'output', 'result'],
  ['prompt', 'question', 'query', 'input', 'request'],
  ['embedding', 'vector', 'representation', 'encoding'],
  ['semantic', 'meaning', 'conceptual', 'contextual'],
  ['index', 'catalog', 'directory', 'registry'],
  ['crawl', 'scrape', 'fetch', 'ingest', 'harvest'],
  ['schema', 'structure', 'markup', 'metadata', 'json-ld'],
  ['authority', 'credibility', 'trust', 'reputation', 'standing'],
  ['fact', 'statement', 'claim', 'assertion', 'datum'],
  ['accuracy', 'precision', 'correctness', 'veracity', 'fidelity'],
  ['misinformation', 'falsehood', 'inaccuracy', 'error', 'mistake', 'untruth'],
  ['knowledge', 'information', 'data', 'intelligence', 'insight'],
  ['analysis', 'assessment', 'evaluation', 'review', 'audit', 'examination'],
  ['metric', 'measure', 'indicator', 'statistic', 'kpi', 'benchmark'],
  ['trend', 'pattern', 'trajectory', 'tendency', 'direction'],
  ['signal', 'indicator', 'cue', 'marker'],

  // --- Tech / engineering ---
  ['build', 'create', 'develop', 'construct', 'make', 'produce', 'generate'],
  ['deploy', 'release', 'ship', 'launch', 'publish', 'rollout'],
  ['code', 'software', 'program', 'script', 'source'],
  ['bug', 'defect', 'error', 'fault', 'issue', 'glitch'],
  ['fix', 'repair', 'resolve', 'patch', 'correct', 'remediate'],
  ['test', 'verify', 'validate', 'check', 'probe', 'examine'],
  ['data', 'information', 'dataset', 'records', 'figures'],
  ['database', 'store', 'datastore', 'repository', 'db'],
  ['api', 'endpoint', 'interface', 'service'],
  ['server', 'backend', 'host', 'infrastructure'],
  ['client', 'frontend', 'ui', 'interface'],
  ['network', 'connection', 'link', 'channel'],
  ['system', 'platform', 'framework', 'architecture', 'stack'],
  ['process', 'procedure', 'workflow', 'pipeline', 'routine'],
  ['automate', 'automation', 'automated', 'autonomous', 'self-running'],
  ['integrate', 'connect', 'link', 'combine', 'merge'],
  ['configure', 'setup', 'set-up', 'arrange', 'provision'],
  ['monitor', 'track', 'observe', 'watch', 'surveil'],
  ['secure', 'protect', 'safeguard', 'defend', 'shield'],
  ['encrypt', 'cipher', 'encode', 'scramble'],
  ['scale', 'grow', 'expand', 'extend'],
  ['performance', 'speed', 'throughput', 'efficiency', 'latency'],

  // --- Common verbs ---
  ['use', 'utilize', 'employ', 'leverage', 'apply', 'adopt'],
  ['help', 'assist', 'aid', 'support', 'enable', 'facilitate'],
  ['show', 'display', 'present', 'reveal', 'demonstrate', 'exhibit'],
  ['provide', 'offer', 'supply', 'deliver', 'furnish', 'give'],
  ['need', 'require', 'demand', 'necessitate'],
  ['want', 'desire', 'wish', 'seek'],
  ['get', 'obtain', 'acquire', 'gain', 'receive', 'secure'],
  ['find', 'discover', 'locate', 'identify', 'uncover', 'detect'],
  ['change', 'modify', 'alter', 'adjust', 'transform', 'revise'],
  ['start', 'begin', 'initiate', 'commence', 'launch'],
  ['stop', 'halt', 'cease', 'end', 'terminate'],
  ['allow', 'permit', 'enable', 'authorize', 'let'],
  ['prevent', 'block', 'stop', 'inhibit', 'avert'],
  ['compare', 'contrast', 'benchmark', 'measure'],
  ['choose', 'select', 'pick', 'opt', 'decide'],
  ['improve', 'enhance', 'better', 'upgrade', 'refine', 'elevate'],
  ['ensure', 'guarantee', 'assure', 'confirm'],
  ['reduce', 'minimize', 'lower', 'cut', 'trim'],
  ['prove', 'demonstrate', 'validate', 'verify', 'confirm', 'establish'],
  ['measure', 'quantify', 'gauge', 'assess'],

  // --- Descriptors / common ---
  ['new', 'fresh', 'recent', 'modern', 'latest', 'current', 'novel'],
  ['old', 'legacy', 'outdated', 'obsolete', 'dated', 'aging'],
  ['easy', 'simple', 'straightforward', 'effortless', 'intuitive'],
  ['hard', 'difficult', 'complex', 'complicated', 'challenging', 'tough'],
  ['real', 'genuine', 'authentic', 'actual', 'true', 'legitimate'],
  ['fake', 'false', 'artificial', 'simulated', 'fabricated', 'bogus'],
  ['clear', 'transparent', 'obvious', 'evident', 'apparent'],
  ['hidden', 'obscure', 'concealed', 'opaque'],
  ['open', 'public', 'accessible', 'available'],
  ['closed', 'private', 'restricted', 'proprietary'],
  ['unique', 'distinct', 'original', 'proprietary', 'exclusive', 'singular'],
  ['common', 'standard', 'typical', 'ordinary', 'usual', 'generic'],
  ['main', 'primary', 'principal', 'core', 'central', 'chief'],
  ['extra', 'additional', 'supplementary', 'secondary'],
  ['whole', 'entire', 'complete', 'full', 'total'],
  ['part', 'portion', 'segment', 'fraction', 'piece', 'component'],
];

/**
 * Reverse index: word -> canonical group key.
 * Built once at module load. The canonical key is the first word in the group.
 */
const WORD_TO_GROUP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const group of SYNONYM_GROUPS) {
    const canonical = group[0];
    for (const word of group) {
      map.set(word.toLowerCase(), canonical);
    }
  }
  return map;
})();

/** Total distinct words covered by the dictionary. */
export const SYNONYM_WORD_COUNT = WORD_TO_GROUP.size;

/**
 * Map a token to its synonym-group canonical key, or return the token unchanged
 * if it isn't in the dictionary. This is what makes synonyms collide into the
 * same embedding dimensions.
 */
export function canonicalize(token: string): string {
  return WORD_TO_GROUP.get(token.toLowerCase()) ?? token.toLowerCase();
}

/** Expand a token into its full synonym group (for query expansion use cases). */
export function expandSynonyms(token: string): string[] {
  const canonical = WORD_TO_GROUP.get(token.toLowerCase());
  if (!canonical) return [token.toLowerCase()];
  return SYNONYM_GROUPS.find(g => g[0] === canonical) ?? [token.toLowerCase()];
}
