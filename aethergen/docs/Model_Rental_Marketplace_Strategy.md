### Aethergen Model Rental Marketplace — Strategy, Differentiation, and Plan

#### What changes vs our current model sales?

- Today: We sell Aethergen first‑party models and datasets, delivered primarily via Databricks Unity Catalog (UC) listings and private offers. Delivery is enterprise‑grade but seller = us, and commercial logic is subscription + bundles.
- Marketplace layer (new): Adds a platform economy on top of our existing delivery. We enable multiple sellers (Aethergen + curated partners, later broader creators) to list models with unified evidence, pricing, metering, and payouts while keeping Databricks/UC and Edge packaging as delivery options. We do not replace Databricks; we add a layer that orchestrates listings, quality, billing, and governance across delivery channels.

Visually:

```
Creators (Aethergen, Partners, Later: Open)  -->  Marketplace Control Plane
   • Model cards, SBOM, license, proofs          • Listings, pricing, evidence links
   • Artifacts (ONNX, GGUF, checkpoints)         • Quality gates (auto‑eval, SLA checks)
                                                 • Billing, metering, payouts
                                                 • API keys, rate limits, abuse controls

Delivery Planes (unchanged, expanded)
  1) Databricks UC/MLflow for enterprise & private offers
  2) Aethergen Hosted Inference API (SaaS rental)
  3) Edge Packages (offline GGUF/ONNX with receipts)
```

Key differences vs “we were selling models anyway”
- Multi‑seller: invite‑only at first, then open with quality tiers and automatic evaluation gates.
- Unified evidence: every listing must include our Innovation Test Harness scores, privacy proof/UPB where applicable, SBOM, license, and checksums.
- Rental economics: metered usage (tokens/time/calls) with tiered pricing, minimums, and revenue share for creators (Stripe Connect).
- Procurement‑ready: legal templates, audit events, usage receipts, and periodic re‑certification – reduces buyer friction.
- Edge‑ready: standardized offline bundles with license + checksum + optional watermarking, plus signed usage receipts for settlement later.

---

#### Strategy summary

- Vision: become the trusted exchange for provably good, enterprise‑ready models. Not “any model,” but “auditable, governed, and production‑fit.”
- Why now: data lead is diminishing; optimization and reliable delivery are the economic moat. Renting governed models is faster and cheaper than building for most teams.
- Differentiators:
  - Evidence‑led listings with reproducible evaluation and privacy/safety signals
  - Enterprise delivery channels (Databricks UC) plus hosted inference and edge packaging
  - Strong governance (SBOM, license, checksums, SLA monitors, takedowns)

---

#### Business model

- Revenue streams:
  - Model rental usage (token/second/call); platform take‑rate 10–30% depending on tier/volume
  - Subscriptions for platform features and higher QoS
  - Private enterprise offers (custom SLAs, VPC/UC–only)
  - Optional listing/promotion fees later
- Creator economics:
  - Phase 1: Aethergen + curated partners (manual rev share)
  - Phase 2: Stripe Connect split payouts; provider dashboard with usage + statements

---

#### Quality, safety, and IP governance

Required for publication:
- Model Card + License + SBOM + checksums
- Evidence bundle (harness metrics: accuracy/utility/privacy/latency), dataset provenance
- Privacy bounds and safety red‑teaming notes as applicable
- Re‑cert schedule (e.g., quarterly or per major update)
- Auto‑delist on SLA breach or verified legal complaint

Tiers: Experimental → Verified → Enterprise‑Ready (gated by eval thresholds, uptime, documentation completeness)

---

#### Architecture (built on what we have)

- Control plane (Supabase + Netlify Functions):
  - Marketplace tables: listings, pricing tiers, evidence links, provider profiles, usage events, payout statements
  - Policies & RLS; rate limiting and CSP (added); CSRF checks
  - Stripe integration: subscriptions + usage accumulation; later Stripe Connect payouts

- Delivery planes:
  1) Databricks UC/MLflow
     - Keep current packaging path for enterprise; publish private/public listings
  2) Aethergen Hosted Inference API
     - JWT auth, per‑tenant rate limits, metering middleware, evidence headers
  3) Edge Packages
     - GGUF/ONNX with manifest/license/SBOM/checksums; signed offline usage receipts

---

#### Pricing templates (starter)

- Public tiers: Free dev (watermarked, low QPS), Pro, Enterprise (SLA). Per‑model token/time pricing with monthly minimums.
- Private offers: committed spend + overage; dedicated routing or on‑prem.

---

#### Go‑to‑market

- Wedge: Synthetic data + benchmarked models bundles on Databricks Marketplace with notebooks and SLAs.
- Developer growth: clean REST/SDK, Postman collection, quickstarts, fair free tier.
- Enterprise: security packet, procurement FAQ, evidence‑first sales motion.

---

#### KPIs

GMV, take‑rate, trial→paid conversion, SLA adherence, re‑cert pass rate, time‑to‑list, creator NPS, enterprise ACV.

---

#### Phased roadmap

- Phase 0 (1–2 weeks): internal rentals
  - Listings CRUD + minimal Listing Detail UI (pricing + evidence card + Try)
  - Metering on hosted inference; usage table; simple overage calc
  - Docs: creator and buyer quickstarts

- Phase 1 (2–6 weeks): curated partners
  - Invite‑only onboarding; legal templates; evaluation queue with harness
  - Stripe usage invoicing; Databricks private offers packaging; SLA monitors

- Phase 2 (6–12 weeks): Connect + open program
  - Stripe Connect payouts; provider dashboard; self‑serve submission with auto‑eval
  - Search/categories/badges; promotion slots; A/B pricing tests

- Phase 3 (12+ weeks): scale moats
  - Multi‑cloud routing; edge rentals with signed receipts; insurance/SLA guarantees

---

#### Concrete TODOs

Product & Policy
- Define tier gates and pass thresholds; takedown & AUP docs; creator terms

Engineering
- DB: listings, pricing_tiers, evidence_links, provider_profiles, usage_events, payout_statements
- APIs: listings (create/update/publish), onboarding upload (artifact + SBOM + license + checksums), eval results attach, buyer tokens, usage report
- Hosted inference middleware: auth, rate limit, metering, signed usage receipts
- Stripe: usage to metered billing items (Phase 1 store + invoice; Phase 2 metered)

Security/Compliance
- Request signing, watermark/canary detection, auto‑unlist rules

Docs & Sales
- Creator Pack (submission, eval, license); Buyer Pack (API + SLAs); procurement FAQ


