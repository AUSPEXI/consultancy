import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { CheckCircle, Shield, Database, Zap, Users, Building, Globe, Lock, Award, Star, Rocket, Brain, Eye, Atom, Sparkles, TrendingUp, Target, Check, X, Crown, Star as StarIcon, Code, Server, Cpu, BarChart3, Car, Factory, Gauge, Wrench, Truck, Cog, Bolt, Palette, Activity, Flame, Siren, RotateCcw, FileText, TrendingUp as TrendingUpIcon, GraduationCap, Target as TargetIcon, ChevronDown } from 'lucide-react';

const Pricing = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('automotive');
  const [pricingCatalog, setPricingCatalog] = useState<any | null>(null);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [calcInput, setCalcInput] = useState({ seats: 3, rowsM: 50, streamsMPerDay: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/pricing');
        if (res.ok) {
          const data = await res.json();
          setPricingCatalog(data);
        }
      } catch (_) {
        // fallback to static
      }
      try {
        const r2 = await fetch('/.netlify/functions/get-entitlements');
        if (r2.ok) {
          const data = await r2.json();
          setEntitlements(Array.isArray(data?.entitlements) ? data.entitlements : []);
        }
      } catch(_) {}
    })();
  }, []);

  const platformTiers = [
    {
      name: 'Developer Hub',
      description: 'Individual developer access to synthetic data generation',
      price: {
        gbp: '£299',
        usd: '$379'
      },
      period: 'per month per seat',
      features: [
        '10M synthetic rows/month',
        '100 ablation runs/month',
        '2 RPS API cap',
        'Basic support',
        'Standard datasets access',
        'API documentation'
      ],
      icon: Code,
      color: 'blue',
      popular: false,
      quotas: {
        rows: '10M',
        ablation: '100',
        api: '2 RPS'
      }
    },
    {
      name: 'Developer Hub Pro',
      description: 'Advanced developer access with extended capabilities',
      price: {
        gbp: '£499',
        usd: '$629'
      },
      period: 'per month per seat',
      features: [
        '50M synthetic rows/month',
        '500 ablation runs/month',
        '5 RPS API cap',
        'VRME/FRO extended variants',
        'Priority support',
        'Advanced datasets access',
        'Custom model training'
      ],
      icon: Cpu,
      color: 'green',
      popular: true,
      quotas: {
        rows: '50M',
        ablation: '500',
        api: '5 RPS'
      }
    },
    {
      name: 'Team Platform',
      description: 'Small team access with enterprise features',
      price: {
        gbp: '£1,299',
        usd: '$1,649'
      },
      period: 'per month (includes 3 seats)',
      features: [
        '100M synthetic rows/month',
        '1,000 ablation runs/month',
        '10 RPS API cap',
        'SSO integration',
        'Priority support',
        'Advanced datasets access',
        'Custom model training',
        'Basic SLA'
      ],
      icon: Users,
      color: 'blue',
      popular: false,
      quotas: {
        rows: '100M',
        ablation: '1,000',
        api: '10 RPS'
      }
    },
    {
      name: 'Enterprise Platform',
      description: 'Large team access with enterprise-grade features',
      price: {
        gbp: '£2,999',
        usd: '$3,799'
      },
      period: 'per month (includes 5 seats)',
      features: [
        '500M+ rows/month (negotiated)',
        'Unlimited ablation runs (tools only)',
        'SSO integration',
        'SLA guarantees',
        'Audit exports',
        'Dedicated support',
        'Tools only (no managed compute or Databricks delivery)',
        'Datasets sold separately'
      ],
      icon: Server,
      color: 'purple',
      popular: false,
      quotas: {
        rows: '500M+',
        ablation: 'Unlimited',
        api: 'By contract'
      }
    }
  ];

  const datasetTiers = [
    {
      name: 'Small Dataset',
      price: { gbp: '£399', usd: '$499' },
      period: 'per month',
      features: ['Up to 100K records', 'Full Delta table', 'Evidence bundle', 'Monthly refresh', 'Basic support'],
      icon: Database,
      color: 'blue'
    },
    {
      name: 'Medium Dataset',
      price: { gbp: '£799', usd: '$999' },
      period: 'per month',
      features: ['Up to 1M records', 'Full Delta table', 'Evidence bundle', 'Monthly refresh', 'Priority support'],
      icon: BarChart3,
      color: 'green'
    },
    {
      name: 'Large Dataset',
      price: { gbp: '£1,499', usd: '$1,899' },
      period: 'per month',
      features: ['Up to 10M records', 'Full Delta table', 'Evidence bundle', 'Monthly refresh', 'Priority support'],
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  const enterpriseTiers = [
    {
      name: 'Enterprise Basic',
      price: { gbp: '£9,999', usd: '$12,999' },
      period: 'per month',
      features: ['Up to 100M records (managed compute included)', 'Databricks integration & delivery', 'Full evidence bundles', 'Dedicated support', 'Custom compliance'],
      icon: Building,
      color: 'blue'
    },
    {
      name: 'Enterprise Pro',
      price: { gbp: '£24,999', usd: '$31,999' },
      period: 'per month',
      features: ['Up to 500M records (managed compute included)', 'Databricks integration & delivery', 'Full evidence bundles', 'Dedicated support', 'Custom compliance'],
      icon: Crown,
      color: 'green'
    },
    {
      name: 'Enterprise Ultimate',
      price: { gbp: '£49,999', usd: '$62,999' },
      period: 'per month',
      features: ['Up to 1B records (managed compute included)', 'Databricks integration & delivery', 'Full evidence bundles', 'Dedicated support', 'Production SLAs, private networking options'],
      icon: Server,
      color: 'purple'
    }
  ];

  const streamingTiers = [
    {
      name: 'Basic Stream',
      price: { gbp: '£2,999', usd: '$3,749' },
      period: 'per month',
      features: ['1M rows/day (30M/month)', 'Real-time generation', 'Evidence bundles', 'Basic storage included', 'API access'],
      icon: Zap,
      color: 'blue'
    },
    {
      name: 'Professional Stream',
      price: { gbp: '£7,999', usd: '$9,999' },
      period: 'per month',
      features: ['10M rows/day (300M/month)', 'Real-time generation', 'Evidence bundles', 'Extended storage', 'Priority API access'],
      icon: Bolt,
      color: 'green'
    },
    {
      name: 'Enterprise Stream',
      price: { gbp: '£19,999', usd: '$24,999' },
      period: 'per month',
      features: ['100M rows/day (3B/month)', 'Real-time generation', 'Evidence bundles', 'Unlimited storage', 'Dedicated support'],
      icon: Crown,
      color: 'purple'
    }
  ];

  const industrySuites = [
    {
      name: 'Automotive Manufacturing',
      description: 'Quality control, defect detection, and production optimization for automotive manufacturing',
      icon: Factory,
      color: 'text-purple-600',
      status: 'Primary Focus - Building Now',
      recordsPerDay: '1M+',
      offerings: [
        {
          category: 'Quality Control & Defect Detection',
          models: ['Material Defect Detection v1', 'Production Line Optimization v1', 'Quality Assurance v1', 'Surface Finish Analysis v1'],
          datasets: ['Automotive Quality Dataset', 'Production Metrics Dataset', 'Defect Analysis Dataset', 'Surface Quality Dataset'],
          pricing: 'Self-Service: £599/month | Full-Service: £2,999/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        },
        {
          category: 'Manufacturing Analytics & Optimization',
          models: ['Supply Chain Optimization v1', 'Energy Efficiency v1', 'Maintenance Prediction v1', 'Production Planning v1'],
          datasets: ['Supply Chain Dataset', 'Energy Consumption Dataset', 'Maintenance History Dataset', 'Production Planning Dataset'],
          pricing: 'Self-Service: £899/month | Full-Service: £3,999/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        },
        {
          category: 'Safety & Testing Systems',
          models: ['Crash Test Simulation v1', 'Safety System Validation v1', 'Component Testing v1', 'Performance Analysis v1'],
          datasets: ['Safety Testing Dataset', 'Component Dataset', 'Performance Dataset', 'Validation Dataset'],
          pricing: 'Self-Service: £699/month | Full-Service: £2,799/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        },
        {
          category: 'Supply Chain & Logistics',
          models: ['Inventory Optimization v1', 'Supplier Quality v1', 'Logistics Planning v1', 'Cost Analysis v1'],
          datasets: ['Inventory Dataset', 'Supplier Dataset', 'Logistics Dataset', 'Cost Dataset'],
          pricing: 'Self-Service: £799/month | Full-Service: £2,899/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        }
      ]
    },
    {
      name: 'Healthcare & NHS',
      description: 'Medical research, fraud detection, and healthcare analytics - Insurance and finance crossover ready',
      icon: Activity,
      color: 'text-red-600',
      status: 'Coming Very Soon - Q1 2025',
      recordsPerDay: '500K+',
      offerings: [
        {
          category: 'Fraud Detection & Risk Management',
          models: ['Healthcare Claims Fraud v1', 'Provider Analytics v1', 'Patient Risk Assessment v1', 'Insurance Fraud v1'],
          datasets: ['Claims Dataset', 'Provider Dataset', 'Patient Dataset', 'Insurance Dataset'],
          pricing: 'Self-Service: £799/month | Full-Service: £3,999/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        },
        {
          category: 'Medical Research & Clinical Trials',
          models: ['Clinical Trial Optimization v1', 'Drug Discovery v1', 'Patient Outcomes v1', 'Research Analytics v1'],
          datasets: ['Clinical Data Dataset', 'Research Dataset', 'Outcomes Dataset', 'Analytics Dataset'],
          pricing: 'Self-Service: £1,299/month | Full-Service: £5,999/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        },
        {
          category: 'Patient Care & Analytics',
          models: ['Patient Risk Stratification v1', 'Treatment Optimization v1', 'Population Health v1', 'Predictive Care v1'],
          datasets: ['Patient Dataset', 'Treatment Dataset', 'Population Dataset', 'Predictive Dataset'],
          pricing: 'Self-Service: £899/month | Full-Service: £4,499/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        },
        {
          category: 'Healthcare Operations & Compliance',
          models: ['HIPAA Compliance v1', 'Operational Efficiency v1', 'Resource Optimization v1', 'Quality Metrics v1'],
          datasets: ['Compliance Dataset', 'Operations Dataset', 'Resource Dataset', 'Quality Dataset'],
          pricing: 'Self-Service: £699/month | Full-Service: £3,499/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        }
      ]
    },
    {
      name: 'Financial Services',
      description: 'Banking, trading, risk management, and compliance - Insurance and healthcare fraud crossover',
      icon: TrendingUpIcon,
      color: 'text-green-600',
      status: 'Planned - Q2 2025',
      recordsPerDay: '2M+',
      offerings: [
        {
          category: 'Credit Risk & Fraud Detection',
          models: ['Credit Risk Assessment v1', 'Transaction Fraud Detection v1', 'Identity Verification v1'],
          datasets: ['Credit History Dataset', 'Transaction Patterns Dataset', 'Identity Risk Dataset'],
          pricing: 'Self-Service: £1,299/month | Full-Service: £6,999/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        },
        {
          category: 'Market Risk & Trading',
          models: ['Market Risk Modeling v1', 'Portfolio Optimization v1', 'Algorithmic Trading v1'],
          datasets: ['Market Volatility Dataset', 'Portfolio Performance Dataset', 'Trading Signals Dataset'],
          pricing: 'Self-Service: £1,999/month | Full-Service: £9,999/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        },
        {
          category: 'Compliance & Regulatory',
          models: ['AML Monitoring v1', 'KYC Automation v1', 'Regulatory Reporting v1'],
          datasets: ['Compliance Dataset', 'KYC Dataset', 'Regulatory Dataset'],
          pricing: 'Self-Service: £1,599/month | Full-Service: £7,999/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        },
        {
          category: 'Insurance & Risk Transfer',
          models: ['Insurance Risk Assessment v1', 'Claims Fraud Detection v1', 'Risk Transfer Modeling v1'],
          datasets: ['Insurance Claims Dataset', 'Risk Profile Dataset', 'Transfer Dataset'],
          pricing: 'Self-Service: £1,799/month | Full-Service: £8,999/month',
          description: 'Self-Service: Pre-trained models + training data + evidence bundles. You handle compute costs and deployment. Full-Service: Everything above + AWS infrastructure + compute management + deployment support.',
          serviceLevels: {
            selfService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'Basic API access', 'Documentation'],
              notIncluded: ['Compute costs', 'Model hosting', 'Infrastructure setup', 'Deployment support']
            },
            fullService: {
              included: ['Pre-trained models', 'Training datasets', 'Evidence bundles', 'AWS infrastructure', 'Compute management', 'Deployment support', 'SLA guarantees', 'Dedicated support'],
              notIncluded: ['None - fully managed service']
            }
          }
        }
      ]
    }
  ];

  const whiteLabelTiers = [
    {
      name: 'White Label Basic',
      price: { gbp: '£4,999', usd: '$6,249' },
      period: 'per month',
      features: ['Custom branding', 'Up to 50M records/mo', 'Basic API access', 'Standard support', 'Custom compliance'],
      icon: Palette,
      color: 'blue'
    },
    {
      name: 'White Label Pro',
      price: { gbp: '£12,999', usd: '$16,249' },
      period: 'per month',
      features: ['Custom branding', 'Up to 500M records/mo', 'Advanced API access', 'Priority support', 'Custom compliance'],
      icon: Crown,
      color: 'purple'
    },
    {
      name: 'Enterprise Platform',
      price: { gbp: 'Contact Sales', usd: 'Contact Sales' },
      period: '',
      features: ['Full platform licensing', 'Unlimited records', 'Custom integrations', 'Dedicated team', 'SLA guarantees'],
      icon: Server,
      color: 'green'
    }
  ];

  const modelTiers = [
    {
      name: 'Model Seat',
      price: { gbp: '£149', usd: '$199' },
      period: 'per seat/month',
      features: ['Access to one niche model', 'Per-seat rate', 'Evidence-backed', 'Basic support'],
      icon: Brain,
      color: 'blue'
    },
    {
      name: 'Prediction Credits 100k',
      price: { gbp: '£49', usd: '$59' },
      period: 'one-time',
      features: ['100k prediction credits', 'Usage-based', 'No expiration', 'Basic support'],
      icon: Target,
      color: 'green'
    },
    {
      name: 'Prediction Credits 1M',
      price: { gbp: '£399', usd: '$499' },
      period: 'one-time',
      features: ['1M prediction credits', 'Usage-based', 'No expiration', 'Priority support'],
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  const storageTiers = [
    {
      name: 'Hot Storage',
      price: { gbp: '£99', usd: '$129' },
      period: 'per TB/month',
      features: ['Frequently accessed data', 'Fast retrieval', 'High availability', 'SLA guarantee']
    },
    {
      name: 'Warm Storage',
      price: { gbp: '£49', usd: '$69' },
      period: 'per TB/month',
      features: ['Occasionally accessed data', 'Balanced performance', 'Cost optimization']
    },
    {
      name: 'Cold Storage',
      price: { gbp: '£19', usd: '$29' },
      period: 'per TB/month',
      features: ['Rarely accessed data', 'Maximum cost savings', 'Long-term retention']
    }
  ];

  const worldRecordFeatures = [
    {
      title: '1 BILLION Records Generated',
              description: 'Revolutionary achievement proving unlimited scale capability',
      icon: Award,
      status: 'Completed'
    },
    {
      title: '11 Proprietary Inventions',
      description: 'Revolutionary technologies including Elastic Collision Newton\'s Cradle',
      icon: Rocket,
      status: 'Operational'
    },
    {
      title: '100% Quality Compliance',
      description: 'Perfect quality maintained across all scales from 1K to 1B records',
      icon: CheckCircle,
      status: 'Proven'
    },
    {
      title: 'Unlimited Scale',
      description: 'Revolutionary technology enabling unlimited synthetic data generation',
      icon: Globe,
      status: 'Achieved'
    }
  ];

  const innovationPipeline = [
    {
      category: 'Revolutionary Technologies',
      description: 'Advanced innovations in development that will transform multiple industries',
      icon: Sparkles,
      hint: 'Beyond synthetic data - new dimensions'
    },
    {
      category: 'Market Creation',
      description: 'Technologies that will create industries that don\'t exist yet',
      icon: TrendingUp,
      hint: 'Market-creating innovations'
    },
    {
      category: 'Human Exploration',
      description: 'Opening new dimensions of human exploration and understanding',
      icon: Users,
      hint: 'New worlds of exploration'
    },
    {
      category: 'Cosmic Patterns',
      description: 'Advanced mathematical modeling of universal processes',
      icon: Atom,
      hint: 'Cosmic pattern recognition'
    }
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Pricing – AethergenPlatform"
        description="Transparent pricing for AethergenPlatform: platform access, datasets, streams, and services. Databricks-ready with evidence bundles and enterprise support."
        canonical="https://auspexi.com/pricing"
        ogImage="/marketing/og-1200x630.png?v=1"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {"@type": "Question", "name": "What does AethergenPlatform include?", "acceptedAnswer": {"@type": "Answer", "text": "Synthetic data generation, evidence bundles, and Databricks autoship for datasets/models."}},
            {"@type": "Question", "name": "Can I bring my own cloud?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Self-host or choose managed AWS. Billing and entitlements are handled via Stripe/Supabase."}}
          ]
        }}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              AethergenPlatform Pricing
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-4xl mx-auto">
              Evidence‑led synthetic data platform for developers and enterprises. From individual access to team‑scale generation with clear entitlements.
            </p>
            <div className="text-sm text-blue-200">
              Have questions about anchors, ZKP seeds, or UC delivery? <a href="/faq" className="underline hover:text-white">Read the FAQ</a>.
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-blue-400 mb-2">High‑scale</div>
                <div className="text-white">Generation</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-green-400 mb-2">Platform</div>
                <div className="text-white">Capabilities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-purple-400 mb-2">Validated</div>
                <div className="text-white">Quality checks</div>
              </div>
            </div>
            <div className="mt-6">
              <a href="/about" className="text-blue-200 hover:text-white font-medium">
                View complete story and achievements →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Edge Deployment & Offline Packages */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Edge Deployment & Offline Packages</h2>
            <p className="text-xl text-slate-700">Attach to Platform/Enterprise. Device‑aware packaging with evidence and safety artifacts.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Edge Starter</h3>
              <p className="text-slate-700 mb-4">Device profile guidance, checksums, safety policy pack, basic eval recipes.</p>
              <div className="text-3xl font-bold text-slate-900 mb-2">£1,499</div>
              <div className="text-sm text-slate-600 mb-6">per package (Contact Sales)</div>
              <ul className="space-y-2 text-slate-700 text-sm mb-6">
                <li>• Device profiles (VRAM‑aware)</li>
                <li>• Checksums manifest</li>
                <li>• Safety policy pack</li>
                <li>• Eval recipes (minimal)</li>
              </ul>
              <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Contact Sales</button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Edge Pro</h3>
              <p className="text-slate-700 mb-4">Adds SBOM, expanded eval datasets, offline docs bundle, adapter watermarking.</p>
              <div className="text-3xl font-bold text-slate-900 mb-2">£4,999</div>
              <div className="text-sm text-slate-600 mb-6">per package (Contact Sales)</div>
              <ul className="space-y-2 text-slate-700 text-sm mb-6">
                <li>• Everything in Starter</li>
                <li>• SBOM (software bill of materials)</li>
                <li>• Expanded eval datasets</li>
                <li>• Offline documentation bundle</li>
                <li>• License watermarking for adapters</li>
              </ul>
              <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Contact Sales</button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Edge Enterprise</h3>
              <p className="text-slate-700 mb-4">Air‑gapped packaging, signing/verify workflow, audit log format/rotation, SLAs.</p>
              <div className="text-3xl font-bold text-slate-900 mb-2">Custom</div>
              <div className="text-sm text-slate-600 mb-6">per contract</div>
              <ul className="space-y-2 text-slate-700 text-sm mb-6">
                <li>• Signing + verify workflow</li>
                <li>• Audit log format + rotation</li>
                <li>• Air‑gapped deployment guidance</li>
                <li>• Support SLAs</li>
              </ul>
              <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary Achievement */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-orange-600 mr-3" />
              <h2 className="text-3xl font-bold text-slate-900">Proven Result</h2>
            </div>
            <p className="text-xl text-slate-600">
              Demonstrated 1 billion‑row synthetic dataset generation. We continue to test, measure, and publish evidence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {worldRecordFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-orange-200 text-center hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center mb-4">
                  <feature.icon className="h-12 w-12 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 mb-4 text-sm">{feature.description}</p>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-700 font-medium">{feature.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Databricks Integration Reference */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Databricks Integration
          </h3>
          <p className="text-lg text-slate-600 mb-6 max-w-3xl mx-auto">
            Enterprise packages include seamless Databricks Marketplace integration. We provide sample workflows and Unity Catalog table patterns for smooth evaluation.
          </p>
          <a
            href="/resources"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-lg"
          >
            Learn more about our Databricks integration →
          </a>
        </div>
      </section>

      {/* Service Level Explanation */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Choose Your Service Level
            </h2>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto">
              Two deployment models. Compute responsibility is explicit: you (Self‑Hosted) or us (Full‑Service AWS).
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 rounded-full p-3 mr-4">
                  <Code className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Self-Service</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Perfect for teams with existing infrastructure and DevOps capabilities
              </p>
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 text-lg">✅ What's Included:</h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Pre-trained AI models
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Training datasets
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Evidence bundles
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Basic API access
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Documentation
                  </li>
                </ul>
                <h4 className="font-semibold text-slate-900 text-lg">❌ What You Handle:</h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Compute costs
                  </li>
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Model hosting
                  </li>
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Infrastructure setup
                  </li>
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Deployment support
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200">
              <div className="flex items-center mb-6">
                <div className="bg-purple-100 rounded-full p-3 mr-4">
                  <Server className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Full-Service</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Complete managed service for teams that want to focus on business outcomes
              </p>
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 text-lg">✅ What's Included:</h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Everything from Self-Service
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    AWS infrastructure setup
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Compute management
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Deployment support
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    SLA guarantees
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Dedicated support
                  </li>
                </ul>
                <h4 className="font-semibold text-slate-900 text-lg">❌ What You Handle:</h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start">
                    <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    Nothing - fully managed service
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Solutions & Models */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Industry Solutions & Models
            </h2>
            <p className="text-xl text-slate-600 mb-6">
              Specialized AI models and synthetic data solutions for automotive, healthcare, and financial services
            </p>
            
            {/* Strategic Note */}
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-slate-900 mb-2">Strategic Industry Focus</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    <strong>Automotive First:</strong> Direct response to industry quality and production requirements — building database schema functionality on Aethergen for rapid deployment.
                    <strong>Healthcare Second:</strong> Fraud detection models with insurance/finance crossover ready for Q1 2025. 
                    <strong>Financial Services:</strong> Planned for Q2 2025 with healthcare fraud detection integration.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Cost Guidance Note (neutral) */}
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200 mt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-slate-900 mb-2">Cost Guidance</h4>
                  <p className="text-slate-800 text-sm leading-relaxed">
                    We focus on value and transparent entitlements. Cost comparisons depend on scope, workload, and compliance needs and are available on request.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Industry Dropdown */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-4 py-3 text-lg font-medium text-slate-900 bg-white border-2 border-blue-200 rounded-xl shadow-md focus:border-blue-500 focus:outline-none appearance-none cursor-pointer hover:border-blue-300 transition-colors"
              >
                <option value="automotive">🚗 Automotive Manufacturing - Primary Focus (Building Now)</option>
                <option value="healthcare">🏥 Healthcare & NHS - Coming Very Soon (Q1 2025)</option>
                <option value="financial">💰 Financial Services - Planned (Q2 2025)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Selected Industry Display */}
          <div className="max-w-4xl mx-auto">
            {(() => {
              const industry = industrySuites.find(i => {
                const key = i.name.toLowerCase();
                if (selectedIndustry === 'automotive') return key.includes('automotive');
                if (selectedIndustry === 'healthcare') return key.includes('healthcare');
                if (selectedIndustry === 'financial') return key.includes('financial');
                return false;
              });
              
              if (!industry) return null;
              
              return (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-xl shadow-md border-2 border-blue-200">
                  <div className="flex items-center mb-6">
                    <industry.icon className={`h-8 w-8 ${industry.color} mr-3`} />
                    <h3 className="text-2xl font-bold text-slate-900">{industry.name}</h3>
                    <div className="ml-auto">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        industry.status === 'Primary Focus' ? 'bg-green-100 text-green-800' :
                        industry.status === 'Coming Soon' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {industry.status}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 mb-8 text-lg">{industry.description}</p>
                  
                  <div className="mb-8">
                    <h4 className="text-xl font-semibold text-slate-900 mb-4">Available Solutions ({industry.offerings.length} categories)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {industry.offerings.map((offering, offeringIndex) => (
                        <div key={offeringIndex} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <h5 className="font-semibold text-slate-900 mb-3 text-base">{offering.category}</h5>
                          
                          {/* Description */}
                          {offering.description && (
                            <p className="text-sm text-slate-600 mb-4 italic border-l-2 border-blue-200 pl-3">
                              {offering.description}
                            </p>
                          )}
                          
                          <div className="space-y-3 text-sm text-slate-600">
                            <div>
                              <span className="font-medium text-blue-600">🤖 AI Models:</span>
                              <div className="mt-1 ml-4">
                                {offering.models.map((model, idx) => (
                                  <div key={idx} className="text-slate-700">• {model}</div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-green-600">📊 Datasets:</span>
                              <div className="mt-1 ml-4">
                                {offering.datasets.map((dataset, idx) => (
                                  <div key={idx} className="text-slate-700">• {dataset}</div>
                                ))}
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                              <span className="font-medium text-purple-600">💳 Pricing:</span>
                              <div className="mt-1 ml-4 text-slate-700 font-medium">{offering.pricing}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-blue-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{industry.recordsPerDay}</div>
                      <div className="text-sm text-slate-600">Records/Day Capacity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">{industry.offerings.length}</div>
                      <div className="text-sm text-slate-600">Solution Categories</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Platform Tiers */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Platform Access Tiers
            </h2>
            <p className="text-xl text-slate-600 mb-6">
              Choose the tier that fits your development and enterprise needs
            </p>
            
            {/* Removed legacy savings banner to avoid confusing/misleading comparisons */}

            {/* Entitlements note */}
            <div className="max-w-3xl mx-auto bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4">
              <p className="text-sm">
                Platform tiers are <strong>tools only</strong> (no managed compute or Databricks delivery). <strong>Datasets sold separately</strong>. Use Enterprise (Databricks) for managed delivery and production SLAs.
              </p>
            </div>
            {/* Read-only current entitlements */}
            <div className="max-w-3xl mx-auto bg-white border mt-4 border-slate-200 text-slate-800 rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">Your Entitlements (read‑only)</div>
              {entitlements.length === 0 ? (
                <div className="text-sm text-slate-600">No active entitlements detected.</div>
              ) : (
                <ul className="text-sm text-slate-700 list-disc pl-5">
                  {entitlements.map((e, i) => (
                    <li key={i}>
                      {String(e.stripe_price || 'UNKNOWN')} – {e.active ? 'Active' : 'Inactive'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(pricingCatalog?.platform || platformTiers).map((tier: any, index: number) => (
              <div key={index} className={`relative rounded-2xl p-8 shadow-lg border-2 ${
                tier.popular 
                  ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200 scale-105' 
                  : 'bg-white border-slate-200'
              }`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  {tier.icon ? (
                    <div className="flex items-center justify-center mb-4">
                      <tier.icon className={`h-12 w-12 text-${tier.color}-600`} />
                    </div>
                  ) : null}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                  <p className="text-slate-600 mb-4">{tier.description}</p>
                </div>
                
                <div className="text-center mb-6">
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">{tier.price.gbp}</span>
                    <span className="text-slate-600 ml-2">{tier.period}</span>
                  </div>
                  <div className="text-sm text-slate-600">{tier.price.usd} USD equivalent</div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Monthly Quotas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Synthetic Rows:</span>
                      <span className="font-medium text-slate-900">{tier.quotas.rows}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Ablation Runs:</span>
                      <span className="font-medium text-slate-900">{tier.quotas.ablation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">API Rate Limit:</span>
                      <span className="font-medium text-slate-900">{tier.quotas.api}</span>
                    </div>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  tier.popular
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}>
                  {tier.popular ? 'Get Started' : 'Contact Sales'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dataset Tiers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              SMB & Startup Plans
            </h2>
            <p className="text-xl text-slate-600">
              Perfect for growing businesses and research projects
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(pricingCatalog?.datasets || datasetTiers).map((tier: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  {tier.icon ? (
                    <div className="flex items-center justify-center mb-4">
                      <tier.icon className={`h-12 w-12 text-${tier.color}-600`} />
                    </div>
                  ) : null}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                </div>
                
                <div className="text-center mb-6">
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">{tier.price.gbp}</span>
                    <span className="text-slate-600 ml-2">{tier.period}</span>
                  </div>
                  <div className="text-sm text-slate-600">{tier.price.usd} USD equivalent</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Plans */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Enterprise Plans (Databricks)
            </h2>
            <p className="text-xl text-slate-600">
              Enterprise-scale solutions with Databricks integration
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {enterpriseTiers.map((tier, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <tier.icon className={`h-12 w-12 text-${tier.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                </div>
                
                <div className="text-center mb-6">
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">{tier.price.gbp}</span>
                    <span className="text-slate-600 ml-2">{tier.period}</span>
                  </div>
                  <div className="text-sm text-slate-600">{tier.price.usd} USD equivalent</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Contact Sales
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Streaming Data */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Continuous Data Streams
            </h2>
            <p className="text-xl text-slate-600">
              Real-time synthetic data generation for continuous applications
            </p>
            <div className="mt-4 max-w-3xl mx-auto bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-3">
              <p className="text-sm">
                Streams are a managed generation service. <strong>Historical dataset SKUs are not included</strong> and can be purchased separately.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(pricingCatalog?.streams || streamingTiers).map((tier: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  {tier.icon ? (
                    <div className="flex items-center justify-center mb-4">
                      <tier.icon className={`h-12 w-12 text-${tier.color}-600`} />
                    </div>
                  ) : null}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                </div>
                
                <div className="text-center mb-6">
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">{tier.price.gbp}</span>
                    <span className="text-slate-600 ml-2">{tier.period}</span>
                  </div>
                  <div className="text-sm text-slate-600">{tier.price.usd} USD equivalent</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* White Label & Enterprise */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              White Label & Enterprise Solutions
            </h2>
            <p className="text-xl text-slate-600">
              Custom branding and enterprise-scale solutions for large organizations
            </p>
            <div className="mt-4 max-w-3xl mx-auto bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3">
              <p className="text-sm">
                White‑label packages are <strong>capped</strong> and do not include unlimited rights. For unlimited entitlements and custom integrations, use Enterprise Platform.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(pricingCatalog?.whiteLabel || whiteLabelTiers).map((tier: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  {tier.icon ? (
                    <div className="flex items-center justify-center mb-4">
                      <tier.icon className={`h-12 w-12 text-${tier.color}-600`} />
                    </div>
                  ) : null}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                </div>
                
                <div className="text-center mb-6">
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">{tier.price.gbp}</span>
                    <span className="text-slate-600 ml-2">{tier.period}</span>
                  </div>
                  {tier.price.gbp !== 'Contact Sales' && (
                    <div className="text-sm text-slate-600">{tier.price.usd} USD equivalent</div>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  tier.price.gbp === 'Contact Sales' 
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  {tier.price.gbp === 'Contact Sales' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models & Predictions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              AI Models & Predictions
            </h2>
            <p className="text-xl text-slate-600">
              Access to trained models and prediction credits for immediate use
            </p>
            <div className="mt-4 max-w-3xl mx-auto bg-purple-50 border border-purple-200 text-purple-800 rounded-xl p-3">
              <p className="text-sm">
                <strong>Model Seat is inference‑only</strong>: no dataset downloads, no training pipelines, no fine‑tuning rights. Prediction credits are usage‑based inference only.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(pricingCatalog?.models || modelTiers).map((tier: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  {tier.icon ? (
                    <div className="flex items-center justify-center mb-4">
                      <tier.icon className={`h-12 w-12 text-${tier.color}-600`} />
                    </div>
                  ) : null}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                </div>
                
                <div className="text-center mb-6">
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-slate-900">{tier.price.gbp}</span>
                    <span className="text-slate-600 ml-2">{tier.period}</span>
                  </div>
                  <div className="text-sm text-slate-600">{tier.price.usd} USD equivalent</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Storage Add-ons */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Storage Add‑ons</h2>
            <p className="text-xl text-slate-600">Tiered storage options for cost‑optimized retention</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(pricingCatalog?.storage || storageTiers).map((tier: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                </div>
                <div className="text-center mb-6">
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-slate-900">{tier.price.gbp}</span>
                    <span className="text-slate-600 ml-2">{tier.period}</span>
                  </div>
                  <div className="text-sm text-slate-600">{tier.price.usd} USD equivalent</div>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Add Storage
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LLM Training Packages */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">LLM Training Packages</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Two clear options for enterprise LLM training: Self‑Hosted (you run compute) or Full‑Service AWS (we run and manage your stack).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-blue-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Self‑Hosted</h3>
              <p className="text-slate-600 mb-6">You operate compute and cloud resources. We provide pipelines, datasets, and support.</p>
              <ul className="space-y-3 text-slate-700 text-sm">
                <li>• Multi‑schema designer and multi‑pipeline orchestration</li>
                <li>• Training/eval recipes, ablations, and evidence bundles</li>
                <li>• Your AWS credits/tenancy; we assist with deploy scripts</li>
                <li>• Optional Databricks marketplace publication</li>
              </ul>
              <div className="mt-6 text-slate-600 text-sm">Compute responsibility: Customer</div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Full‑Service AWS</h3>
              <p className="text-slate-600 mb-6">We deploy and manage the complete stack in your AWS or our managed account.</p>
              <ul className="space-y-3 text-slate-700 text-sm">
                <li>• Everything in Self‑Hosted, plus managed training & scaling</li>
                <li>• MLOps, observability, cost controls, and SLAs</li>
                <li>• Security hardening and compliance reporting</li>
                <li>• Databricks publishing workflow included</li>
              </ul>
              <div className="mt-6 text-slate-600 text-sm">Compute responsibility: Managed by Auspexi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Entitlements Matrix */
      
      
      }
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Entitlements Matrix (Summary)</h2>
            <p className="text-slate-800">High‑level capabilities by package (detailed contracts govern final scope)</p>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[900px] grid grid-cols-7 gap-2 text-sm text-slate-800">
              <div></div>
              <div className="font-semibold text-slate-900">Model Seat</div>
              <div className="font-semibold text-slate-900">Predictions</div>
              <div className="font-semibold text-slate-900">Datasets</div>
              <div className="font-semibold text-slate-900">Streams</div>
              <div className="font-semibold text-slate-900">Platform (Dev/Team)</div>
              <div className="font-semibold text-slate-900">White‑Label / Enterprise</div>

              <div className="font-medium text-slate-900">Inference</div>
              <div>✓</div>
              <div>✓</div>
              <div>—</div>
              <div>—</div>
              <div>✓ (tools)</div>
              <div>✓</div>

              <div className="font-medium text-slate-900">Dataset download</div>
              <div>✕</div>
              <div>✕</div>
              <div>✓ (per SKU)</div>
              <div>✕</div>
              <div>✕ (tools only)</div>
              <div>Optional (contract)</div>

              <div className="font-medium text-slate-900">Training pipelines</div>
              <div>✕</div>
              <div>✕</div>
              <div>✕</div>
              <div>Service runtime</div>
              <div>✓ (quotas)</div>
              <div>✓</div>

              <div className="font-medium text-slate-900">Historical datasets</div>
              <div>✕</div>
              <div>✕</div>
              <div>✓</div>
              <div>✕</div>
              <div>✕</div>
              <div>Optional (contract)</div>

              <div className="font-medium text-slate-900">SLA & Support</div>
              <div>Basic</div>
              <div>Basic</div>
              <div>Standard/Priority</div>
              <div>Priority</div>
              <div>Basic→SLA (by tier)</div>
              <div>Priority/SLA</div>

              <div className="font-medium text-slate-900">Records cap</div>
              <div>—</div>
              <div>—</div>
              <div>Up to 10M/sku</div>
              <div>1M/10M/100M per day</div>
              <div>10M/50M/100M+/Unlimited*</div>
              <div>50M/500M (WL) / Unlimited (Enterprise)</div>

              <div className="font-medium text-slate-900">Compute responsibility</div>
              <div>Platform</div>
              <div>Platform</div>
              <div>N/A</div>
              <div>Managed service</div>
              <div>Customer (self‑host) or Managed (Enterprise)</div>
              <div>Managed (Full‑Service) or Customer (Self‑Hosted)</div>
            </div>
            <p className="mt-3 text-xs text-slate-800">*“Unlimited” subject to negotiated contract and fair use.</p>
          </div>
        </div>
      </section>

      {/* Quick Pricing Calculator */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Quick Pricing Calculator (estimate)</h2>
            <p className="text-slate-600">Non‑binding estimate to help scope. Final pricing via quote.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Seats</label>
              <input type="number" min={1} value={calcInput.seats} onChange={e=>setCalcInput({...calcInput, seats: Number(e.target.value)||0})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Rows/month (Millions)</label>
              <input type="number" min={0} value={calcInput.rowsM} onChange={e=>setCalcInput({...calcInput, rowsM: Number(e.target.value)||0})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Stream/day (Millions)</label>
              <input type="number" min={0} value={calcInput.streamsMPerDay} onChange={e=>setCalcInput({...calcInput, streamsMPerDay: Number(e.target.value)||0})} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              {(() => {
                const seatCost = calcInput.seats * 299;
                const rowsCost = Math.max(0, calcInput.rowsM - 10) * 10; // £10 per extra M beyond 10M
                const streamCost = calcInput.streamsMPerDay * 100; // £100 per M/day baseline
                const estimate = Math.round(seatCost + rowsCost + streamCost);
                return (
                  <div>
                    <div className="text-sm text-slate-700">Estimated monthly (GBP)</div>
                    <div className="text-2xl font-bold text-slate-900">£{estimate.toLocaleString()}</div>
                    <div className="text-xs text-slate-600">Indicative; excludes Enterprise services and taxes.</div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Pipeline */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Innovation Pipeline
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Revolutionary technologies in development that will transform industries and open new worlds of exploration
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {innovationPipeline.map((innovation, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex items-center mb-4">
                  <innovation.icon className="h-8 w-8 text-blue-400 mr-3" />
                  <h3 className="text-xl font-bold text-white">{innovation.category}</h3>
                </div>
                <p className="text-gray-300 mb-4">{innovation.description}</p>
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
                  <p className="text-sm text-blue-300 font-medium">Innovation Hint:</p>
                  <p className="text-gray-200 italic">"{innovation.hint}"</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 text-white">
                Future Innovation Access
              </h3>
              <p className="text-gray-300 mb-6">
                Our innovation pipeline includes technologies that will:
              </p>
              <ul className="space-y-3 text-gray-300 text-left max-w-2xl mx-auto">
                <li className="flex items-center">
                  <Rocket className="h-5 w-5 text-blue-400 mr-3" />
                  Transform multiple industries through breakthrough innovations
                </li>
                <li className="flex items-center">
                  <Globe className="h-5 w-5 text-green-400 mr-3" />
                  Open new dimensions of human exploration and understanding
                </li>
                <li className="flex items-center">
                  <Brain className="h-5 w-5 text-purple-400 mr-3" />
                  Create markets that don't exist yet
                </li>
                <li className="flex items-center">
                  <Atom className="h-5 w-5 text-pink-400 mr-3" />
                  Revolutionize our understanding of data and computation
                </li>
              </ul>
              <p className="text-gray-400 mt-6 text-sm">
                Specific details are protected for future revelation and market impact
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to evaluate AethergenPlatform?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Explore an evidence‑led path to adopting synthetic data at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/press"
              className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-8 py-3 rounded-lg hover:bg-white/20 transition-all font-semibold inline-flex items-center justify-center"
            >
                              View Our Story
              <Award className="ml-2 h-5 w-5" />
            </a>
            <a
              href="/contact"
              className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-slate-900 transition-colors font-semibold"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;