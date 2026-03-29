import React from 'react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const blogPosts = [
  {
    slug: "enterprise-geo-audit-logging",
    title: "Securing the AI Era: Why Audit Logging is the Foundation of Enterprise GEO",
    category: "Security & Compliance",
    date: "Mar 29, 2026",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
    excerpt: "As Generative Engine Optimization becomes mission-critical, enterprise security cannot be an afterthought. Discover how Auspexi's new Advanced Audit Logging lays the groundwork for SOC 2 Type II compliance.",
    content: `
      <h2>The Enterprise Shift to GEO</h2>
      <p>
        Generative Engine Optimization (GEO) is no longer an experimental marketing tactic; it is a mission-critical enterprise function. As organizations shift their budgets from traditional SEO to AI visibility, the platforms managing this transition must meet rigorous enterprise security standards.
      </p>
      <p>
        When you are manipulating the data that trains the world's most powerful AI models, the stakes are incredibly high. A single compromised account or unauthorized change to your "Fact-Vault" could result in negative context poisoning or the loss of hard-won Share of Voice (SOV).
      </p>
      
      <h3>Why Audit Logging Matters</h3>
      <p>
        In the enterprise software world, accountability is everything. If a critical piece of semantic HTML is altered, or a new competitor tracking campaign is launched, security teams need to know <strong>who</strong> did it, <strong>what</strong> was changed, and <strong>when</strong> it happened.
      </p>
      <ul>
        <li><strong>Immutability:</strong> True audit logs cannot be altered or deleted, even by administrators. They provide a cryptographically secure record of events.</li>
        <li><strong>Compliance:</strong> Frameworks like SOC 2 Type II require comprehensive tracking of all system changes and user access.</li>
        <li><strong>Forensics:</strong> In the event of an anomaly (like a sudden drop in AI citations), audit logs allow teams to trace the root cause back to specific configuration changes.</li>
      </ul>

      <h2>Auspexi's Advanced Audit Logging</h2>
      <p>
        Today, we are thrilled to announce the rollout of <strong>Advanced Audit Logging</strong> across the Auspexi platform. Available starting on our Basic tier, this feature automatically tracks and records every significant action taken within your workspace.
      </p>
      <p>
        Whether a user is extracting high-entropy facts, running a multi-engine SOV simulation, or deploying a new Edge SEO Cloudflare Worker, the action is securely logged to our immutable Firestore database.
      </p>
      
      <h3>The Path to SOC 2 Type II</h3>
      <p>
        The introduction of Advanced Audit Logging is a major milestone on our roadmap to achieving SOC 2 Type II compliance. We are building Auspexi on a foundation of security and trust, ensuring that our enterprise partners can deploy GEO strategies with complete confidence.
      </p>
      <p>
        By choosing Auspexi, you aren't just getting the most advanced GEO tool on the market; you are partnering with a platform that takes your data security as seriously as your AI visibility.
      </p>
    `
  },
  {
    slug: "death-of-blue-link",
    title: "The Death of the Blue Link: Why SEO is Evolving",
    category: "Industry Trends",
    date: "Mar 12, 2026",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
    excerpt: "Traditional search engines are losing market share to generative AI. Here's how to adapt your strategy for the new era of zero-click search."
  },
  {
    slug: "build-cite-magnet",
    title: "How to Build a 'Cite-Magnet' that ChatGPT Loves",
    category: "Tactics",
    date: "Mar 05, 2026",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    excerpt: "Learn the exact data structures and high-entropy formatting techniques that force LLMs to cite your content as the primary source."
  },
  {
    slug: "case-study-sov",
    title: "Case Study: Stealing 40% SOV from a Legacy Competitor",
    category: "Case Studies",
    date: "Feb 28, 2026",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    excerpt: "How a B2B SaaS startup used Auspexi's Trojan Horse strategy to replace their biggest competitor in Gemini's training data."
  },
  {
    slug: "geo-vs-seo",
    title: "GEO vs SEO: What's the Real Difference?",
    category: "Fundamentals",
    date: "Feb 15, 2026",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    excerpt: "Search Engine Optimization is about ranking links. Generative Engine Optimization is about ranking facts. Understand the paradigm shift."
  },
  {
    slug: "omnichannel-seeding",
    title: "The Power of Omnichannel Fact Seeding",
    category: "Strategy",
    date: "Feb 02, 2026",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
    excerpt: "Why posting your high-entropy facts across Reddit, LinkedIn, and Twitter is critical for training the next generation of LLMs."
  },
  {
    slug: "information-cliffhangers",
    title: "Mastering Information Cliffhangers for AI Traffic",
    category: "Tactics",
    date: "Jan 20, 2026",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    excerpt: "How to give AI models exactly what they need to answer the user's question, while gating the 'how-to' behind a click."
  }
];

export function BlogPage() {
  const { signInWithGoogle } = useAuth();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">GEO Strategy Insights</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              The latest tactics, research, and case studies on Generative Engine Optimization. Learn how to dominate AI search.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link to={`/blog/${post.slug}`} key={post.slug} className="group cursor-pointer bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors flex flex-col">
                <div className="aspect-[16/9] overflow-hidden border-b border-zinc-800">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 mb-3">
                    <span className="text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md">{post.category}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug mb-3">
                    {post.title}
                  </h3>
                  <p className="text-zinc-400 text-sm line-clamp-3 mt-auto">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footerdemo />
    </div>
  );
}
