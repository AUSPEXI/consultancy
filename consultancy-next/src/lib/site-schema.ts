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

// FAQPage is intentionally NOT included here for site-wide use.
// It lives on /faq only (scoped to the page whose content matches).
// Experiment 021 in geo-lab will determine whether site-wide FAQPage
// improves AI citation enough to justify the GSC policy risk.
