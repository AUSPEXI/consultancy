'use client'

import React, { useState } from 'react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_FAQS = [
  { question: "What is Generative Engine Optimization (GEO)?", answer: "Generative Engine Optimization (GEO) is the process of optimizing your brand's content so that it is cited as the primary source of truth by AI models like ChatGPT, Google Gemini, Claude, and Perplexity. Unlike traditional SEO which focuses on ranking links on a search engine results page, GEO focuses on ensuring your facts and data are the ones the AI chooses to synthesize into its direct answers." },
  { question: "How is GEO different from traditional SEO?", answer: "Traditional SEO relies on keywords, backlinks, and technical site structure to rank a blue link on Google. GEO relies on 'High-Entropy Facts' (unique, non-obvious data points), semantic structuring, and omnichannel seeding (Reddit, LinkedIn, etc.) to train AI models to recognize your brand as the authoritative source for a specific topic." },
  { question: "How does the '768-D Latent Space' mapping work?", answer: "We use Gemini's native embedding dimensions (768) to map your brand's relationship to thousands of semantic themes. By visualizing this as a UMAP projection, we can mathematically calculate how close your brand is to values like 'Trustworthy', 'Enterprise-Grade', or 'Cost-Effective' within an LLM's neural network." },
  { question: "What is a 'Cite-Magnet'?", answer: "A Cite-Magnet is a highly specific, data-rich statement or fact that is structured exactly how Large Language Models (LLMs) prefer to consume information. By injecting these into your content, you dramatically increase the likelihood that an AI will cite your brand when answering a user's prompt." },
  { question: "What is 'Deterministic Inference' in brand sentiment?", answer: "Standard sentiment analysis uses probabilistic guesswork. We use deterministic inference by comparing your actual brand facts against model outputs in real-time. This allows us to spot 'Generative Noise'—where a model is hallucinating about your brand—and correct it at the source." },
  { question: "How does the 'Trojan Horse' strategy work?", answer: "The Trojan Horse strategy involves identifying where your competitors' data is decaying or becoming stale within an AI model's memory. Once identified, you create fresh, highly authoritative content that directly contradicts or updates that stale data, effectively replacing your competitor as the AI's preferred source." },
  { question: "What is 'Entropy-Based Fact Extraction'?", answer: "We analyze your documents to find 'high-entropy' facts—sentences that provide maximum information density. These are the pieces of information that AI models prioritize during training or RAG (Retrieval-Augmented Generation) calls because they solve user queries most efficiently." },
  { question: "How do you detect 'Sentiment Drift' using Z-Scores?", answer: "We track your brand's perception across models over time. By applying a rolling Z-Score analysis, we can distinguish between standard model variance (noise) and significant shifts in brand sentiment (drift), allowing for proactive reputation management." },
  { question: "How does the pgvector backend provide a technical moat?", answer: "Our system utilizes an enterprise-grade pgvector database to store and query millions of latent space embeddings. This allows us to perform hybrid search—combining traditional metadata filtering with dense vector similarity—to find exactly where your brand visibility is leaking at scale." },
  { question: "Can Auspexi automate blog generation for GEO?", answer: "Yes. Our multi-agent orchestration trains specific blog-generation agents on your own 'Fact Vault'. This ensures every piece of content produced is pre-optimized with cite-magnets and structured precisely for LLM ingestion, rather than just being 'generic AI content'." },
  { question: "How do we handle the 'Zero-Click' AI search problem?", answer: "We employ 'Information Cliffhangers'. We provide the AI with the core high-entropy fact (securing the citation) but gate the deep implementation details or proprietary 'how-to' knowledge. This satisfies the AI's need for an answer while incentivizing high-intent users to click through for the full solution." },
  { question: "What is 'Ontological Interoperability'?", answer: "Different AI models use different knowledge schemas. We ensure your brand's data is formatted with universal schema markers (Ontologies) so that whether it's Claude, ChatGPT, or an Edge LLM reading your data, they all reach the same deterministic conclusion about your authority." },
  { question: "Is my data secure with Auspexi's 6-layer architecture?", answer: "Yes. We employ 6-layer security: SOC2-compliant data centers, end-to-end AES-256 encryption, isolated multi-tenant vector namespaces, PII masking at the collection layer, strict role-based access (RBAC), and automated threat detection on every API call." },
  { question: "How often should I run an AI Audit?", answer: "For enterprise brands, we recommend weekly continuous audits. LLMs are updated, fine-tuned, and retrained constantly. Weekly audits allow you to see exactly how new training data or model weights are affecting your Share of Voice (SOV) before the damage becomes permanent." },
  { question: "What is a 'Latent Space Hallucination'?", answer: "This is when an AI model mistakenly clusters your brand with negative concepts (e.g., 'scam' or 'slow') because of outdated or noisy data in its training set. Auspexi identifies these false clusters and provides a seeding roadmap to 'break' these negative associations." },
  { question: "How does the billing work? Can I cancel?", answer: "Yes, our subscriptions are month-to-month. You can cancel anytime after your first month's subscription. There are no long-term lock-ins unless you choose an annual plan." },
  { question: "What happens if I cancel a special or one-time deal?", answer: "If you secure a discounted rate, lifetime deal, or special promotional pricing, that rate is locked in for as long as your subscription remains active. If you decide to cancel and sign back up later, you will be subject to the standard, full subscription pricing." }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);

  const displayedFaqs = showAll ? ALL_FAQS : ALL_FAQS.slice(0, 8);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 flex flex-col overflow-x-hidden">
      <PublicHeader />

      <main className="pt-32 pb-24 flex-1">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold border border-pink-500/20 mb-6 uppercase tracking-widest"
            >
              Master the AI Web
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Deep-dive into the technical architecture of GEO and how Auspexi ensures your brand is the irrefutable truth in the generative era.
            </p>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {displayedFaqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-zinc-900/30 border border-zinc-805 rounded-2xl overflow-hidden transition-all duration-300 group ${openIndex === index ? 'border-pink-500/30 bg-zinc-900/50' : 'hover:border-zinc-750'}`}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className={`text-lg font-bold transition-colors ${openIndex === index ? 'text-white' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                      {faq.question}
                    </span>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center transition-all duration-300 ${openIndex === index ? 'rotate-90 bg-pink-500 text-white border-pink-500' : 'text-zinc-500 group-hover:text-zinc-350'}`}>
                      {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>

                  <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[500px] pb-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-2 border-t border-zinc-800/50">
                      <p className="text-zinc-400 leading-relaxed text-sm italic bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/30 font-sans">
                        {faq.answer}
                      </p>
                      <div className="mt-4 flex items-center gap-2 opacity-35">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                        <span className="text-[10px] font-mono uppercase tracking-widest">Fact_Confidence_98.4%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!showAll && ALL_FAQS.length > 8 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowAll(true)}
                className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-full border border-zinc-800 transition-all hover:scale-105 active:scale-95"
              >
                Show All {ALL_FAQS.length} Questions
              </button>
            </div>
          )}

          <div className="mt-24 relative">
            <div className="absolute inset-0 bg-pink-500/5 blur-3xl rounded-full" />
            <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 text-center overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <ChevronDown className="w-32 h-32 text-pink-500" />
              </div>
              <h2 className="text-3xl font-bold font-heading mb-4 text-white">Still have questions?</h2>
              <p className="text-zinc-400 mb-8 max-w-xl mx-auto text-lg leading-relaxed font-sans">
                Generative Engine Optimization is a rapidly evolving frontier. Our architects are available for strategic consultations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/" className="inline-flex items-center justify-center bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-full font-bold transition-all hover:scale-105">
                  Book Strategic Call
                </Link>
                <a href="mailto:sales@auspexi.com" className="inline-flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-full font-bold border border-zinc-700 transition-all">
                  Email Architecture Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footerdemo />
    </div>
  );
}
