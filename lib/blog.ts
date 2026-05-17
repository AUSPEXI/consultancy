export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  category: string;
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'redefining-geo-in-2026',
    title: 'Redefining GEO in 2026: Beyond Keyword Density',
    excerpt: 'How generative search is moving from simple keyword matching to high-dimensional semantic clustering.',
    date: 'May 15, 2026',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000',
    category: 'Research',
    content: `
      ## The Semantic Shift
      Generative Engine Optimization (GEO) is no longer a luxury—it's a requirement for brand survival.
      As LLMs like Gemini 1.5 Pro and GPT-4 move from retrieval-augmented generation to deep reasoning, your brand's presence in the latent space determines your visibility.
      
      ### Why Semantic Density Matters
      In 2026, the engine doesn't just look for "auspexi". It looks for the proximity of "auspexi" to "security", "integrity", and "innovation".
    `
  },
  {
    slug: 'latent-space-auditing',
    title: 'Latent Space Auditing: The New Brand Protection',
    excerpt: 'Why monitoring your brands semantic distribution is critical for preventing hallucinated misinformation.',
    date: 'May 10, 2026',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4628c9757?auto=format&fit=crop&q=80&w=1000',
    category: 'Strategy',
    content: `
      ## Proactive Monitoring
      If you aren't auditing your brand representation in the latent space, you are leaving your reputation to chance.
      
      ### Hallucinations are the New Fake News
      When an AI hallucination incorrectly links your company to a controversy, that link quickly spreads through the semantic web. Proactive audits identify these drifting clusters before they become stable.
    `
  }
];

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  // In production, fetch from Firestore. For now, use static data.
  return BLOG_POSTS.find(p => p.slug === slug);
}
