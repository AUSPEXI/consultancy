# Closed-Data Pilot Kit (Evidence-Efficient AI)

## Goals
- Demonstrate 60–90% fewer large-model calls, ~50–80% token reduction, ~30–70% latency improvement
- Preserve or improve answer quality with calibrated abstention
- Export evidence bundle suitable for internal audit (no raw docs)

## Scope (2–4 weeks)
1) Anchor seeding (5–15% corpus) and retrieval wiring
2) SLM-first routing with Risk Guard and selective thresholds
3) Small evaluation set (100–400 queries) with ground truth or acceptance checks
4) Evidence export and review

## Environment
- Run retrieval and SLM inside customer boundary (VPC/on-device)
- Encrypt caches; apply TTL and legal filters
- No raw documents leave boundary; only anchors, vectors, and signed metrics

## Steps
1. Data intake
   - Identify 2–3 high-value domains (FAQs, runbooks, knowledgebase)
   - Legal screen; create anchor packs (facts, segments, quantiles)
2. Retrieval
   - BM25 + dense + reranker (hybrid); budget pack to target tokens
   - PQ compress vectors; set freshness and trust weights
3. Risk Guard
   - Calibrate target coverage (e.g., 95%) with conformal estimates
   - Actions: generate, fetch more, abstain
4. Routing
   - SLM-first; escalate only on hard cases
   - Contextual bandit to learn best path per segment
5. Evaluation
   - 100–400 queries; include underspecified prompts to test abstention
   - Log tokens, calls, latency, action, accuracy/acceptance
6. Evidence
   - Export signed ZIP with `context_provenance.json`, metrics summary, crypto profile
   - Share internally for review (no raw content)

## Metrics
- Tokens/request, large-model calls, latency p50/p95
- Answer quality vs ground truth or acceptance checks
- Abstain rate; “fetch more” rate; reroute rate

## Acceptance
- ≥60% call reduction, ≥30% latency improvement, calibrated abstention
- Evidence bundle reviewed by risk/compliance/engineering

## Handover
- Settings for thresholds and routes
- Anchor update process; evidence export runbook
