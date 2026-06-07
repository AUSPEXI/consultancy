/**
 * Local synonym dictionary — the zero-cost embedding backbone.
 *
 * Each entry is a synonym GROUP: a list of words that should be treated as
 * semantically equivalent. The local embedder maps every token to its group's
 * canonical key BEFORE feature-hashing, so "rapid", "fast" and "quick" all
 * collide into the same vector dimensions — giving semantic similarity with no
 * API call.
 *
 * Weighted toward GEO / SaaS / AI / business / marketing domain text.
 * Extend freely: more groups = better local recall.
 *
 * Use the alignment score (cosine of local vs API vector for the same fact)
 * to find which concepts are poorly covered — those need more synonym entries.
 */

export const SYNONYM_GROUPS: string[][] = [

  // ─────────────────────────────────────────────
  // SPEED / TIME / FREQUENCY
  // ─────────────────────────────────────────────
  ['fast', 'rapid', 'quick', 'swift', 'speedy', 'instant', 'immediate', 'prompt', 'expeditious', 'nimble', 'brisk'],
  ['slow', 'sluggish', 'gradual', 'delayed', 'lagging', 'laggy', 'leisurely', 'plodding', 'tardy'],
  ['now', 'currently', 'presently', 'today', 'immediately', 'instantly', 'at-once', 'right-away'],
  ['soon', 'shortly', 'imminently', 'before-long', 'in-a-moment', 'upcoming', 'forthcoming'],
  ['late', 'overdue', 'behind', 'delayed', 'deferred', 'postponed', 'belated'],
  ['early', 'ahead', 'preliminary', 'initial', 'first', 'prior', 'advance'],
  ['often', 'frequently', 'regularly', 'repeatedly', 'commonly', 'routinely', 'habitually'],
  ['rarely', 'seldom', 'infrequently', 'occasionally', 'sporadically', 'uncommonly'],
  ['always', 'constantly', 'continually', 'perpetually', 'persistently', 'invariably', 'unfailingly'],
  ['never', 'not-ever', 'at-no-time', 'without-exception'],
  ['temporary', 'transient', 'fleeting', 'brief', 'short-lived', 'provisional', 'interim'],
  ['permanent', 'lasting', 'enduring', 'persistent', 'durable', 'long-term', 'indefinite'],
  ['annual', 'yearly', 'per-year'],
  ['monthly', 'per-month', 'month-over-month'],
  ['weekly', 'per-week'],
  ['daily', 'everyday', 'per-day'],
  ['real-time', 'live', 'streaming', 'instant', 'on-demand'],

  // ─────────────────────────────────────────────
  // MAGNITUDE / QUANTITY / DEGREE
  // ─────────────────────────────────────────────
  ['big', 'large', 'huge', 'massive', 'enormous', 'vast', 'substantial', 'sizable', 'gigantic', 'immense', 'extensive'],
  ['small', 'tiny', 'little', 'minor', 'minimal', 'compact', 'modest', 'micro', 'nano', 'slight'],
  ['increase', 'grow', 'rise', 'boost', 'expand', 'climb', 'surge', 'escalate', 'amplify', 'scale-up', 'uptick', 'upturn', 'jump'],
  ['decrease', 'reduce', 'drop', 'decline', 'shrink', 'lower', 'cut', 'diminish', 'lessen', 'dip', 'downtick', 'contract'],
  ['many', 'numerous', 'multiple', 'several', 'countless', 'abundant', 'plentiful', 'myriad', 'various', 'diverse'],
  ['few', 'scarce', 'limited', 'sparse', 'handful', 'rare', 'infrequent'],
  ['more', 'additional', 'extra', 'further', 'greater', 'increased', 'higher', 'elevated'],
  ['less', 'fewer', 'reduced', 'lower', 'decreased', 'diminished'],
  ['high', 'elevated', 'tall', 'lofty', 'steep', 'peak', 'top'],
  ['low', 'reduced', 'depressed', 'shallow', 'bottom', 'minimal'],
  ['maximum', 'max', 'peak', 'ceiling', 'cap', 'top', 'highest', 'extreme', 'most'],
  ['minimum', 'min', 'floor', 'bottom', 'baseline', 'lowest', 'least', 'threshold'],
  ['average', 'mean', 'median', 'typical', 'standard', 'moderate', 'midpoint'],
  ['significant', 'substantial', 'considerable', 'notable', 'meaningful', 'material', 'major', 'marked'],
  ['negligible', 'marginal', 'trivial', 'minor', 'inconsequential', 'small', 'slight'],
  ['total', 'sum', 'aggregate', 'cumulative', 'combined', 'overall', 'gross', 'all'],
  ['partial', 'portion', 'fraction', 'part', 'component', 'subset', 'segment', 'slice'],
  ['double', 'twice', '2x', 'twofold', 'duplicate', 'two-fold'],
  ['triple', 'three-times', '3x', 'threefold'],
  ['half', 'fifty-percent', '50%', 'partial', 'midpoint'],

  // ─────────────────────────────────────────────
  // QUALITY / VALUE / PERFORMANCE
  // ─────────────────────────────────────────────
  ['good', 'great', 'excellent', 'superb', 'outstanding', 'strong', 'solid', 'quality', 'superior', 'exceptional', 'fine'],
  ['bad', 'poor', 'weak', 'inferior', 'subpar', 'deficient', 'flawed', 'faulty', 'inadequate', 'terrible'],
  ['best', 'top', 'leading', 'premier', 'foremost', 'finest', 'optimal', 'number-one', 'gold-standard', 'elite'],
  ['worst', 'lowest', 'poorest', 'least', 'bottom', 'last'],
  ['important', 'critical', 'crucial', 'vital', 'essential', 'key', 'significant', 'pivotal', 'central', 'fundamental', 'core', 'paramount'],
  ['useful', 'helpful', 'valuable', 'beneficial', 'advantageous', 'practical', 'instrumental', 'productive'],
  ['useless', 'unhelpful', 'worthless', 'ineffective', 'pointless', 'irrelevant'],
  ['reliable', 'dependable', 'trustworthy', 'consistent', 'stable', 'robust', 'dependable', 'rock-solid', 'resilient'],
  ['unreliable', 'unstable', 'inconsistent', 'erratic', 'fragile', 'flaky'],
  ['accurate', 'precise', 'correct', 'exact', 'faithful', 'truthful', 'rigorous', 'on-target', 'sound'],
  ['inaccurate', 'incorrect', 'wrong', 'false', 'erroneous', 'off-target', 'mistaken'],
  ['efficient', 'effective', 'productive', 'streamlined', 'optimized', 'lean', 'tight'],
  ['inefficient', 'wasteful', 'slow', 'bloated', 'redundant', 'unproductive'],
  ['powerful', 'potent', 'strong', 'mighty', 'formidable', 'capable', 'robust', 'force'],
  ['innovative', 'novel', 'cutting-edge', 'pioneering', 'groundbreaking', 'advanced', 'next-gen', 'disruptive', 'state-of-the-art', 'breakthrough'],
  ['outdated', 'legacy', 'old-fashioned', 'obsolete', 'stale', 'dated', 'archaic', 'antiquated'],
  ['secure', 'safe', 'protected', 'guarded', 'hardened', 'fortified', 'locked', 'encrypted'],
  ['insecure', 'vulnerable', 'exposed', 'at-risk', 'unprotected', 'weak'],
  ['scalable', 'extensible', 'elastic', 'flexible', 'adaptable', 'expandable', 'growable'],
  ['complex', 'complicated', 'intricate', 'sophisticated', 'advanced', 'multi-layered', 'nuanced'],
  ['simple', 'easy', 'basic', 'plain', 'elementary', 'uncomplicated', 'intuitive', 'lightweight'],
  ['transparent', 'clear', 'open', 'explicit', 'visible', 'honest', 'forthright', 'straightforward'],
  ['opaque', 'unclear', 'hidden', 'obscure', 'vague', 'ambiguous', 'murky'],

  // ─────────────────────────────────────────────
  // BUSINESS / COMPANY / ORGANISATION
  // ─────────────────────────────────────────────
  ['company', 'business', 'firm', 'organization', 'enterprise', 'corporation', 'vendor', 'provider', 'entity', 'outfit', 'agency', 'establishment'],
  ['startup', 'venture', 'scaleup', 'early-stage', 'new-company', 'bootstrapped'],
  ['founder', 'entrepreneur', 'creator', 'owner', 'ceo', 'co-founder', 'builder'],
  ['executive', 'leader', 'director', 'officer', 'c-suite', 'principal'],
  ['manager', 'supervisor', 'head', 'lead', 'overseer', 'coordinator'],
  ['team', 'staff', 'workforce', 'personnel', 'crew', 'group', 'squad', 'talent'],
  ['employee', 'worker', 'colleague', 'associate', 'hire', 'person', 'member'],
  ['partner', 'collaborator', 'ally', 'affiliate', 'stakeholder', 'co-worker'],
  ['investor', 'backer', 'funder', 'financier', 'shareholder', 'vc', 'angel'],
  ['customer', 'client', 'user', 'buyer', 'consumer', 'subscriber', 'account', 'patron'],
  ['prospect', 'lead', 'candidate', 'potential-customer', 'opportunity', 'contact'],
  ['competitor', 'rival', 'challenger', 'alternative', 'incumbent', 'opposition'],
  ['industry', 'sector', 'market', 'space', 'segment', 'vertical', 'niche', 'arena', 'domain'],
  ['headquarters', 'hq', 'office', 'base', 'location', 'hub'],
  ['department', 'division', 'unit', 'function', 'group', 'team', 'section'],
  ['subsidiary', 'affiliate', 'branch', 'division', 'arm'],
  ['strategy', 'plan', 'approach', 'roadmap', 'tactic', 'playbook', 'blueprint', 'framework', 'methodology'],
  ['mission', 'vision', 'purpose', 'goal', 'objective', 'aim', 'target'],
  ['value', 'benefit', 'advantage', 'gain', 'payoff', 'return', 'upside'],
  ['risk', 'threat', 'danger', 'exposure', 'vulnerability', 'liability', 'downside'],
  ['opportunity', 'chance', 'opening', 'possibility', 'potential', 'upside'],
  ['challenge', 'problem', 'obstacle', 'barrier', 'difficulty', 'issue', 'hurdle', 'blocker'],
  ['process', 'procedure', 'workflow', 'pipeline', 'routine', 'method', 'system', 'approach'],
  ['policy', 'rule', 'guideline', 'regulation', 'standard', 'procedure', 'protocol'],
  ['compliance', 'regulation', 'governance', 'adherence', 'conformance', 'audit'],

  // ─────────────────────────────────────────────
  // SAAS / PRODUCT / TECHNOLOGY
  // ─────────────────────────────────────────────
  ['product', 'solution', 'offering', 'platform', 'tool', 'service', 'software', 'app', 'application', 'suite'],
  ['feature', 'capability', 'function', 'functionality', 'option', 'module', 'component'],
  ['integration', 'connector', 'plugin', 'extension', 'addon', 'hook', 'bridge', 'link'],
  ['subscription', 'plan', 'tier', 'membership', 'license', 'package'],
  ['onboarding', 'setup', 'activation', 'enrollment', 'implementation', 'deployment'],
  ['retention', 'loyalty', 'stickiness', 'engagement', 'usage'],
  ['churn', 'attrition', 'cancellation', 'turnover', 'dropout', 'lapse'],
  ['upgrade', 'upsell', 'expansion', 'tier-increase', 'plan-change'],
  ['downgrade', 'tier-decrease', 'plan-reduction'],
  ['trial', 'demo', 'proof-of-concept', 'poc', 'pilot', 'free-trial'],
  ['freemium', 'free-tier', 'free-plan', 'basic-free'],
  ['api', 'endpoint', 'interface', 'service', 'route', 'webhook', 'rest'],
  ['dashboard', 'console', 'panel', 'interface', 'ui', 'control-panel', 'admin'],
  ['report', 'export', 'output', 'summary', 'analytics', 'insight', 'digest'],
  ['notification', 'alert', 'message', 'signal', 'warning', 'ping', 'reminder'],
  ['automation', 'workflow', 'trigger', 'action', 'sequence', 'flow', 'pipeline'],
  ['template', 'preset', 'default', 'boilerplate', 'scaffold', 'starter'],
  ['customization', 'configuration', 'personalization', 'tailoring', 'tuning'],
  ['permission', 'access', 'role', 'right', 'entitlement', 'privilege'],
  ['admin', 'administrator', 'superuser', 'root', 'owner', 'super-admin'],
  ['user', 'end-user', 'account', 'profile', 'member', 'identity'],
  ['session', 'login', 'auth', 'authentication', 'sign-in', 'access'],

  // ─────────────────────────────────────────────
  // FINANCE / REVENUE / PRICING
  // ─────────────────────────────────────────────
  ['price', 'cost', 'pricing', 'fee', 'rate', 'charge', 'expense', 'tariff', 'amount'],
  ['revenue', 'income', 'earnings', 'sales', 'turnover', 'proceeds', 'top-line', 'receipts'],
  ['profit', 'margin', 'gain', 'return', 'surplus', 'net', 'take-home', 'bottom-line'],
  ['loss', 'deficit', 'shortfall', 'negative', 'red', 'liability'],
  ['budget', 'spend', 'expenditure', 'cost', 'allocation', 'outlay'],
  ['investment', 'funding', 'capital', 'spend', 'backing', 'finance'],
  ['roi', 'return', 'payback', 'yield', 'payoff', 'return-on-investment'],
  ['growth', 'expansion', 'scaling', 'traction', 'momentum', 'progress', 'advancement'],
  ['valuation', 'value', 'worth', 'price', 'market-cap', 'assessment'],
  ['runway', 'cash-runway', 'months-left', 'burn-rate', 'timeline'],
  ['mrr', 'monthly-recurring-revenue', 'monthly-revenue', 'monthly-arr'],
  ['arr', 'annual-recurring-revenue', 'annual-revenue'],
  ['ltv', 'lifetime-value', 'customer-lifetime-value', 'clv'],
  ['cac', 'customer-acquisition-cost', 'acquisition-cost', 'cost-to-acquire'],
  ['deal', 'contract', 'agreement', 'transaction', 'sale', 'close', 'win'],
  ['invoice', 'bill', 'charge', 'payment', 'receipt'],
  ['discount', 'reduction', 'offer', 'deal', 'rebate', 'coupon', 'promo'],
  ['premium', 'paid', 'pro', 'enterprise', 'top-tier'],
  ['free', 'no-cost', 'zero-cost', 'complimentary', 'gratis', 'open'],

  // ─────────────────────────────────────────────
  // GEO / AI / SEARCH / CITATION
  // ─────────────────────────────────────────────
  ['ai', 'artificial-intelligence', 'machine-intelligence', 'ml', 'machine-learning'],
  ['llm', 'language-model', 'large-language-model', 'foundation-model', 'chatbot', 'model', 'generative-ai', 'genai'],
  ['cite', 'citation', 'reference', 'mention', 'cited', 'referenced', 'sourced', 'attribute', 'attributed'],
  ['search', 'query', 'lookup', 'retrieval', 'find', 'seek', 'explore', 'browse'],
  ['rank', 'ranking', 'position', 'placement', 'visibility', 'standing', 'prominence'],
  ['seo', 'search-engine-optimization', 'organic-search', 'search-ranking'],
  ['geo', 'generative-engine-optimization', 'llm-seo', 'ai-seo', 'answer-engine-optimization', 'aeo'],
  ['optimize', 'optimise', 'tune', 'improve', 'refine', 'enhance', 'fine-tune', 'calibrate'],
  ['content', 'copy', 'text', 'article', 'material', 'writing', 'document', 'piece'],
  ['brand', 'name', 'identity', 'label', 'trademark', 'mark', 'moniker'],
  ['answer', 'response', 'reply', 'output', 'result', 'return', 'generation'],
  ['prompt', 'question', 'query', 'input', 'request', 'instruction', 'command'],
  ['embedding', 'vector', 'representation', 'encoding', 'embedding-vector'],
  ['semantic', 'meaning', 'conceptual', 'contextual', 'meaning-based', 'deep'],
  ['index', 'catalog', 'directory', 'registry', 'corpus', 'store', 'knowledge-base'],
  ['crawl', 'scrape', 'fetch', 'ingest', 'harvest', 'extract', 'collect'],
  ['schema', 'structure', 'markup', 'metadata', 'json-ld', 'structured-data'],
  ['authority', 'credibility', 'trust', 'reputation', 'standing', 'expertise', 'domain-authority', 'trustworthiness'],
  ['fact', 'statement', 'claim', 'assertion', 'datum', 'truth', 'point', 'information'],
  ['accuracy', 'precision', 'correctness', 'veracity', 'fidelity', 'truthfulness'],
  ['misinformation', 'falsehood', 'inaccuracy', 'error', 'mistake', 'untruth', 'hallucination', 'fabrication'],
  ['knowledge', 'information', 'data', 'intelligence', 'insight', 'learning', 'awareness'],
  ['analysis', 'assessment', 'evaluation', 'review', 'audit', 'examination', 'study', 'research'],
  ['metric', 'measure', 'indicator', 'statistic', 'kpi', 'benchmark', 'gauge', 'signal'],
  ['trend', 'pattern', 'trajectory', 'tendency', 'direction', 'movement', 'shift'],
  ['signal', 'indicator', 'cue', 'marker', 'hint', 'clue'],
  ['sov', 'share-of-voice', 'visibility', 'presence', 'coverage', 'dominance'],
  ['citation-rate', 'mention-rate', 'reference-rate', 'coverage-rate'],
  ['hallucination', 'confabulation', 'fabrication', 'invention', 'make-up'],
  ['context-window', 'context', 'context-length', 'token-limit'],
  ['token', 'word', 'subword', 'piece', 'unit'],
  ['inference', 'generation', 'prediction', 'output'],
  ['fine-tune', 'fine-tuning', 'rlhf', 'instruction-tune', 'adapter'],
  ['retrieval-augmented-generation', 'rag', 'retrieval', 'grounding'],
  ['agent', 'autonomous-agent', 'ai-agent', 'bot', 'worker', 'orchestrator'],

  // ─────────────────────────────────────────────
  // TECH / ENGINEERING / DATA
  // ─────────────────────────────────────────────
  ['build', 'create', 'develop', 'construct', 'make', 'produce', 'generate', 'craft', 'ship'],
  ['deploy', 'release', 'ship', 'launch', 'publish', 'rollout', 'go-live', 'push'],
  ['code', 'software', 'program', 'script', 'source', 'codebase', 'repo'],
  ['bug', 'defect', 'error', 'fault', 'issue', 'glitch', 'regression', 'flaw'],
  ['fix', 'repair', 'resolve', 'patch', 'correct', 'remediate', 'hotfix', 'workaround'],
  ['test', 'verify', 'validate', 'check', 'probe', 'examine', 'qa', 'assert'],
  ['data', 'information', 'dataset', 'records', 'figures', 'raw-data', 'input'],
  ['database', 'store', 'datastore', 'repository', 'db', 'firestore', 'collection'],
  ['cache', 'buffer', 'temporary-store', 'memoize', 'precompute'],
  ['server', 'backend', 'host', 'infrastructure', 'compute', 'instance'],
  ['client', 'frontend', 'ui', 'browser', 'app-client'],
  ['network', 'connection', 'link', 'channel', 'route', 'path'],
  ['system', 'platform', 'framework', 'architecture', 'stack', 'environment'],
  ['automate', 'automation', 'automated', 'autonomous', 'self-running', 'hands-free'],
  ['integrate', 'connect', 'link', 'combine', 'merge', 'bridge', 'sync'],
  ['configure', 'setup', 'set-up', 'arrange', 'provision', 'initialize', 'install'],
  ['monitor', 'track', 'observe', 'watch', 'log', 'trace', 'record', 'audit'],
  ['encrypt', 'cipher', 'encode', 'scramble', 'hash', 'protect'],
  ['scale', 'grow', 'expand', 'handle-load', 'horizontally-scale'],
  ['performance', 'speed', 'throughput', 'efficiency', 'latency', 'benchmark'],
  ['version', 'release', 'iteration', 'update', 'revision', 'build'],
  ['migration', 'upgrade', 'transition', 'move', 'port'],
  ['documentation', 'docs', 'readme', 'guide', 'manual', 'reference', 'spec'],
  ['open-source', 'oss', 'public', 'community', 'github'],
  ['cloud', 'hosted', 'saas', 'managed', 'aws', 'gcp', 'azure'],
  ['on-premise', 'self-hosted', 'local', 'private'],
  ['batch', 'bulk', 'group', 'set', 'collection'],
  ['real-time', 'streaming', 'live', 'synchronous', 'instant'],
  ['async', 'asynchronous', 'background', 'non-blocking', 'queued'],
  ['latency', 'delay', 'lag', 'response-time', 'round-trip'],
  ['throughput', 'capacity', 'bandwidth', 'volume', 'rate'],
  ['uptime', 'availability', 'reliability', 'sla', 'uptime-guarantee'],
  ['downtime', 'outage', 'incident', 'disruption', 'failure'],
  ['log', 'trace', 'event', 'entry', 'record', 'audit-log'],
  ['error', 'exception', 'failure', 'fault', 'crash', 'timeout'],
  ['input', 'request', 'payload', 'body', 'data-in'],
  ['output', 'response', 'result', 'return', 'data-out'],

  // ─────────────────────────────────────────────
  // MARKETING / CONTENT / GROWTH
  // ─────────────────────────────────────────────
  ['marketing', 'promotion', 'advertising', 'outreach', 'campaign', 'comms'],
  ['campaign', 'initiative', 'programme', 'push', 'effort', 'drive'],
  ['audience', 'target', 'demographic', 'readers', 'viewers', 'followers'],
  ['engagement', 'interaction', 'activity', 'involvement', 'participation', 'reaction'],
  ['impression', 'view', 'exposure', 'reach', 'visibility'],
  ['conversion', 'signup', 'sale', 'action', 'goal-completion'],
  ['funnel', 'pipeline', 'journey', 'path', 'flow'],
  ['awareness', 'recognition', 'visibility', 'recall', 'familiarity'],
  ['click', 'tap', 'press', 'interaction', 'select'],
  ['traffic', 'visits', 'sessions', 'users', 'pageviews'],
  ['organic', 'natural', 'earned', 'unpaid'],
  ['paid', 'sponsored', 'promoted', 'advertised'],
  ['social', 'social-media', 'community', 'network', 'platform'],
  ['viral', 'shareable', 'trending', 'popular', 'spread', 'reach'],
  ['brand-awareness', 'brand-recognition', 'brand-recall', 'top-of-mind'],
  ['copywriting', 'copy', 'messaging', 'narrative', 'text', 'writing'],
  ['headline', 'title', 'hook', 'opener', 'subject-line'],
  ['call-to-action', 'cta', 'prompt', 'invitation', 'ask'],
  ['landing-page', 'page', 'lp', 'destination'],
  ['email', 'email-marketing', 'newsletter', 'outreach', 'mail'],
  ['seo-content', 'blog-post', 'article', 'piece', 'listicle'],
  ['backlink', 'link', 'inbound-link', 'referral-link'],
  ['keyword', 'search-term', 'query-term', 'topic', 'phrase'],
  ['persona', 'icp', 'ideal-customer', 'buyer-persona', 'profile'],

  // ─────────────────────────────────────────────
  // ANALYTICS / MEASUREMENT / DATA
  // ─────────────────────────────────────────────
  ['analytics', 'reporting', 'data', 'insights', 'intelligence', 'telemetry'],
  ['dashboard', 'report', 'view', 'chart', 'visualization', 'graph'],
  ['kpi', 'key-performance-indicator', 'metric', 'measure', 'target', 'goal'],
  ['baseline', 'benchmark', 'reference', 'starting-point', 'ground-truth'],
  ['forecast', 'prediction', 'projection', 'estimate', 'outlook', 'outlook'],
  ['anomaly', 'outlier', 'spike', 'dip', 'deviation', 'irregularity'],
  ['cohort', 'segment', 'group', 'subset', 'bucket'],
  ['retention-rate', 'keep-rate', 'stick-rate', 'stay-rate'],
  ['open-rate', 'click-rate', 'engagement-rate', 'response-rate'],
  ['accuracy-metric', 'precision-metric', 'recall-metric', 'f1-score'],
  ['test', 'experiment', 'a-b-test', 'split-test', 'trial', 'study'],
  ['statistical-significance', 'significance', 'p-value', 'confidence'],
  ['correlation', 'relationship', 'association', 'link', 'connection'],
  ['causation', 'cause', 'driver', 'factor', 'root-cause'],
  ['distribution', 'spread', 'variance', 'range', 'dispersion'],

  // ─────────────────────────────────────────────
  // COMMUNICATION / LANGUAGE / CONTENT
  // ─────────────────────────────────────────────
  ['say', 'state', 'declare', 'express', 'articulate', 'convey', 'communicate', 'voice'],
  ['ask', 'inquire', 'question', 'request', 'query', 'probe'],
  ['explain', 'describe', 'detail', 'elaborate', 'clarify', 'outline', 'illustrate'],
  ['summarize', 'condense', 'recap', 'distill', 'synopsis', 'abstract'],
  ['report', 'document', 'record', 'log', 'note', 'write-up'],
  ['announce', 'declare', 'publish', 'release', 'broadcast', 'notify'],
  ['recommend', 'suggest', 'advise', 'propose', 'endorse', 'advocate'],
  ['feedback', 'comment', 'review', 'response', 'input', 'opinion'],
  ['story', 'narrative', 'case-study', 'example', 'anecdote', 'scenario'],
  ['tone', 'voice', 'style', 'personality', 'brand-voice'],
  ['message', 'communication', 'note', 'signal', 'statement'],
  ['language', 'wording', 'phrasing', 'terminology', 'vocabulary'],
  ['abbreviation', 'acronym', 'shorthand', 'initialism'],

  // ─────────────────────────────────────────────
  // RELATIONSHIPS / SOCIAL / TRUST
  // ─────────────────────────────────────────────
  ['trust', 'confidence', 'belief', 'faith', 'credibility', 'reliability'],
  ['relationship', 'connection', 'bond', 'association', 'link', 'partnership'],
  ['community', 'network', 'group', 'ecosystem', 'user-base', 'audience'],
  ['collaboration', 'cooperation', 'partnership', 'teamwork', 'joint', 'together'],
  ['support', 'help', 'assist', 'aid', 'service', 'care', 'guidance'],
  ['advocate', 'champion', 'promoter', 'ambassador', 'evangelist'],
  ['reputation', 'standing', 'credibility', 'image', 'brand-image', 'track-record'],
  ['loyalty', 'devotion', 'commitment', 'allegiance', 'stickiness'],

  // ─────────────────────────────────────────────
  // LEGAL / COMPLIANCE / GOVERNANCE
  // ─────────────────────────────────────────────
  ['legal', 'lawful', 'compliant', 'legitimate', 'permitted', 'authorized'],
  ['illegal', 'unlawful', 'prohibited', 'banned', 'restricted', 'forbidden'],
  ['agreement', 'contract', 'terms', 'sla', 'msa', 'tos', 'deal'],
  ['privacy', 'data-privacy', 'gdpr', 'confidentiality', 'personal-data'],
  ['security', 'protection', 'safety', 'safeguard', 'cyber-security'],
  ['audit', 'review', 'inspection', 'check', 'examination', 'soc2', 'compliance-check'],
  ['permission', 'consent', 'authorization', 'approval', 'sign-off'],
  ['regulation', 'rule', 'law', 'mandate', 'requirement', 'standard'],
  ['liability', 'risk', 'exposure', 'obligation', 'responsibility'],

  // ─────────────────────────────────────────────
  // LEARNING / EDUCATION / RESEARCH
  // ─────────────────────────────────────────────
  ['learn', 'study', 'research', 'investigate', 'explore', 'understand', 'discover'],
  ['teach', 'train', 'educate', 'instruct', 'guide', 'mentor', 'coach'],
  ['experiment', 'test', 'trial', 'pilot', 'probe', 'study', 'research'],
  ['hypothesis', 'theory', 'assumption', 'premise', 'proposition'],
  ['evidence', 'proof', 'data', 'support', 'backing', 'validation'],
  ['insight', 'finding', 'discovery', 'conclusion', 'observation', 'takeaway'],
  ['document', 'paper', 'report', 'study', 'publication', 'whitepaper'],
  ['case-study', 'example', 'use-case', 'scenario', 'application'],
  ['guide', 'tutorial', 'manual', 'handbook', 'playbook', 'documentation'],

  // ─────────────────────────────────────────────
  // ACTIONS — CORE VERBS
  // ─────────────────────────────────────────────
  ['use', 'utilize', 'employ', 'leverage', 'apply', 'adopt', 'work-with'],
  ['help', 'assist', 'aid', 'support', 'enable', 'facilitate', 'empower'],
  ['show', 'display', 'present', 'reveal', 'demonstrate', 'exhibit', 'surface'],
  ['provide', 'offer', 'supply', 'deliver', 'furnish', 'give', 'present'],
  ['need', 'require', 'demand', 'necessitate', 'call-for', 'depend-on'],
  ['want', 'desire', 'wish', 'seek', 'look-for', 'aim-for'],
  ['get', 'obtain', 'acquire', 'gain', 'receive', 'secure', 'access', 'fetch'],
  ['find', 'discover', 'locate', 'identify', 'uncover', 'detect', 'surface'],
  ['change', 'modify', 'alter', 'adjust', 'transform', 'revise', 'update', 'shift'],
  ['start', 'begin', 'initiate', 'commence', 'launch', 'kick-off', 'open'],
  ['stop', 'halt', 'cease', 'end', 'terminate', 'pause', 'discontinue'],
  ['allow', 'permit', 'enable', 'authorize', 'let', 'approve', 'grant'],
  ['prevent', 'block', 'stop', 'inhibit', 'avert', 'avoid', 'mitigate'],
  ['compare', 'contrast', 'benchmark', 'measure', 'assess', 'evaluate'],
  ['choose', 'select', 'pick', 'opt', 'decide', 'prefer', 'go-with'],
  ['improve', 'enhance', 'better', 'upgrade', 'refine', 'elevate', 'optimize', 'boost'],
  ['ensure', 'guarantee', 'assure', 'confirm', 'verify', 'make-sure'],
  ['reduce', 'minimize', 'lower', 'cut', 'trim', 'decrease', 'shrink'],
  ['prove', 'demonstrate', 'validate', 'verify', 'confirm', 'establish', 'substantiate'],
  ['measure', 'quantify', 'gauge', 'assess', 'track', 'record'],
  ['share', 'distribute', 'spread', 'send', 'pass-along', 'circulate'],
  ['save', 'store', 'preserve', 'retain', 'keep', 'persist'],
  ['delete', 'remove', 'clear', 'erase', 'drop', 'clean'],
  ['connect', 'link', 'join', 'bridge', 'integrate', 'wire'],
  ['move', 'migrate', 'transfer', 'shift', 'relocate', 'port'],
  ['run', 'execute', 'perform', 'carry-out', 'operate', 'fire'],
  ['load', 'fetch', 'retrieve', 'pull', 'import', 'ingest'],
  ['export', 'send', 'push', 'download', 'extract', 'output'],
  ['review', 'check', 'inspect', 'examine', 'audit', 'scan', 'read'],
  ['approve', 'accept', 'confirm', 'sign-off', 'validate', 'greenlight'],
  ['reject', 'deny', 'decline', 'refuse', 'dismiss', 'block'],
  ['track', 'follow', 'watch', 'monitor', 'observe', 'trace'],
  ['solve', 'fix', 'resolve', 'address', 'handle', 'tackle', 'remediate'],
  ['scale', 'grow', 'expand', 'increase', 'amplify'],
  ['publish', 'post', 'release', 'share', 'broadcast', 'announce'],
  ['purchase', 'buy', 'acquire', 'procure', 'get', 'pay-for'],
  ['install', 'set-up', 'configure', 'provision', 'deploy'],
  ['authenticate', 'login', 'verify', 'authorize', 'sign-in'],

  // ─────────────────────────────────────────────
  // DESCRIPTORS / PROPERTIES
  // ─────────────────────────────────────────────
  ['new', 'fresh', 'recent', 'modern', 'latest', 'current', 'novel', 'updated', 'up-to-date'],
  ['old', 'legacy', 'outdated', 'obsolete', 'dated', 'aging', 'prior', 'previous'],
  ['real', 'genuine', 'authentic', 'actual', 'true', 'legitimate', 'verified', 'factual'],
  ['fake', 'false', 'artificial', 'simulated', 'fabricated', 'bogus', 'synthetic'],
  ['open', 'public', 'accessible', 'available', 'free', 'open-source'],
  ['closed', 'private', 'restricted', 'proprietary', 'paid', 'locked'],
  ['unique', 'distinct', 'original', 'exclusive', 'singular', 'one-of-a-kind', 'novel'],
  ['common', 'standard', 'typical', 'ordinary', 'usual', 'generic', 'default'],
  ['main', 'primary', 'principal', 'core', 'central', 'chief', 'primary', 'main'],
  ['extra', 'additional', 'supplementary', 'secondary', 'optional', 'bonus'],
  ['whole', 'entire', 'complete', 'full', 'total', 'comprehensive', 'end-to-end'],
  ['automatic', 'automated', 'auto', 'autonomous', 'self', 'hands-free'],
  ['manual', 'human', 'hand-held', 'user-driven', 'prompted'],
  ['global', 'worldwide', 'universal', 'international', 'cross-border'],
  ['local', 'regional', 'geo-local', 'on-premise', 'nearby'],
  ['mobile', 'phone', 'app', 'responsive', 'handheld', 'smartphone'],
  ['desktop', 'pc', 'computer', 'workstation', 'web'],
  ['live', 'production', 'active', 'running', 'deployed', 'online'],
  ['test', 'staging', 'sandbox', 'dev', 'development'],
  ['verbose', 'detailed', 'comprehensive', 'in-depth', 'thorough', 'rich'],
  ['concise', 'brief', 'short', 'succinct', 'compact', 'tight'],
  ['structured', 'organized', 'ordered', 'systematic', 'formatted'],
  ['unstructured', 'raw', 'loose', 'free-form', 'unformatted'],
  ['actionable', 'practical', 'applicable', 'usable', 'implementable'],
  ['deprecated', 'removed', 'deleted', 'retired', 'sunset', 'end-of-life'],
  ['experimental', 'beta', 'preview', 'alpha', 'early-access', 'prototype'],
  ['stable', 'production-ready', 'mature', 'ga', 'general-availability'],
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

/** Total groups in the dictionary. */
export const SYNONYM_GROUP_COUNT = SYNONYM_GROUPS.length;

/**
 * Map a token to its synonym-group canonical key, or return the token unchanged
 * if it isn't in the dictionary.
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
