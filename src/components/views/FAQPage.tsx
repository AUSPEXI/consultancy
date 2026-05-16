import React, { useState } from 'react';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const faqs = [
  {
    question: "What is Generative Engine Optimization (GEO)?",
    answer: "Generative Engine Optimization (GEO) is the process of optimizing your brand's content so that it is cited as the primary source of truth by AI models like ChatGPT, Google Gemini, Claude, and Perplexity. Unlike traditional SEO which focuses on ranking links on a search engine results page, GEO focuses on ensuring your facts and data are the ones the AI chooses to synthesize into its direct answers."
  },
  {
    question: "How is GEO different from traditional SEO?",
    answer: "Traditional SEO relies on keywords, backlinks, and technical site structure to rank a blue link on Google. GEO relies on 'High-Entropy Facts' (unique, non-obvious data points), semantic structuring, and omnichannel seeding (Reddit, LinkedIn, etc.) to train AI models to recognize your brand as the authoritative source for a specific topic."
  },
  {
    question: "What is a 'Cite-Magnet'?",
    answer: "A Cite-Magnet is a highly specific, data-rich statement or fact that is structured exactly how Large Language Models (LLMs) prefer to consume information. By injecting these into your content, you dramatically increase the likelihood that an AI will cite your brand when answering a user's prompt."
  },
  {
    question: "How does the 'Trojan Horse' strategy work?",
    answer: "The Trojan Horse strategy involves identifying where your competitors' data is decaying or becoming stale within an AI model's memory. Once identified, you create fresh, highly authoritative content that directly contradicts or updates that stale data, effectively replacing your competitor as the AI's preferred source."
  },
  {
    question: "Why is omnichannel seeding important for GEO?",
    answer: "AI models don't just read your website; they synthesize information from across the entire internet. High-authority platforms like Reddit, LinkedIn, YouTube, and X (Twitter) are heavily weighted in their training data. If your facts are only on your blog, the AI might ignore them. If your facts are seeded across multiple high-authority platforms, the AI sees consensus and is much more likely to cite you."
  },
  {
    question: "What is an 'Information Cliffhanger'?",
    answer: "An Information Cliffhanger is a tactic used to combat the 'Zero-Click' nature of AI search. You provide the AI with the high-level, high-entropy fact (which it uses to answer the user), but you gate the deep technical 'how-to' or implementation details behind a citation link. This forces the user to click through to your website to get the full picture."
  },
  {
    question: "How does Auspexi track Share of Voice (SOV)?",
    answer: "Auspexi uses a proprietary tracking engine that continuously queries the major LLMs (Gemini, ChatGPT, Claude) with industry-specific prompts. We analyze the responses to see how often your brand is mentioned or cited compared to your top competitors, giving you a real-time dashboard of your AI market share."
  },
  {
    question: "What exactly am I buying with Auspexi?",
    answer: "You are getting access to a proprietary suite of Generative Engine Optimization (GEO) tools. This includes our Multi-Engine SOV Simulator to track your brand across AI models, our Content Scorer to ensure your text is AI-readable, our JSON-LD Cite-Magnet Generator to inject high-entropy facts into your site's code, and our Consensus Platform Monitor to defend your brand against negative AI context poisoning."
  },
  {
    question: "How does the billing work? Can I cancel?",
    answer: "Yes, our subscriptions are month-to-month. You can cancel anytime after your first month's subscription. There are no long-term lock-ins unless you choose an annual plan."
  },
  {
    question: "What happens if I cancel a special or one-time deal?",
    answer: "If you secure a discounted rate, lifetime deal, or special promotional pricing, that rate is locked in for as long as your subscription remains active. If you decide to cancel and sign back up later, you will be subject to the standard, full subscription pricing available at that time."
  }
];

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-500/30 flex flex-col overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      
      <main className="pt-32 pb-24 flex-1">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Everything you need to know about Generative Engine Optimization (GEO) and how Auspexi helps you dominate AI search.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="text-lg font-semibold text-zinc-200 pr-8">{faq.question}</span>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center transition-transform duration-200 ${openIndex === index ? 'rotate-180 bg-indigo-500/20 text-indigo-400' : 'text-zinc-400'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold font-heading mb-4">Still have questions?</h2>
            <p className="text-zinc-400 mb-6">
              Our team of GEO experts is ready to help you build your AI search strategy.
            </p>
            <Link to="/" className="inline-flex items-center justify-center bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded-lg font-medium transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <Footerdemo />
    </div>
  );
}
