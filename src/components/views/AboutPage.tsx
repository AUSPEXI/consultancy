import { motion } from 'framer-motion';
import { Target, BrainCircuit, LineChart, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/ui/public-header';
import { Footerdemo } from '@/components/ui/footer-section';
import { useAuth } from '@/contexts/AuthContext';

export function AboutPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pt-24 pb-16 overflow-x-hidden">
      <PublicHeader onLoginClick={signInWithGoogle} />
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Mastering Brand Visibility in the <span className="text-zinc-400">Generative Era</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto">
            Search has fundamentally changed. We build the deterministic infrastructure required to ensure your business is cited, recommended, and trusted by the world's leading AI models.
          </p>
        </motion.div>

        {/* Bio Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative shadow-2xl">
              <img 
                src="/bio-pic.png" 
                alt="Gwylym Pryce-Owen" 
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl font-bold text-white mb-1">Gwylym Pryce-Owen</h3>
                <p className="text-zinc-300 text-lg">Founder & Chief AI Architect</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 text-zinc-300 text-lg leading-relaxed"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Engineering the Future of Discovery</h2>
            <p>
              For over 25 years, I have built, scaled, and led successful businesses. My roots in digital visibility run deep—I've been at the helm of an SEO marketing agency that has evolved alongside Google since its earliest days. I know what it takes to capture market share in a crowded digital landscape.
            </p>
            <p>
              But the paradigm has shifted. Traditional search is being rapidly eclipsed by Generative AI.
            </p>
            <p>
              Over the past three years, I have immersed myself at the bleeding edge of AI architecture. I don't just use AI tools; I engineer production-grade, deterministic AI systems. By understanding exactly how Large Language Models retrieve, score, and generate information, I saw a critical gap in the market: businesses were disappearing from the new AI-driven search results.
            </p>
            <p>
              That's why I built <strong>Auspexi</strong>. Combining decades of business and SEO acumen with cutting-edge AI engineering, Auspexi is a Generative Engine Optimization (GEO) platform that sits 18 months ahead of traditional marketing agencies. We don't guess; we engineer your visibility.
            </p>
            <div className="pt-6">
              <Link to="/#pricing">
                <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 py-6 text-base font-medium">
                  Secure Your GEO Advantage <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* The Philosophy */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-16 mb-32 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-zinc-800/30 rounded-full blur-3xl" />
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Why Generative Engine Optimization?</h2>
            <p className="text-xl text-zinc-400">
              We are moving from an era of "Probabilistic Guesswork" to "Deterministic Truth."
            </p>
            <p className="text-lg text-zinc-300">
              When a potential customer asks ChatGPT, Gemini, or Perplexity for a recommendation, the AI doesn't just provide a list of links—it provides a definitive answer. If your brand isn't structured and cited in a way these models understand, you simply do not exist in their reality.
            </p>
            <blockquote className="border-l-4 border-zinc-500 pl-8 py-4 my-12 text-2xl font-medium italic text-zinc-200 text-left bg-zinc-900/50 rounded-r-xl">
              "The future of digital marketing isn't about gaming an algorithm; it's about becoming the undeniable, deterministic truth within an AI's knowledge graph."
            </blockquote>
          </div>
        </motion.div>

        {/* The Architecture */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">The Auspexi Advantage</h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Built on deep AI architectural principles, our platform ensures your brand is the logical output for high-intent queries.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-8 h-8 text-zinc-100" />,
                title: "Precision Targeting",
                desc: "We analyze how LLMs process queries in your industry, identifying the exact semantic triggers needed to position your brand as the top recommendation."
              },
              {
                icon: <BrainCircuit className="w-8 h-8 text-zinc-100" />,
                title: "Knowledge Graph Integration",
                desc: "We structure your brand's digital footprint so it seamlessly integrates into the knowledge graphs that power modern AI engines."
              },
              {
                icon: <LineChart className="w-8 h-8 text-zinc-100" />,
                title: "Deterministic Results",
                desc: "Moving beyond traditional SEO guesswork, we use rigorous, data-driven methodologies to track, verify, and secure your AI citation share."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:bg-zinc-800/80 transition-colors"
              >
                <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-lg">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The Economics & Verdict */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Partner with Authority</h2>
              <p className="text-xl text-zinc-400 mb-8">
                When you subscribe to Auspexi, you aren't just buying software. You are partnering with a team that understands the fundamental architecture of the AI revolution.
              </p>
              <ul className="space-y-6">
                {[
                  "25+ years of proven business and marketing leadership",
                  "Deep expertise in AI orchestration and LLM mechanics",
                  "Strategies built for the next decade of search",
                  "A system engineered 18 months ahead of the curve"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-zinc-300 text-lg">
                    <CheckCircle2 className="w-6 h-6 text-zinc-500 shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl"
          >
            <ShieldCheck className="w-12 h-12 text-zinc-100 mb-8" />
            <h3 className="text-3xl font-bold text-white mb-6">Don't Get Left Behind</h3>
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
              The transition to Agentic AI and Generative Search is happening now. Secure your brand's position as the authoritative answer before your competitors do.
            </p>
            <Link to="/#pricing">
              <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-xl py-6 text-lg font-medium">
                Start Your GEO Journey
              </Button>
            </Link>
          </motion.div>
        </div>

      </div>
      <Footerdemo />
    </div>
  );
}
