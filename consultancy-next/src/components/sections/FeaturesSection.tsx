import { BarChart3, Brain, Target, Database, ShieldAlert, Zap, Activity, Search } from 'lucide-react'

const features = [
  {
    icon: Search,
    name: 'Zero-Click Dominance',
    description: 'Ensure your brand is the definitive answer when users query AI.',
  },
  {
    icon: Brain,
    name: 'Citacious AI Analyst',
    description: 'A dedicated AI analyst that understands your dashboard and orchestrates intelligent actions.',
  },
  {
    icon: Target,
    name: 'Cite-Magnet Injection',
    description: 'Inject High-Entropy Facts to force AI models to cite your content.',
  },
  {
    icon: Database,
    name: 'Fact-Vault Extraction',
    description: 'Automatically find the highest-entropy data points in your content.',
  },
  {
    icon: BarChart3,
    name: 'SOV Simulator & Brand Monitor',
    description: 'Track your brand visibility across Gemini, ChatGPT, and Claude.',
  },
  {
    icon: Activity,
    name: 'Z-Score Sentiment Drift',
    description: 'Real-time anomaly detection for brand reputation shifts.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">The Auspexi Arsenal</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Everything you need to dominate AI Answer Engines and secure your Share of Voice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition">
                  <Icon className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.name}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
