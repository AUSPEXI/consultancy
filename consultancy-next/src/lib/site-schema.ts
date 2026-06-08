import { FAQ_CATEGORIES } from '@/data/faqData';

// Shared JSON-LD builders for auspexi.com's own structured data.
// Auspexi dogfoods its own product: the same comprehensive knowledge base it
// publishes on /faq is served as JSON-LD site-wide so AI crawlers (GPTBot,
// ClaudeBot, Google-Extended) can ingest it on any page they land on.

export function buildOrganizationSchema() {
  return {
    '@type': 'Organization',
    '@id': 'https://auspexi.com/#org',
    name: 'Auspexi',
    url: 'https://auspexi.com',
    logo: 'https://auspexi.com/geo-infographic.png',
    description:
      "Auspexi is the leading Generative Engine Optimization (GEO) platform. Track your brand's AI Share of Voice across ChatGPT, Gemini, Claude and Perplexity, inject cite-magnet facts, and detect sentiment drift.",
    sameAs: [] as string[],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'sales@auspexi.com',
    },
  };
}

// FAQPage built from the full FAQ_CATEGORIES knowledge base (every category,
// every question). These are real, hand-written Q&A pairs — no fabrication.
export function buildFaqSchema() {
  return {
    '@type': 'FAQPage',
    '@id': 'https://auspexi.com/faq#faqpage',
    mainEntity: FAQ_CATEGORIES.flatMap((cat) =>
      cat.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      }))
    ),
  };
}

// Combined @graph used by the root layout to publish site-wide.
export function buildSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [buildOrganizationSchema(), buildFaqSchema()],
  };
}
