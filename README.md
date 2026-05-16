# Auspexi - Generative Engine Optimization (GEO) Platform

## Overview
Auspexi is a platform designed to help brands optimize their content for Generative AI engines (like ChatGPT, Google Gemini, and Claude). It focuses on "Share of Voice" (SOV) in AI responses rather than traditional search engine rankings.

## Features
- **GEO Dashboard**: Track AI Share of Voice, competitor decay, and citation frequency.
- **Fact-Vault**: Extract and store "High-Entropy Facts" (Cite-Magnets) to feed to LLMs.
- **Omnichannel Amplifier**: Generate platform-specific social media content to seed facts across the web.
- **Lead Capture Funnel**: A specialized funnel that generates a comprehensive GEO report using Exa.ai and Gemini, offering a time-limited $499 lifetime deal.
- **Stripe Integration**: Handles subscriptions and one-time payments.

## API Keys & Configuration
To run this project fully, you need to configure the following API keys in your AI Studio Settings (or `.env` file if running locally):

1. **`GEMINI_API_KEY`**: Required for generating the GEO reports and the Omnichannel Amplifier content.
2. **`EXA_API_KEY`**: Required for the lead capture funnel to search the web and gather context about a prospect's domain. (Get one at https://exa.ai)
3. **`STRIPE_SECRET_KEY`**: Required for processing payments.
4. **`APP_URL`**: The URL where this app is hosted (injected automatically by AI Studio).

## What's Left to Complete the Project?
While the core architecture, UI, and integrations are in place, here are the recommended next steps for production readiness:

1. **Email Automation**: Integrate an email service (like Resend or SendGrid) in `server.ts` to automatically email the generated GEO report to the prospect and trigger the follow-up sequence.
2. **Real Data Connections**: The dashboard currently uses mock data for the charts. You will need to connect this to your actual tracking engine or database.
3. **Stripe Webhooks**: Implement Stripe webhooks in `server.ts` to securely handle subscription lifecycle events (cancellations, renewals) rather than relying solely on the client-side success redirect.
4. **Firebase Security Rules**: Ensure your Firestore rules are hardened for production.

## Sales Funnel Flow
1. User clicks "Start Your Free Trial" or "Book a Demo".
2. They enter their Email and Domain.
3. The backend uses **Exa.ai** to crawl their domain and competitors.
4. The backend uses **Gemini 3.1 Pro** to generate a comprehensive, data-driven GEO report.
5. The report is displayed to the user immediately.
6. A "Time-Limited Offer" is presented to buy lifetime dashboard access for $499.
7. (Future) The report is emailed to them, starting a drip campaign.
