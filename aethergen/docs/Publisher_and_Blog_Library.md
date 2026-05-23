### Publisher & Blog Library Guide

This explains how to populate the on‑site blog library and use the `/publisher` tools (draft generation, scheduling, and LinkedIn posting).

---

## 1) Blog Library (static files)

Location: `public/blog-library/`

Files:
- `manifest.json` → a list of available drafts
- `*.json` → each post’s full content

### 1.1 manifest.json schema
Minimal fields used by the UI (`slug` and `title`):
```json
[
  {
    "slug": "from-starlings-to-swarms-8d-safety",
    "title": "From Starlings to Swarms: 8D Safety for Thousands of Drones"
  },
  {
    "slug": "future-proofing-llm-brand-visibility",
    "title": "Future‑Proofing LLM Brand Visibility"
  }
]
```

### 1.2 Per‑post JSON schema (`public/blog-library/<slug>.json`)
```json
{
  "slug": "from-starlings-to-swarms-8d-safety",
  "title": "From Starlings to Swarms: 8D Safety for Thousands of Drones",
  "excerpt": "How 8D state, evidence bundles, and RTA enable resilient swarms.",
  "contentHtml": "<p>Short HTML body… include links to /ai, /technology, evidence bundles, etc.</p>",
  "canonicalUrl": "https://auspexi.com/blog/from-starlings-to-swarms-8d-safety",
  "tags": ["8D", "safety", "edge"],
  "createdAt": "2025-08-27T10:00:00Z"
}
```

Notes:
- The Publisher pulls `manifest.json` to populate the dropdown. When you select a slug, it fetches the corresponding `<slug>.json` to queue a blog.
- You can start with a few items and expand over time.

---

## 2) Using /publisher

Open `/publisher` in the app.

- Draft generator:
  - Pick a page from the library or paste a URL/title yourself.
  - Fill "Key points"; the tool assembles a safe, evidence‑led draft and hashtags.
  - Buttons:
    - "Open LinkedIn Share": sends you to LinkedIn with your URL attached.
    - "Copy Draft": copies headline/body/hashtags to clipboard.
    - "Connect LinkedIn": OAuth to store a token (org or member, depending on env).
    - "Publish (LinkedIn)": POSTs the draft to LinkedIn if connected.
    - "Queue (Scheduled)": schedules via `/.netlify/functions/social-queue` (see below).

- Blog queue:
  - Select a library item and set a date/time.
  - Click "Queue Blog" → calls `/.netlify/functions/blog-queue` with the post JSON.
  - If your project doesn’t include `blog-queue`, publish manually in your CMS or adapt `social-queue` for blog posting.

Safety/tone:
- The generated copy avoids hype and preserves IP; you can still edit before posting.

---

## 3) LinkedIn connection and status

Endpoints:
- `/.netlify/functions/linkedin-start` → begin OAuth
- `/.netlify/functions/linkedin-callback` → completes OAuth (auto‑redirects to start if `code` missing)
- `/.netlify/functions/linkedin-status` → returns `{ configured: boolean }`
- `/.netlify/functions/linkedin-publish` → POST `{ text, url? }` to post; GET shows a small help page

Setup (env):
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` (Netlify env)
- Optional `LINKEDIN_ORG_URN` to post as an organization (e.g., `urn:li:organization:123456`)
- `URL` set to your site’s base for callback URLs

Flow:
1) Click "Connect LinkedIn" in `/publisher` (or hit `linkedin-start`).
2) After consent, status shows connected; you can publish via the button.
3) For scheduling, use "Queue (Scheduled)" (see 4 below).

---

## 4) Scheduling posts

The Publisher calls `/.netlify/functions/social-queue` with `{ text, url, scheduledAt }`.
You should pair this with a Netlify Scheduled Function (cron) that calls `/.netlify/functions/social-scheduler` to drain the queue and publish using `/.netlify/functions/linkedin-publish`.

Minimal approach if you don’t want cron yet:
- Use the manual "Open LinkedIn Share" flow and the copied text for posting.

---

## 5) Quick start checklist

1) Create `public/blog-library/manifest.json` and at least one `<slug>.json` using the schemas above.
2) Open `/publisher` → select your slug → verify draft output.
3) Click "Connect LinkedIn" once; confirm status is connected.
4) Use "Publish (LinkedIn)" for an immediate test post (keep it short and safe).
5) Optional: schedule via "Queue (Scheduled)" after wiring `social-queue` + cron.

Tips:
- Keep library titles specific and evidence‑driven.
- Use clear CTAs and link to `/ai`, `/technology`, or `/resources` where relevant.
- Iterate: publish, measure engagement, refine your key points.


