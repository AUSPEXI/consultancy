import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

// Blog post data – curated, evidence-led posts only
const blogPostsData = {
  'phoenix-rising-journey': {
    title: '🎭 Phoenix Rising: A Founder’s Journey',
    excerpt: 'How a personal reset, disciplined work, and evidence-led engineering shaped AethergenPlatform. A human story behind the technology.',
    author: 'Gwylym Owen',
    date: 'January 12, 2025',
    readTime: '8 min read',
    category: 'Founder Story',
    content: `
      <h2>A disciplined build</h2>
      <p>Behind the platform is a straightforward story: reset, focus, and ship. Long weeks, measured progress, and a commitment to evidence over hype.</p>
      <h2>What mattered</h2>
      <p>Clear requirements, small validated steps, and transparent outcomes. That’s the through‑line from idea to working system.</p>
    `
  },
  'evidence-led-ai-regulated-industries': {
    title: '📜 Evidence‑Led AI in Regulated Industries: A Practical Guide',
    excerpt: 'How to deploy synthetic‑first, evidence‑led AI in finance, healthcare, and government with privacy, auditability, and scale.',
    author: 'Gwylym Owen',
    date: 'January 16, 2025',
    readTime: '9 min read',
    category: 'Technology',
    content: `
      <h2>Why Evidence Matters More Than Ever</h2>
      <p>In regulated environments—finance, healthcare, government, critical services—innovation only sticks when it stands on evidence.</p>
      <h2>Proof Over Promises</h2>
      <p>Every dataset and model can ship with an evidence bundle: lineage, metrics, ablation traces, and model cards.</p>
    `
  },
  'databricks-marketplace-lab-to-revenue': {
    title: '🧪➡️💸 Databricks Marketplace: From Lab to Revenue in Days',
    excerpt: 'Turn synthetic datasets and niche models into marketplace listings with bundled evidence and enterprise‑ready packaging.',
    author: 'Gwylym Owen',
    date: 'January 17, 2025',
    readTime: '8 min read',
    category: 'Business Strategy',
    content: `
      <h2>Why Marketplace First?</h2>
      <p>Data and model marketplaces compress distribution cycles for buyers and sellers.</p>
    `
  },
  'pricing-and-entitlements-explained': {
    title: '💡 Pricing & Entitlements Explained: Self‑Service vs Full‑Service',
    excerpt: 'How our tiers map to real‑world needs, prevent cannibalisation, and clarify who runs compute.',
    author: 'Gwylym Owen',
    date: 'January 18, 2025',
    readTime: '7 min read',
    category: 'Business Strategy',
    content: `
      <h2>Two Clear Paths</h2>
      <p>Self‑Service: you run compute. Full‑Service: we run and manage in your cloud.</p>
    `
  },
  'synthetic-data-lifecycle': {
    title: '🔁 The Synthetic Data Lifecycle: From Seeds to Evidence',
    excerpt: 'A practical tour of how synthetic data flows through design, generation, validation, and evidence bundling—without exposing PHI/PII.',
    author: 'Gwylym Owen',
    date: 'January 18, 2025',
    readTime: '8 min read',
    category: 'Technology',
    content: `
      <h2>Design → Generate → Validate → Evidence → Ship</h2>
      <p>Evidence‑led from the start. No PHI/PII.</p>
    `
  },
  'evidence-bundles-and-testing': {
    title: '📦 Evidence Bundles & Testing: Trustworthy AI Without Exposing IP',
    excerpt: 'What we publish (and what we deliberately withhold). Evidence that convinces risk teams while protecting core IP.',
    author: 'Gwylym Owen',
    date: 'January 19, 2025',
    readTime: '9 min read',
    category: 'Technology',
    content: `
      <h2>Evidence That Stands Up</h2>
      <p>Lineage, metrics, ablations, and model cards—without exposing trade secrets.</p>
    `
  },
  'schema-designer-multi-data-llm': {
    title: '🧱 Schema Designer & Multi‑Data Pipelines for LLMs',
    excerpt: 'Design schemas, harmonise multi‑domain data, and scale synthetic generation to billions—then train niche or large models.',
    author: 'Gwylym Owen',
    date: 'January 19, 2025',
    readTime: '10 min read',
    category: 'Technology',
    content: `
      <h2>From Schema to Scale</h2>
      <p>Harmonise domains and scale generation; train niche or larger models with clear entitlements.</p>
    `
  },
  'from-starlings-to-swarms-8d-safety': {
    title: '🕊️ From Starlings to Swarms: 8D Safety for Thousands of Drones',
    excerpt: 'How an 8D state manifold, safety controllers, and evidence-led evaluation can enable resilient drone swarms—without disclosing proprietary algorithms.',
    author: 'Gwylym Owen',
    date: 'January 20, 2025',
    readTime: '9 min read',
    category: 'Case Study',
    content: `
      <h2>What this demonstrates</h2>
      <p>We outline a path to large swarms (1k–15k+) that remain stable under faults by combining an 8D agent state, topological neighborhoods, and hard safety constraints. This post shares the safety and evaluation concepts—not proprietary control algorithms.</p>

      <h2>8D state and topological flocking</h2>
      <p>Each agent tracks position/velocity plus risk/health and link quality in an 8D state. Local control uses a topological neighborhood (≈7 nearest by connectivity), improving resilience under uneven density—similar to starling murmurations.</p>

      <h2>Safety-first control</h2>
      <p>Control Barrier Functions (CBFs) and a Real-Time Assurance (RTA) supervisor enforce minimum separation, geofences, and fail-safe behaviors (hover/rise/land). Resilient consensus filters out faulty nodes to avoid cascade failures.</p>

      <h2>Training and evaluation</h2>
      <p>Using NVIDIA Isaac/Omniverse, we stress scenarios with wind, GPS bias, latency, and injected faults. Evidence bundles report safety violations per flight-hour, resilience under k failures, connectivity, and efficiency—signed for procurement.</p>

      <h2>Why this matters</h2>
      <p>Military, public safety, and enterprise shows face growing scale and reliability demands. This approach supports fully offline, air-gapped deployments with signed evidence and policy packs—aligning with high-security requirements.</p>

      <h2>Get in touch</h2>
      <p>Interested in pilots for regulated environments? Contact sales@auspexi.com. We can tailor evaluation protocols and offline packaging to your device profiles.</p>
    `
  }
};

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = React.useState<any | null>((blogPostsData as any)[slug as keyof typeof blogPostsData] || null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const rh = await fetch(`/blog-html/${encodeURIComponent(slug || '')}.html?ts=${Date.now()}`).catch(()=>null as any)
        if (!cancelled && rh && rh.ok) {
          let htmlRaw = await rh.text()
          // Strip boilerplate date phrases like ", live as of September 1, 2025." across all blogs
          const re1 = /\s*[,–—-]?\s*(?:all\s+)?[Ll]ive as of\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\.?/g;
          const re2 = /\s*are\s+[Ll]ive as of\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\.?/gi;
          htmlRaw = htmlRaw.replace(re1, '').replace(re2, '');
          const h1 = htmlRaw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
          const title = h1 ? h1[1].replace(/<[^>]*>/g,'').trim() : String(slug || '').replace(/-/g,' ')
          const p1m = htmlRaw.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
          const excerpt = p1m ? p1m[1].replace(/<[^>]*>/g,'').trim().slice(0, 280) : ''
          const wordCount = String(htmlRaw).replace(/<[^>]+>/g,' ').trim().split(/\s+/).filter(Boolean).length
          const readTime = `${Math.max(2, Math.round(wordCount/200))} min read`
          const contentSanitised = htmlRaw.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '').trim()
          setPost({ slug, title, excerpt, content_html: contentSanitised, author: 'Gwylym Owen', category: 'Blog', readTime, published_at: new Date().toISOString() })
          setIsLoading(false)
          return
        }
      } catch {}
      if (!cancelled) {
        // fallback to curated map
        setPost((blogPostsData as any)[slug as keyof typeof blogPostsData] || null)
        setIsLoading(false)
      }
    })();
    return () => { cancelled = true };
  }, [slug]);

  // SEO: canonical, meta description, Article JSON-LD
  React.useEffect(() => {
    if (!post || !slug) return
    const canonicalHref = `https://auspexi.com/blog/${encodeURIComponent(String(slug))}`
    // canonical
    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!linkEl) {
      linkEl = document.createElement('link')
      linkEl.setAttribute('rel', 'canonical')
      document.head.appendChild(linkEl)
    }
    linkEl.setAttribute('href', canonicalHref)
    // meta description
    let descEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!descEl) {
      descEl = document.createElement('meta')
      descEl.setAttribute('name', 'description')
      document.head.appendChild(descEl)
    }
    descEl.setAttribute('content', (post as any).excerpt || '')
    // JSON-LD
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: (post as any).title || String(slug),
      author: { '@type': 'Person', name: (post as any).author || 'Auspexi' },
      mainEntityOfPage: canonicalHref,
      datePublished: (post as any).published_at || new Date().toISOString(),
      dateModified: new Date().toISOString(),
      image: 'https://auspexi.com/og-image.svg',
      publisher: { '@type': 'Organization', name: 'Auspexi' },
      description: (post as any).excerpt || ''
    }
    let ldEl = document.getElementById('ld-article-json') as HTMLScriptElement | null
    if (!ldEl) {
      ldEl = document.createElement('script')
      ldEl.type = 'application/ld+json'
      ldEl.id = 'ld-article-json'
      document.head.appendChild(ldEl)
    }
    ldEl.textContent = JSON.stringify(ld)
    return () => {
      // Keep canonical/meta for history navigation; no cleanup to avoid flashes
    }
  }, [post, slug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-7 bg-slate-200 rounded w-64 mx-auto mb-4" />
          <div className="h-4 bg-slate-200 rounded w-80 mx-auto mb-2" />
          <div className="h-4 bg-slate-200 rounded w-72 mx-auto" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Article Not Found</h1>
          <p className="text-slate-600 mb-8">The article you're looking for doesn't exist.</p>
          <Link to="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
          <button onClick={() => { try { (window as any).history?.back(); } catch {} setTimeout(() => { if (!document.referrer || !/\/[bB]log/.test(document.referrer)) { window.location.href = '/blog'; } }, 50); }} className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </button>
          
          <div className="flex items-center text-sm text-slate-500 mb-4">
            {post.category ? (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium mr-4">
                {post.category}
              </span>
            ) : null}
            <User className="h-4 w-4 mr-2" />
            <span className="mr-4">{post.author}</span>
            <Calendar className="h-4 w-4 mr-2" />
            <span className="mr-4">{(post as any).date || ((post as any).published_at ? new Date((post as any).published_at).toDateString() : '')}</span>
            <Clock className="h-4 w-4 mr-2" />
            <span>{post.readTime || ''}</span>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
          {post.title}
        </h1>
        
        <div className="prose prose-lg max-w-none" style={{
          // Force light code/pre theme across injected HTML
          ['--tw-prose-body' as any]: '#1e293b',
          ['--tw-prose-headings' as any]: '#0f172a',
          ['--tw-prose-links' as any]: '#2563eb',
          ['--tw-prose-bold' as any]: '#0f172a',
          ['--tw-prose-counters' as any]: '#64748b',
          ['--tw-prose-bullets' as any]: '#cbd5e1',
          ['--tw-prose-hr' as any]: '#e2e8f0',
          ['--tw-prose-quotes' as any]: '#0f172a',
          ['--tw-prose-quote-borders' as any]: '#e2e8f0',
          ['--tw-prose-captions' as any]: '#64748b',
          ['--tw-prose-code' as any]: '#1f2937',
          ['--tw-prose-pre-code' as any]: '#1f2937',
          ['--tw-prose-pre-bg' as any]: '#f8fafc',
          ['--tw-prose-th-borders' as any]: '#cbd5e1',
          ['--tw-prose-td-borders' as any]: '#e2e8f0'
        }}>
          <style>{`
            .prose h2 { 
              margin-top: 2rem !important; 
              margin-bottom: 1rem !important; 
              font-size: 1.5rem !important; 
              font-weight: 700 !important; 
              color: #0f172a !important;
            }
            .prose p { 
              margin-bottom: 1.5rem !important; 
              line-height: 1.75 !important;
              color: #1e293b !important;
            }
            .prose strong { 
              color: #0f172a !important; 
              font-weight: 700 !important;
            }
            /* Force readable pre/code regardless of inline or theme styles */
            .prose pre, .prose pre *, .prose code, .prose code * {
              background: #f8fafc !important;
              color: #1f2937 !important;
              text-shadow: none !important;
              mix-blend-mode: normal !important;
            }
            /* Tailwind Typography uses :where() selectors; override them explicitly */
            .prose :where(pre):not(:where(.not-prose *)),
            .prose :where(pre):not(:where(.not-prose *)) *,
            .prose :where(code):not(:where(pre code)) {
              background: #f8fafc !important;
              color: #1f2937 !important;
            }
            .prose pre {
              border: 1px solid #e2e8f0 !important;
              border-radius: 0.5rem !important;
            }
            /* Ensure CTA buttons are readable everywhere */
            .aeg-btn { color: #ffffff !important; }
            .prose a.aeg-btn { color: #ffffff !important; }
            /* Ensure inline keycaps/tokens remain readable */
            .prose .kbd {
              background: #111827 !important;
              color: #ffffff !important;
              border-radius: 4px !important;
              padding: 2px 6px !important;
              font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
              font-size: 0.8em !important;
            }
          `}</style>
          <div 
            dangerouslySetInnerHTML={{ __html: (post as any).content_html || (post as any).content || '' }} 
            className="space-y-8"
          />
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <RouterLink to="/publisher" className="inline-flex items-center text-slate-700 hover:text-slate-900 font-semibold mr-4">
              Create LinkedIn Draft for this post
            </RouterLink>
            <a
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
            >
              Share on LinkedIn
            </a>
          </div>
          <Link to="/blog" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;