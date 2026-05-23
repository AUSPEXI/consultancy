import React from 'react';
import { 
  Factory, 
  Activity, 
  TrendingUp, 
  Database, 
  Brain, 
  Globe, 
  Zap, 
  Shield, 
  Target, 
  Users, 
  ArrowRight,
  CheckCircle,
  Server,
  Code,
  Cloud,
  Rocket
} from 'lucide-react';

const Industries = () => {
  const currentIndustries = [
    {
      name: 'Automotive Manufacturing',
      icon: Factory,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      status: 'Primary Focus - Building Now',
      description: 'Quality control, defect detection, and production optimization',
      applications: [
        'Quality Control & Defect Detection',
        'Manufacturing Analytics & Optimization',
        'Safety & Testing Systems',
        'Supply Chain & Logistics'
      ],
      selfService: {
        price: '£599 - £1,299/month',
        features: [
          'Pre-trained models + training data + evidence bundles',
          'Customer handles compute costs and deployment',
          'Basic API access and documentation'
        ]
      },
      fullService: {
        price: '£2,799 - £3,999/month',
        features: [
          'Everything from self-service + AWS infrastructure',
          'Compute management + deployment support',
          'SLA guarantees + dedicated support'
        ]
      },
      potential: 'Transform automotive quality and efficiency',
      impact: 'Automotive partnerships ready'
    },
    {
      name: 'Healthcare & NHS',
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      status: 'Coming Very Soon - Q1 2025',
      description: 'Medical research, fraud detection, and healthcare analytics',
      applications: [
        'Fraud Detection & Risk Management',
        'Medical Research & Clinical Trials',
        'Patient Care & Analytics',
        'Healthcare Operations & Compliance'
      ],
      selfService: {
        price: '£699 - £1,299/month',
        features: [
          'Pre-trained models + training data + evidence bundles',
          'Customer handles compute costs and deployment',
          'Basic API access and documentation'
        ]
      },
      fullService: {
        price: '£3,499 - £5,999/month',
        features: [
          'Everything from self-service + AWS infrastructure',
          'Compute management + deployment support',
          'SLA guarantees + dedicated support'
        ]
      },
      potential: 'Revolutionize healthcare fraud detection',
      impact: 'Insurance and finance crossover ready'
    },
    {
      name: 'Financial Services',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      status: 'Planned - Q2 2025',
      description: 'Banking, trading, risk management, and compliance',
      applications: [
        'Credit Risk & Fraud Detection',
        'Market Risk & Trading',
        'Compliance & Regulatory',
        'Insurance & Risk Transfer'
      ],
      selfService: {
        price: '£1,299 - £1,999/month',
        features: [
          'Pre-trained models + training data + evidence bundles',
          'Customer handles compute costs and deployment',
          'Basic API access and documentation'
        ]
      },
      fullService: {
        price: '£6,999 - £9,999/month',
        features: [
          'Everything from self-service + AWS infrastructure',
          'Compute management + deployment support',
          'SLA guarantees + dedicated support'
        ]
      },
      potential: 'Transform financial risk modeling',
      impact: 'Most in-demand and profitable models'
    }
  ];

  const futureCapabilities = [
    {
      name: 'Multi-Data Pipeline Infrastructure',
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Enterprise-scale data synthesis across multiple domains',
      timeline: 'Q2 2025',
      features: [
        'Cross-industry data synthesis',
        'Schema harmonization tools',
        'Foundation model infrastructure',
        'Enterprise LLM client capabilities'
      ],
      potential: 'Unlock $3.5T+ in new markets',
      impact: 'Emerging market opportunities'
    },
    {
      name: 'Foundation Model Delivery',
      icon: Brain,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Deliver enterprise-scale AI to privacy-locked industries',
      timeline: 'Q3 2025',
      features: [
        'Multi-domain foundation models',
        'Privacy-safe AI training platform',
        'Enterprise compliance validation',
        'Global market expansion'
      ],
      potential: 'Democratize enterprise AI',
      impact: 'Access previously locked industries'
    },
    {
      name: 'Market Creation Engine',
      icon: Globe,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Create industries that don\'t exist yet',
      timeline: 'Q4 2025',
      features: [
        'Pattern recognition revolution',
        'New industry creation',
        'Unlimited scale capability',
        'Cosmic stewardship of evolution'
      ],
      potential: 'End the age of data',
      impact: 'Create the future of AI'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Industry Solutions
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Evidence‑led synthetic data solutions with billion‑row demonstration capability
          </p>
        </div>
      </section>

      {/* Current Industries */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Current Focus Industries</h2>
            <p className="text-xl text-slate-600">Building solutions that transform entire industries</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {currentIndustries.map((industry, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl p-8 hover:border-blue-300 transition-all duration-300 shadow-md"
              >
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 mr-4">
                    <industry.icon className={`w-8 h-8 ${industry.color}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{industry.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      industry.status.includes('Primary') ? 'bg-blue-100 text-blue-800' :
                      industry.status.includes('Coming') ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {industry.status}
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 mb-6">{industry.description}</p>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">Applications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {industry.applications.map((app, appIndex) => (
                      <div key={appIndex} className="flex items-center text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">{app}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h5 className="font-semibold text-slate-900 mb-2">Self-Service</h5>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{industry.selfService.price}</div>
                    <ul className="space-y-1">
                      {industry.selfService.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-xs text-slate-600 flex items-start">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <h5 className="font-semibold text-slate-900 mb-2">Full Service</h5>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{industry.fullService.price}</div>
                    <ul className="space-y-1">
                      {industry.fullService.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-xs text-slate-600 flex items-start">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h6 className="text-sm font-semibold text-slate-500 mb-1">Potential Impact</h6>
                      <p className="text-slate-700">{industry.potential}</p>
                    </div>
                    <div>
                      <h6 className="text-sm font-semibold text-slate-500 mb-1">Market Readiness</h6>
                      <p className="text-slate-700">{industry.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Industries */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Future Industry Expansion</h2>
            <p className="text-xl text-slate-600">Ongoing R&D into methods and tooling for scale, robustness, and usability</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {futureCapabilities.map((capability, index) => (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-all duration-300 shadow-md"
              >
                <div className="text-center mb-6">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 inline-block mb-4">
                    <capability.icon className={`w-8 h-8 ${capability.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{capability.name}</h3>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                    {capability.timeline}
                  </span>
                </div>

                <p className="text-slate-600 mb-4 text-center">{capability.description}</p>

                <div className="space-y-2">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Key Features</h4>
                    <ul className="space-y-1">
                      {capability.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-blue-100 flex items-start">
                          <CheckCircle className="h-3 w-3 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="border-t border-white/20 pt-4">
                    <div className="text-sm text-blue-200">
                      <div className="font-medium mb-1">Potential: {capability.potential}</div>
                      <div className="font-medium">Impact: {capability.impact}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Advantage */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Strategic Advantage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-6">
                <Code className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Self-Service Model</h3>
              <p className="text-slate-700 mb-4">
                Lower price point for technical teams with existing infrastructure. 
                Customer handles compute costs while we provide models, data, and evidence.
              </p>
              <div className="text-sm text-slate-600">
                <strong>Result:</strong> Higher margins for us, lower total cost for customers
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mx-auto mb-6">
                <Server className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Full-Service Model</h3>
              <p className="text-slate-700 mb-4">
                Premium pricing for managed service and infrastructure. 
                We handle everything including AWS infrastructure and compute management.
              </p>
              <div className="text-sm text-slate-600">
                <strong>Result:</strong> Premium margins for complex deployments
              </div>
            </div>
          </div>
          
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">The Path to Foundation Models</h3>
            <p className="text-blue-100 text-lg mb-6">
              This dual-model approach eliminates the compute cost burden that kills most AI companies. 
              Customers choose their comfort level while we maintain healthy margins regardless of their choice.
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Ready to Build the Future
              <ArrowRight className="ml-2 h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Industry?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join the revolution in synthetic data generation with proven 1 billion record capability
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Contact Sales
              </button>
              <button className="border border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                View Technology
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Industries;