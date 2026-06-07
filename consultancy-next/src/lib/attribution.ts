/**
 * Closed-loop citation attribution.
 *
 * When a citation probe completes, this correlates the change in citation
 * outcomes against the facts and articles the user added since their previous
 * probe. It deliberately claims CORRELATION, not causation: "these were
 * published in the window where query X started getting cited, and their
 * content overlaps that query." The UI must frame it the same way.
 *
 * No model calls, no fabrication — pure timestamp windowing + keyword overlap
 * over data the user actually created.
 */

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'this', 'that', 'with', 'they', 'have', 'from',
  'your', 'been', 'were', 'said', 'each', 'which', 'their', 'will', 'about',
  'would', 'there', 'could', 'other', 'into', 'more', 'also', 'than', 'them',
  'then', 'some', 'these', 'when', 'what', 'where', 'who', 'how', 'its', 'but',
  'not', 'any', 'can', 'our', 'was', 'has', 'had', 'his', 'her', 'all', 'best',
]);

function extractKeywords(text: string): string[] {
  return Array.from(
    new Set(
      (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP_WORDS.has(w)),
    ),
  );
}

/** Overlap score: fraction of the query's keywords present in the candidate text. */
function overlapScore(queryKeywords: string[], candidateText: string): number {
  if (queryKeywords.length === 0) return 0;
  const lower = (candidateText || '').toLowerCase();
  const hits = queryKeywords.filter((k) => lower.includes(k)).length;
  return hits / queryKeywords.length;
}

interface ProbeQueryResult {
  query: string;
  cited: boolean;
}

export interface ContributingItem {
  id: string;
  label: string;          // fact statement or article topic
  matchedQueries: string[];
  overlap: number;        // 0..1, best overlap across matched queries
}

export interface AttributionResult {
  hasPrevious: boolean;
  prevTimestamp: string | null;
  prevRate: number | null;
  newRate: number;
  deltaPp: number | null;
  newlyWonQueries: string[];
  lostQueries: string[];
  factsAddedInWindow: number;
  articlesAddedInWindow: number;
  contributingFacts: ContributingItem[];
  contributingArticles: ContributingItem[];
  note: string;
}

const OVERLAP_THRESHOLD = 0.34; // ≥ ~1/3 of a query's keywords must appear

/**
 * Compute attribution for a just-finished probe, BEFORE the new run is persisted
 * (so the "previous run" lookup doesn't return the current one).
 */
export async function computeAttribution(
  dbAdmin: FirebaseFirestore.Firestore,
  userId: string,
  currentResults: ProbeQueryResult[],
  currentRate: number,
  currentTimestamp: string,
): Promise<AttributionResult> {
  const base: AttributionResult = {
    hasPrevious: false,
    prevTimestamp: null,
    prevRate: null,
    newRate: currentRate,
    deltaPp: null,
    newlyWonQueries: [],
    lostQueries: [],
    factsAddedInWindow: 0,
    articlesAddedInWindow: 0,
    contributingFacts: [],
    contributingArticles: [],
    note: 'Baseline run — no previous probe to compare against yet. Run again after adding facts and articles to see what moves your citation rate.',
  };

  // ── Previous run ────────────────────────────────────────────────────────────
  const prevSnap = await dbAdmin
    .collection('citation_tests')
    .where('userId', '==', userId)
    .get();

  const prevRuns = prevSnap.docs
    .map((d) => d.data())
    .filter((r) => r.timestamp && r.timestamp < currentTimestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const prev = prevRuns[0];
  if (!prev) return base;

  const prevTimestamp: string = prev.timestamp;
  const prevRate: number = prev.citationRate ?? 0;

  // ── Query-level diff ────────────────────────────────────────────────────────
  const prevCited = new Map<string, boolean>();
  for (const r of prev.results || []) prevCited.set(r.query, !!r.cited);

  const newlyWon: string[] = [];
  const lost: string[] = [];
  for (const r of currentResults) {
    const before = prevCited.get(r.query);
    if (r.cited && before === false) newlyWon.push(r.query);
    if (!r.cited && before === true) lost.push(r.query);
  }

  // ── Candidate facts/articles created in the window ──────────────────────────
  const prevDate = prevTimestamp.split('T')[0]; // facts store date-only createdAt

  const [factsSnap, articlesSnap] = await Promise.all([
    dbAdmin.collection('facts').where('userId', '==', userId).get(),
    dbAdmin.collection('articles').where('userId', '==', userId).get(),
  ]);

  const windowFacts = factsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    // facts use a date-only createdAt; include same-day-or-later as "in window"
    .filter((f) => (f.createdAt || '') >= prevDate);

  const windowArticles = articlesSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((a) => a.timestamp && a.timestamp > prevTimestamp && a.timestamp <= currentTimestamp);

  // ── Overlap matching against the newly-won queries ──────────────────────────
  const wonKeywords = newlyWon.map((q) => ({ query: q, keywords: extractKeywords(q) }));

  const matchItems = (
    items: any[],
    textOf: (item: any) => string,
    labelOf: (item: any) => string,
  ): ContributingItem[] => {
    const out: ContributingItem[] = [];
    for (const item of items) {
      const text = textOf(item);
      const matched: string[] = [];
      let best = 0;
      for (const { query, keywords } of wonKeywords) {
        const score = overlapScore(keywords, text);
        if (score >= OVERLAP_THRESHOLD) {
          matched.push(query);
          if (score > best) best = score;
        }
      }
      if (matched.length > 0) {
        out.push({ id: item.id, label: labelOf(item), matchedQueries: matched, overlap: +best.toFixed(2) });
      }
    }
    return out.sort((a, b) => b.overlap - a.overlap).slice(0, 8);
  };

  const contributingFacts = matchItems(
    windowFacts,
    (f) => f.statement || '',
    (f) => f.statement || '(untitled fact)',
  );
  const contributingArticles = matchItems(
    windowArticles,
    (a) => `${a.topic || ''} ${a.article || ''}`,
    (a) => a.topic || '(untitled article)',
  );

  const deltaPp = +(currentRate - prevRate).toFixed(1);

  let note: string;
  if (newlyWon.length === 0 && deltaPp <= 0) {
    note = windowFacts.length + windowArticles.length > 0
      ? `You added ${windowFacts.length} fact(s) and ${windowArticles.length} article(s) since the last probe, but citation rate hasn't moved yet. GEO effects typically take 2–6 weeks to propagate into AI answers.`
      : 'No new facts or articles since your last probe, and citation rate is flat. Add Cite-Magnet facts and publish articles, then re-probe.';
  } else if (newlyWon.length > 0) {
    note = `${newlyWon.length} quer${newlyWon.length === 1 ? 'y' : 'ies'} started getting cited since your last probe. The items below were published in that window and overlap those queries — likely contributors (correlation, not proof).`;
  } else {
    note = `Citation rate moved ${deltaPp > 0 ? '+' : ''}${deltaPp}pp since your last probe.`;
  }

  return {
    hasPrevious: true,
    prevTimestamp,
    prevRate,
    newRate: currentRate,
    deltaPp,
    newlyWonQueries: newlyWon,
    lostQueries: lost,
    factsAddedInWindow: windowFacts.length,
    articlesAddedInWindow: windowArticles.length,
    contributingFacts,
    contributingArticles,
    note,
  };
}
