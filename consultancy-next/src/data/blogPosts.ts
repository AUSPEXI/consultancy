export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  content?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "shift-from-seo-to-geo",
    title: "The Shift from SEO to GEO: Generative Engine Optimization",
    excerpt: "Traditional search is changing. Here is how your brand transitions search optimization from ranked blue links to being cited directly inside generative AI models.",
    category: "Strategy",
    date: "April 15, 2026",
    content: "<h2>Optimizing for the Agentic Web</h2><p>In this publication, we elaborate on how Large Language Models ingest facts and provide direct answers. To succeed, brands must shift from link ranking to fact seeding.</p>"
  },
  {
    slug: "mastering-cite-magnets",
    title: "Mastering Cite-Magnets for Large Language Models",
    excerpt: "How to craft non-obvious, high-entropy semantic details that search engine crawlers and retrieval mechanisms prioritize in conversational responses.",
    category: "Engineering",
    date: "April 28, 2026",
    content: "<h2>How to Build High-Entropy Citations</h2><p>Large language models prioritize unique numbers and precise facts over generic copy. We refer to these as High-Entropy Details.</p>"
  },
  {
    slug: "trojan-horse-data-seeding",
    title: "The Trojan Horse Strategy: Overcoming Competitor Memory",
    excerpt: "How to rewrite competitor references and stale data cached inside LLM weights and vector indices through strategic multi-channel citation campaigns.",
    category: "Tactics",
    date: "May 10, 2026",
    content: "<h2>Overtaking Stale Competitor References</h2><p>Learn the exact method of seeding consensus across high-authority third-party properties to correct existing hallucinations.</p>"
  }
];
