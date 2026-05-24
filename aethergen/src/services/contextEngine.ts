export type DocSpan = { id: string; source: string; text: string; score: number; recency?: number; trust?: number };
export type QuerySignals = { retrieval_margin: number; support_docs: number; recency_score: number; source_trust: number; format_health: number };

function normalize(x: number | undefined, def = 0): number { const v = typeof x === 'number' ? x : def; return Math.max(0, Math.min(1, v)); }

export class ContextEngine {
  rankHybrid(bm25: DocSpan[], dense: DocSpan[], reranked?: DocSpan[], k = 6): DocSpan[] {
    const byId = new Map<string, DocSpan>();
    const boost = (arr: DocSpan[], w: number) => arr.forEach(d => {
      const prev = byId.get(d.id) || { ...d, score: 0 };
      byId.set(d.id, { ...prev, score: prev.score + w * d.score });
    });
    boost(bm25, 0.6); boost(dense, 0.8); if (reranked) boost(reranked, 1.0);
    const all = Array.from(byId.values()).map(d => ({ ...d, score: d.score * (0.7 + 0.3 * normalize(d.recency)) * (0.8 + 0.2 * normalize(d.trust, 0.5)) }));
    all.sort((a, b) => b.score - a.score);
    // MMR-like de-dup by cosine proxy (here: Jaccard on tokens as placeholder)
    const pick: DocSpan[] = [];
    for (const d of all) {
      const tooSimilar = pick.some(p => jaccard(p.text, d.text) > 0.85);
      if (!tooSimilar) pick.push(d);
      if (pick.length >= k) break;
    }
    return pick;
  }

  computeSignals(spans: DocSpan[], k = 6): QuerySignals {
    const top = spans.slice(0, k);
    const margin = top.length >= 2 ? Math.max(0, top[0].score - top[1].score) : (top[0]?.score ?? 0);
    const support = top.length / k;
    const recency = avg(top.map(d => normalize(d.recency)));
    const trust = avg(top.map(d => normalize(d.trust, 0.5)));
    const format = 1; // placeholder: add JSON/schema health later
    return { retrieval_margin: clamp01(margin), support_docs: clamp01(support), recency_score: clamp01(recency), source_trust: clamp01(trust), format_health: clamp01(format) };
  }

  pack(spans: DocSpan[], tokenBudget = 3000): { packed: string; included: DocSpan[] } {
    const included: DocSpan[] = [];
    let tokens = 0;
    for (const s of spans) {
      const cost = approxTokens(s.text);
      if (tokens + cost > tokenBudget) break;
      included.push(s); tokens += cost;
    }
    const packed = included.map(s => `Source: ${s.source}\nScore:${s.score.toFixed(3)}\n${s.text}\n---`).join('\n');
    return { packed, included };
  }
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function avg(arr: number[]) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function approxTokens(s: string) { return Math.ceil((s || '').length / 4); }
function jaccard(a: string, b: string) {
  const A = new Set((a || '').toLowerCase().split(/\W+/).filter(Boolean));
  const B = new Set((b || '').toLowerCase().split(/\W+/).filter(Boolean));
  const inter = new Set([...A].filter(x => B.has(x))).size; const uni = new Set([...A, ...B]).size; return uni ? inter / uni : 0;
}

export const contextEngine = new ContextEngine();


