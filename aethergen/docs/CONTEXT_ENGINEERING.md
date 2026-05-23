# Context Engineering Layer

High-level API and guidance for hybrid retrieval, context quality signals, and evidence provenance.

## API (TypeScript)

- rankHybrid(bm25: DocSpan[], dense: DocSpan[], reranked?: DocSpan[], k=6): DocSpan[]
- computeSignals(spans: DocSpan[], k=6): { retrieval_margin, support_docs, recency_score, source_trust, format_health }
- pack(spans: DocSpan[], tokenBudget=3000): { packed: string, included: DocSpan[] }

DocSpan fields: { id, source, text, score, recency?, trust? }

## Signals to Risk Guard
- margin = retrieval_margin
- entropy = 1 - source_trust
- retrieval = (support_docs + recency_score) / 2
- supportDocs = support_docs

Use hallucinationRisk.computeRisk and decideAction to route: generate / fetch_more_context / abstain.

## Evidence
Add context_provenance.json to evidence ZIP with entries per query, including signals and included_sources.

## Acceptance Metrics
- Retrieval: P@k, nDCG@k, citation-hit rate, coverage
- Consistency: answer-citation agreement, optional entailment
- Health: format errors, tool failure rate

## Best Practices
- Hybrid retrieval (BM25 + dense + reranker), MMR de-dup, recency/trust boosts
- Token budget packing with provenance and citations
- If signals are low: fetch more, clarify, or abstain
