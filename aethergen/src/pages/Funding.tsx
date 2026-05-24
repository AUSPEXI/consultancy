import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Rocket, 
  Award, 
  Globe, 
  Brain, 
  Database, 
  Shield, 
  Zap, 
  Users, 
  Target, 
  CheckCircle, 
  Star,
  ArrowRight,
  DollarSign,
  BarChart3,
  Factory,
  Activity,
  TrendingDown,
  Code,
  Server
} from 'lucide-react';

const Funding = () => {
  const investmentRounds = [
    {
      round: 'Preseed',
      amount: '$2M',
      valuation: '$50M',
      equity: '4%',
      use: 'Customer acquisition, team expansion, infrastructure scaling',
      timeline: 'Q1 2025',
      status: 'Open',
      highlights: [
        '1 billion synthetic records generated',
        '11 proprietary inventions operational',
        'Automotive quality and production partnerships ready',
        'Clear service model established',
        'Multi-industry offerings defined'
      ]
    },
    {
      round: 'Series A',
      amount: '$50M',
      valuation: '$500M+',
      equity: '10%',
      use: 'Market expansion, product development, international scaling',
      timeline: 'Q4 2025',
      status: 'Planned',
      highlights: [
        'Multi-industry deployment',
        'Enterprise platform scaling',
        'Global market expansion',
        'Foundation model development'
      ]
    }
  ];

  const marketOpportunity = [
    {
      market: 'Synthetic Data Market',
      size: '$2.5B',
      growth: '45% CAGR',
      description: 'Current market for synthetic data generation and AI training',
      icon: Database,
      color: 'text-blue-600'
    },
    {
      market: 'AI Model Training Market',
      size: '$50B+',
      growth: '35% CAGR',
      description: 'Enterprise AI model training and deployment services',
      icon: Brain,
      color: 'text-purple-600'
    },
    {
      market: 'Multi-Industry AI Solutions',
      size: '$200B+',
      growth: 'New Markets',
      description: 'Creating AI solutions for previously inaccessible industries',
      icon: Globe,
      color: 'text-green-600'
    }
  ];

  const competitiveAdvantages = [
    {
      title: 'Proven Scale Capability',
      description: 'Billion‑row synthetic dataset demonstration with validated metrics',
      icon: Award,
      impact: 'Unlimited scale proven'
    },
    {
      title: '11 Proprietary Inventions',
      description: 'Platform inventions, advanced mathematical systems',
      icon: Rocket,
      impact: 'Unmatched technological advantage'
    },
    {
      title: '90% Cost Savings',
      description: 'vs Bloomberg Terminal and traditional solutions',
      icon: TrendingDown,
      impact: 'Immediate market disruption'
    },
    {
      title: 'Strategic Automotive Partnerships',
      description: 'Direct response to leading automotive quality and production requirements',
      icon: Factory,
      impact: 'Proven customer demand'
    },
    {
      title: 'Clear Service Model',
      description: 'Self-service and full-service options for all customer types',
      icon: Users,
      impact: 'Flexible customer acquisition'
    }
  ];

  const financialProjections = [
    {
      year: '2025',
      revenue: '$2M',
      customers: '50+',
      description: 'Automotive partnerships, healthcare fraud detection launch'
    },
    {
      year: '2026',
      revenue: '$25M',
      customers: '500+',
      description: 'Multi-industry expansion, enterprise platform scaling'
    },
    {
      year: '2027',
      revenue: '$100M+',
      customers: '2000+',
      description: 'Global market expansion, foundation model delivery'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Investment Opportunities
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join us in revolutionizing synthetic data generation and AI innovation with proven 1 billion record capability
          </p>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Market Opportunity</h2>
            <p className="text-xl text-slate-600">Evidence‑led platform addressing significant market opportunities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {marketOpportunity.map((market, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center hover:border-blue-300 transition-all duration-300 shadow-md"
              >
                <market.icon className={`w-16 h-16 mx-auto mb-6 ${market.color}`} />
                <h3 className="text-xl font-bold text-slate-900 mb-3">{market.market}</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">{market.size}</div>
                <div className="text-green-600 font-semibold mb-3">{market.growth}</div>
                <p className="text-slate-600">{market.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Rounds */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Investment Rounds</h2>
            <p className="text-xl text-slate-600">Strategic funding for revolutionary growth</p>
          </div>

          <div className="space-y-8">
            {investmentRounds.map((round, index) => (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-xl p-8 shadow-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{round.round} Round</h3>
                    <div className="flex items-center space-x-6">
                      <div>
                        <div className="text-sm text-slate-500">Amount</div>
                        <div className="text-2xl font-bold text-blue-600">{round.amount}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Valuation</div>
                        <div className="text-2xl font-bold text-green-600">{round.valuation}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Equity</div>
                        <div className="text-2xl font-bold text-purple-600">{round.equity}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500 mb-2">Timeline</div>
                    <div className="text-lg font-semibold text-slate-900">{round.timeline}</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                      round.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {round.status}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">Use of Funds</h4>
                  <p className="text-slate-600">{round.use}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">Key Highlights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {round.highlights.map((highlight, highlightIndex) => (
                      <div key={highlightIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-slate-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Competitive Advantages</h2>
            <p className="text-xl text-slate-600">Unmatched technological leadership and market position</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {competitiveAdvantages.map((advantage, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-all duration-300 shadow-md"
              >
                <advantage.icon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-3 text-center">{advantage.title}</h3>
                <p className="text-slate-600 text-center mb-4">{advantage.description}</p>
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {advantage.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Invest?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join us in revolutionizing synthetic data generation and AI innovation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Contact Investment Team
              </Link>
              <Link
                to="/about"
                className="border border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Funding;
