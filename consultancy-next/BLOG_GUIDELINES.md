# L8EntSpace Blog Guidelines

## Who We're Writing For

Our readers range from CEOs who've never heard of GEO to developers who want the technical details. The default assumption is **low to medium technical literacy**. If a post requires background knowledge, link to the explainer rather than front-loading jargon.

A useful test: if a smart 16-year-old couldn't follow the opening paragraph, rewrite it.

---

## The Two-Tier System

Every topic can live at two depths. Pick one per post; cross-link between them.

| Tier | Name | Word Count | Tone | Who reads it |
|------|------|------------|------|--------------|
| 1 | **Plain-English Overview** | 400–700 words | Conversational, analogy-heavy | Non-technical founders, marketers, execs |
| 2 | **Technical Deep-Dive** | 800–1,400 words | Precise, code/data ok, still readable | Developers, growth engineers, GEO practitioners |

A Tier 1 post ends with: *"Want the technical details? Read [Tier 2 title] →"*  
A Tier 2 post opens with: *"New to this? Start with [Tier 1 title] →"*

---

## Writing Style

### Plain English Rules
- Use short sentences. One idea per sentence.
- Prefer the common word: "use" not "utilise", "find" not "identify", "check" not "ascertain".
- Spell out acronyms on first use: "Generative Engine Optimization (GEO)".
- Replace jargon with analogies before introducing the proper term.
- No passive voice unless the actor genuinely doesn't matter.

### Good Analogy Template
> *"Think of [technical concept] like [everyday thing]. [One sentence explaining the parallel]. That's why [implication for the reader]."*

### Forbidden Phrases
- "leveraging" → use "using"
- "holistic approach" → say what you actually do
- "game-changer", "revolutionary", "unprecedented"
- "mathematical certainty" or similar absolute guarantees
- Any statistic you cannot point to a real source or your own real data for

---

## Fact Standards

**Only claim what exists and works in the product today.**

Real capabilities you can describe:
- Citation Probe (ChatGPT, Perplexity, Claude, Gemini)
- Fact Vault (structured brand facts, used in synthesis)
- Content Scorer (Gemini-scored, 4 dimensions, 0–100)
- Agent Pipeline (Exa crawl → extract → synthesize → schema)
- Schema Deploy (JSON-LD injected via JS snippet)
- Cost Audit dashboard
- Audit Logs (Firestore, user actions)
- GEO Lab (live A/B experiments, real findings)

**Do not claim:**
- Specific percentage lifts unless from a real, described experiment
- Features not yet built (flag as "coming soon" or don't mention)
- Third-party certifications (SOC 2, ISO, etc.) — we don't hold any
- Competitor comparisons without evidence

When in doubt: describe what the product *does*, not what it *guarantees*.

---

## Tone and Voice

**We are building in public.** That means:
- Share what worked and what didn't
- Use "we're building" and "we're testing" language for things in progress
- Admit when something is hard, unresolved, or still experimental
- The founder voice is direct, curious, and honest — not polished corporate

**Avoid:**
- Hype without substance
- Overconfident predictions ("AI search will replace SEO by 2026")
- Excessive hedging that erases meaning ("it may potentially be possible that...")

The sweet spot: **confident about what we've observed, honest about what we don't yet know**.

---

## Post Structure

### Standard Structure
1. **Hook** — one punchy sentence or question (not a rhetorical one)
2. **The problem** — what's broken or confusing for the reader right now
3. **The answer** — what actually works, grounded in facts/experiments
4. **How L8EntSpace helps** — natural mention, not a hard sell
5. **What to do next** — one clear CTA (try the probe, read a related post, etc.)

### For GEO Lab Posts
1. Hypothesis — what we thought would happen
2. Setup — how we tested it (be specific: queries, models, before/after)
3. Results — real numbers, even if small or inconclusive
4. What it means — practical takeaway
5. What we're testing next

### For Building-in-Public Posts
1. Where we were / what changed
2. The decision or challenge
3. What we built or decided
4. What we learned
5. What comes next

---

## Content Categories

### 1. Founder Narrative / Building in Public
Posts about the journey, decisions, experiments, failures, and pivots. These build trust and community.

*Priority: high — currently zero posts in this category.*

Post ideas:
- "Why I'm Building L8EntSpace in Public (and What That Actually Means)"
- "The Pivot That Changed L8EntSpace's Direction"
- "Six Months of Building a GEO Platform as a Solo Founder"
- "What I Got Wrong About AI Search in Year One"

### 2. GEO Lab: Experiments and Results
Real A/B experiments, hypotheses, and findings. These are our most defensible content — original data no one else has.

*Priority: high — GEO Lab exists but is not yet documented on the blog.*

Post ideas:
- "GEO Lab #001: Does Adding a Key Takeaways Section Lift Citation Rate?" (report real results)
- "GEO Lab #002: Schema Markup vs Plain Prose — Which Gets Cited More?"
- "GEO Lab #003: Does Brand Entity Registration (Wikidata) Affect AI Citations?"
- "What the GEO Lab Is and How It Works" (Tier 1 explainer)

### 3. Plain-English Explainers (Tier 1)
Simple overviews of concepts that currently only have technical treatments.

*Priority: high — most existing posts are Tier 2.*

Post ideas:
- "What Is AI Share of Voice? (And Why You Should Care)"
- "What Actually Happens When You Ask ChatGPT About Your Brand"
- "Fact Vault Explained: Your Brand's Source of Truth for AI"
- "Citation Probe in Plain English: What It Measures and Why"
- "Why Your Website Might Be Invisible to AI — and How to Fix It"

### 4. Feature Launches and Product Updates
Honest announcements of new and improved features, written in plain English with real screenshots or examples.

*Priority: medium — some posts exist but recent features are undocumented.*

Post ideas:
- "Introducing the Brand Probe Pipeline: Weekly AI Health Checks, Automated"
- "The Bulk Agent Pipeline: From Probe to Published in One Click"
- "What's New in the L8EntSpace Dashboard (June 2026)"

### 5. Community and YouTube
Posts that invite people in, explain where to follow along, and document the content roadmap.

*Priority: medium — zero posts currently.*

Post ideas:
- "The L8EntSpace YouTube Channel Is Coming: Here's What We're Planning"
- "Join the GEO Lab Community: Experiments, Results, and Office Hours"
- "How to Follow Along as We Build L8EntSpace in Public"

### 6. Strategy and Concepts (existing strength — extend carefully)
The existing posts here are good. Only add new ones when there's a genuine new insight or experiment result to anchor the post.

---

## SEO and GEO Hygiene for Our Own Posts

Every post should have:
- A clear thesis in the first 100 words (this is what AI engines cite)
- At least one "Key Takeaways" section with 4–6 bullet points
- Named entities: company names, product names, real statistics, dates
- One internal link to a related post
- One external link to a credible source (when making a factual claim)
- Schema markup: `Article` type with `datePublished`, `author`, `description`

---

## Review Checklist Before Publishing

- [ ] No fabricated statistics or percentages
- [ ] No features described that aren't built
- [ ] No absolute guarantees or certainty claims
- [ ] Opening paragraph readable by a non-technical person
- [ ] Tier (1 or 2) is clear — cross-link to the other tier if it exists
- [ ] CTA is specific and relevant
- [ ] Slug, title, and description are GEO-optimised (clear, declarative, searchable)
