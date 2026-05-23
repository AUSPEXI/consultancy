import React from 'react';
import { Calendar, CheckCircle, Clock, Target, TrendingUp, Users, Database, Shield, Globe, Zap, Brain, Lock, DollarSign, Rocket, Sparkles, Eye, Atom, Award, Star, Infinity, Lightbulb } from 'lucide-react';

const Roadmap = () => {
  const roadmapItems = [
    {
      version: 'Foundation & Research',
      date: '2024-2025',
      status: 'completed',
      title: 'Mathematical Foundation',
      description: 'Initial research and development of core mathematical concepts, advanced mathematical systems, and foundational research.',
      achievements: [
        'Mathematical foundation development',
        'Advanced mathematical research',
        'Initial prototype development',
        'Core algorithm design',
        'Eye of Horus mathematical modeling',
        'Dürer\'s mathematical solids research',
        'Exploration of high-dimensional field models'
      ],
      metrics: {
        research: 'Foundation Complete',
        prototypes: 'Initial Development',
        theory: 'Mathematical Framework',
        patterns: 'Advanced Mathematics'
      }
    },
    {
      version: 'Breakthrough System',
      date: '2025 - Current',
      status: 'completed',
      title: 'High-Scale Demonstration',
      description: 'Billion-row synthetic data demonstration under controlled test conditions.',
      achievements: [
        '1B synthetic rows demonstrated (demo environment)',
        'Evidence bundle: schema hash, ablation tests, generator versioning',
        'High-dimensional field modeling prototype'
      ],
      metrics: {
        records: '1B demo',
        technology: 'Prototype proven',
        quality: 'Metrics within targets (per evidence bundle)',
        scale: 'High-scale (demo)'
      }
    },
    {
      version: 'Innovation Pipeline',
      date: 'Ongoing',
      status: 'in-progress',
      title: 'Multi-Industry AI Platform Development',
      description: 'Building enterprise-scale AI infrastructure that delivers foundation models to privacy-locked industries through our proven service model.',
      achievements: [
        'Multi-domain data synthesis development',
        'Advanced schema harmonization systems',
        'Seamless pipeline integration architecture',
        'Foundation model infrastructure planning',
        'Enterprise-scale AI platform development',
        'Clear self-service and full-service models',
        'Go-to-market plan and early design-partner outreach',
        'Databricks Marketplace onboarding pathway defined'
      ],
      metrics: {
        innovations: 'In Development',
        markets: 'Expanding Access',
        exploration: 'Human Potential',
        industries: 'Multi-Domain'
      }
    },
    {
      version: 'Future Vision',
      date: 'Future',
      status: 'planned',
      title: 'Foundation Models & Market Expansion',
      description: 'Delivering enterprise-scale AI infrastructure to previously inaccessible industries, creating new markets through our proven service model.',
      achievements: [
        'Foundation model delivery to locked industries',
        'Multi-domain data synthesis at scale',
        'Seamless pipeline integration across domains',
        'Enterprise AI platform for global industries',
        'Market expansion in previously inaccessible sectors',
        'AI democratization through clear service models',
        'Responsible scaling and governance'
      ],
      metrics: {
        dimensions: 'Multiple Reality',
        stewardship: 'Human Potential',
        exploration: 'New Worlds',
        evolution: 'Global Scale'
      }
    }
  ];

  const milestones = [
    {
      quarter: '2024-2025',
      title: 'Foundation Complete',
      description: 'Mathematical foundation and core research completed'
    },
    {
      quarter: '2025',
      title: 'Billion-Row Demonstration',
      description: '1 billion synthetic records demonstrated (internal test)'
    },
    {
      quarter: '2025',
      title: 'Multi Data Pipeline',
      description: 'Streaming pipeline enabling high-scale generation'
    },
    {
      quarter: '2025-2026',
      title: 'Industry Expansion',
      description: 'Automotive, healthcare, and financial services deployment'
    },
    {
      quarter: '2026',
      title: 'Foundation Models',
      description: 'Enterprise AI infrastructure for locked industries'
    },
    {
      quarter: '2026+',
      title: 'Market Creation',
      description: 'New industry use cases and research directions'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-100';
      case 'in-progress':
        return 'text-blue-500 bg-blue-100';
      case 'planned':
        return 'text-purple-500 bg-purple-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in-progress':
        return Clock;
      case 'planned':
        return Target;
      default:
        return Clock;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Development Roadmap
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            From mathematical foundation to world record achievement and beyond
          </p>
        </div>
      </section>

      {/* Roadmap Items */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500 mb-6">Roadmap items are forward-looking and subject to change.</p>
          <div className="space-y-12">
            {roadmapItems.map((item, index) => (
              <div
                key={index}
                className={`bg-slate-50 border rounded-xl p-8 ${
                  item.status === 'completed' ? 'border-green-300 bg-green-50' :
                  item.status === 'in-progress' ? 'border-blue-300 bg-blue-50' :
                  'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-blue-600 font-mono text-sm">{item.version}</span>
                      <span className="text-slate-500 text-sm">{item.date}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status === 'completed' ? 'Completed' :
                         item.status === 'in-progress' ? 'In Progress' : 'Planned'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h2>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Achievements</h3>
                    <div className="space-y-3">
                      {item.achievements.map((achievement, achievementIndex) => (
                        <div key={achievementIndex} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Metrics & Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(item.metrics).map(([key, value], metricIndex) => (
                        <div key={metricIndex} className="bg-white border border-slate-200 rounded-lg p-4 text-center">
                          <div className="text-sm text-slate-500 mb-1 capitalize">{key}</div>
                          <div className="text-lg font-bold text-slate-900">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Key Milestones</h2>
            <p className="text-xl text-slate-600">Critical achievements on our journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-all duration-300 shadow-md"
              >
                <div className="text-2xl font-bold text-blue-600 mb-2">{milestone.quarter}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{milestone.title}</h3>
                <p className="text-slate-600 text-sm">{milestone.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-12">
            <h2 className="text-3xl font-bold text-white mb-6">Join Our Journey</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Be part of the revolution in synthetic data generation and AI innovation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Get Started
              </button>
              <button className="border border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Roadmap;