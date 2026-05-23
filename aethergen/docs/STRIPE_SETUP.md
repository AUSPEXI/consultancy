# Stripe Setup – Pilot Payments

## Products & Prices
- Create Product: "Evidence‑Efficient Evaluation Sprint"
  - Prices:
    - Deposit (one‑time): e.g., GBP 1,250 (or USD equivalent)
    - Full (one‑time): e.g., GBP 2,500–5,000 tier depending on scope

## Payment Links
- Create two Payment Links:
  - Deposit → copy URL → set env `VITE_STRIPE_PILOT_LINK_DEPOSIT`
  - Full → copy URL → set env `VITE_STRIPE_PILOT_LINK_FULL`

## Environment
- Netlify env vars (Site settings → Build & deploy → Environment):
  - `VITE_STRIPE_PILOT_LINK_DEPOSIT = https://buy.stripe.com/...`
  - `VITE_STRIPE_PILOT_LINK_FULL = https://buy.stripe.com/...`

## Optional Scheduling
- Create Calendly link and set `VITE_CALENDLY_URL` for the Pilot page button.
