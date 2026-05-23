# Social Automation and Blog Scheduler – Implementation Guide and Roadmap

## What’s implemented now (LinkedIn)
- OAuth flow:
  - Start: `/.netlify/functions/linkedin-start`
  - Callback: `/.netlify/functions/linkedin-callback`
- Posting:
  - Immediate post: `/.netlify/functions/linkedin-publish`
- Scheduling:
  - Queue table: `public.social_posts` (Supabase)
  - Enqueue API: `/.netlify/functions/social-queue`
  - Scheduler: `/.netlify/functions/social-scheduler` (run via Netlify cron)
- Publisher UI (`/publisher`):
  - Draft generator, Connect, Publish, datetime picker, and UK/US presets

Env required
- LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
- (Optional for quick testing) LINKEDIN_ACCESS_TOKEN, LINKEDIN_ACCOUNT_URN
- SUPABASE_URL, SUPABASE_SERVICE_ROLE

Cron
- Netlify → Functions → Scheduled functions → run `social-scheduler` every 10 min: `*/10 * * * *`

## Future plans (Social)
- Token persistence & refresh
  - Store access/refresh tokens in `public.social_accounts`; auto-refresh when expired
- Organization posting
  - Support `w_organization_social` and Page URNs; UI toggle: post as Member vs Company
- More presets & analytics
  - Day/time presets for UK/US; A/B copy variants; outcome logging (impressions/engagement, if provided)
- Providers
  - Meta/Instagram Graph support (Page + IG Business), queued via same table

---

## Blog scheduling: options and recommendations
Aim: publish high‑quality, evidence‑led posts on a schedule without paid APIs.

Guiding principles
- Quality over volume; no thin/duplicated content.
- Clear titles, meta descriptions, canonical URLs; add JSON‑LD `Article`.
- Internal linking to `/ai`, `/whitepaper`, and product docs.

### Option A: Library‑driven Scheduler (simple and robust)
- You prepare a library of vetted posts as JSON files; scheduler publishes on cadence.
- Storage
  - `public/blog-library/*.json` (or `supabase.storage`) with fields: `slug`, `title`, `excerpt`, `contentHtml`, `tags`, `createdAt`.
- DB
  - Table `public.blog_posts` with `slug`, `title`, `excerpt`, `content_html`, `status (draft|scheduled|published)`, `scheduled_at`, `published_at`, `tags`.
- Functions
  - `blog-queue` to enqueue library items with a schedule
  - `blog-scheduler` to publish due items (move from draft to published in DB)
- Frontend
  - Update `Blog.tsx` and `BlogPost.tsx` to read from Supabase (fallback to current curated posts until migration completes)
- SEO
  - Add to sitemap on publish; set canonical; add `Article` JSON‑LD.

Pros: no external API calls; full editorial control; easy to review once and drip out.

### Option B: In‑house assisted generation (templated, no external APIs)
- Generate posts from your site’s facts and docs using templates and deterministic scripts.
- Inputs
  - `public/brand.json`, `public/evidence.json`, structured pages (titles/sections), and your changelog.
- Tooling (Node script)
  - Extract topics/claims → fill templates (e.g., “Case Study”, “How‑to”, “FAQ”) → produce `contentHtml` with links/CTAs.
  - Lint for tone/IP (remove hype terms, sensitive phrases).
- Flow
  - Write generated drafts to `public/blog-library/*.json` for Option A’s scheduler.

Pros: no variable cost; tone/IP guardrails; stays on‑message using your authoritative sources.

### Option C: Full auto (crawl + outline + fill)
- Periodically crawl your site and external public artifacts, synthesize outlines, then fill via templates.
- Always queue for manual review (or auto‑publish with tight guardrails only).
- Start with low cadence and measure engagement; keep Option A fallback.

Pros/risks: maximum automation, but requires stronger guardrails to avoid low‑quality output.

---

## Minimal implementation plan (recommended)
1) Schema
- Add `public.blog_posts` (Supabase):
  - slug (text, PK unique), title (text), excerpt (text), content_html (text), tags (text[]),
    status (draft|scheduled|published), scheduled_at (timestamptz), published_at (timestamptz), created_at/updated_at

2) Library
- Place curated JSON drafts in `public/blog-library/`.

3) Functions
- `blog-queue`: add selected library post to `blog_posts` with schedule
- `blog-scheduler`: publish due posts (set status, published_at)
- `sitemap-update`: append new routes to `public/sitemap.xml` (or rebuild sitemap from DB)

4) Frontend
- Update `Blog.tsx` to list from DB (with pagination), `BlogPost.tsx` to fetch by slug.
- Add `Article` JSON‑LD and canonical.

5) Cadence presets
- UK/US B2B windows (Tue–Thu 08:30–10:00, 12:00–13:30, 16:30–18:00 local)

6) Guardrails
- IP/tone linter (reuse terms sanitizer from social publisher); minimum word count; internal link checklist.

---

## Notes on SEO
- Unique titles (≤ 60 chars) and meta descriptions (≈ 150–160 chars).
- Internal links to cornerstone pages; include images with alt.
- Add `Article` JSON‑LD with `author`, `datePublished`, `headline`, `image`.
- Update sitemap on publish; avoid publishing “no content” scaffolds.

## Roadmap
- Phase 1 (low lift)
  - Library‑driven scheduler, DB‑backed blog rendering, sitemap update
- Phase 2
  - Templated assisted generation script from brand/evidence/docs
  - Review dashboard in `/publisher` (approve/edit/queue)
- Phase 3
  - Full auto with heuristics + strict guardrails; simple A/B titles; engagement logging

---
Status: LinkedIn automation live with scheduling. Blog scheduler documented with a safe, incremental path (Option A preferred). When ready, we can implement the `blog_posts` schema and minimal functions in a short iteration.
