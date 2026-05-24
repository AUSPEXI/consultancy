# Spinor/8D RAG README

- Corpus: `citations.jsonl` + curated excerpts (to be added) for Cℓ(8), Spin(8), triality, Dirac operators, differential geometry on 8D manifolds.
- Policy: research-only; no security claims. All outputs carry citations.

## Indexing
- Split by theorem/definition/example; store source, locator, and license.
- Embed with model that respects math tokens; store dense + sparse vectors.

## Query
- Prefer structured prompts: (topic, object, identity, needed form)
- Always return citations and confidence; never hallucinate proofs.

## Roadmap
- Add excerpt files per citation
- Add evaluation set for identity verification and Dirac toy tasks
