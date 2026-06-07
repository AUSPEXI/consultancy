# Auspexi GEO Platform — Master TODO

Living backlog for the consultancy-next dashboard, voice agents, ML data backbone,
and GEO Lab. Sprints are ordered by trust → data → visible value → features.

Legend: ☐ todo · ☑ done · ⧖ in progress

---

## Sprint 0 — Trust & Security  ☑ DONE
- ☑ S0.1 Remove Math.random() simulated SOV writes from Overview; show setup prompt instead
- ☑ S0.2 Stop false "Statistically Significant Drift Detected" alert for zero-data users
- ☑ S0.3 Sentiment Index dial — null/no-data state until real sentiment exists
- ☑ S0.4 Delete `/api/test-gemini` and `/api/test-live` debug routes
- ☑ S0.5 Restrict tier switching to hopiumcalculator@gmail.com (superuser guard)

## Sprint 1 — ML Data Backbone  ⧖
- ☑ S1.1 Persist + reload citation history (`GET /api/cite-probe`) → trend chart on Cite-Probe page
- ☐ S1.2 Fact embedding logging — store 768/1536-D vectors with each fact in `facts`
- ☐ S1.3 Link probe runs to the facts/articles that target them (closed-loop attribution)
- ☑ S1.4 Build A-SOV trend from real citation_tests history (Overview chart no longer
         fabricates a 12→45 ramp; demo data clearly badged for zero-data users)
- ☐ S1.5 Export training set: (content variant, query, platform, cited bool, embedding)

## Sprint 2 — Make Value Visible
- ☑ S2.1 Overview A-SOV trend + dials driven by real citation data; LIVE/DEMO badge
- ☐ S2.2 Per-platform citation trend on Cite-Probe (currently overall only)

## Sprint 3 — Voice Agents (Aura + Citacious)
- ☐ S3.1 Fix Aura audio context resume on user gesture
- ☐ S3.2 Citacious stale-context bug (knowledge graph not refreshing)
- ☐ S3.3 JSON-LD naming consistency
- ☐ S3.4 Locate + version Citacious knowledge-graph / personality files (see I4)
- ☐ S3.5–S3.9 (TBD from voice audit)

## Sprint 4 — Satellite Tools
- ☐ S4.1 Brand Monitor with real Reddit + Exa APIs
- ☐ S4.2 Simulator recovery/rebuild (see I1)
- ☐ S4.3 Shadow Link intent + rebuild (see I2)
- ☐ S4.4–S4.8 (TBD)

## Sprint 5 — UI/UX & Pricing
- ☐ S5.1 Consolidate tier enum to 3 real tiers (Starter $149 / Pro $499 / Business $1,899)
- ☐ S5.2 Sidebar reorganisation
- ☐ S5.3–S5.4 (TBD)

## Sprint 6 — GEO Lab Feedback Loop
- ☐ S6.1 Feed lab experiment findings back into dashboard content recommendations
- ☐ S6.2–S6.5 (TBD)

## Sprint 7 — Competitive Validation
- ☐ S7.1–S7.2 (TBD)

---

## Investigations
- ☐ I1 Simulator original intent (git history) → informs S4.2
- ☐ I2 Shadow Link original intent → informs S4.3
- ☐ I3 1,200 local synonyms / 768-D embedding mechanism → informs S1.2
- ☐ I4 Citacious knowledge-graph / personality file location → informs S3.4

## Lab tasks
- ☐ L1 Switch GEO Lab orchestrator design/video phases to claude-opus-4-8
