import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Target, Eye, RotateCcw, TrendingUp, Lock, FileText, Package,
  Activity, Car, CheckCircle,
  ArrowRight, Database, Users, Globe
} from 'lucide-react'

export const Features: React.FC = () => {
  const operationalFeatures = [
    {
      icon: Target,
      title: 'SLO Management',
      description: 'Configure utility, stability, latency, and privacy SLOs with automated breach detection and alerting',
      benefits: [
        'Define operating points with confidence intervals',
        'Set tolerance bands for each SLO type',
        'Automated breach severity assessment',
        'Real-time status monitoring'
      ],
      demoLink: '/stability-demo'
    },
    {
      icon: Eye,
      title: 'Shadow Evaluation',
      description: 'Test candidate models in parallel with live traffic before promotion to production',
      benefits: [
        'Zero-risk model deployment testing',
        'Parallel scoring with live traffic',
        'Automated promotion approval gates',
        'Evidence-backed evaluation results'
      ],
      demoLink: '/stability-demo'
    },
    {
      icon: RotateCcw,
      title: 'Automated Rollback',
      description: 'Breach of SLO triggers immediate rollback to last good artifact with evidence logging',
      benefits: [
        'Instant response to SLO breaches',
        'Evidence-backed rollback decisions',
        'Complete audit trail of incidents',
        'Minimal downtime during incidents'
      ],
      demoLink: '/stability-demo'
    },
    {
      icon: TrendingUp,
      title: 'Drift Monitoring',
      description: 'PSI/KS metrics with time-window analysis and segment-specific drift detection',
      benefits: [
        'Population Stability Index (PSI) tracking',
        'Kolmogorov-Smirnov (KS) statistics',
        'Time-window drift analysis (7d, 14d, 28d)',
        'Segment-specific drift identification'
      ],
      demoLink: '/stability-demo'
    },
    {
      icon: Lock,
      title: 'Privacy Probes',
      description: 'Membership inference and attribute disclosure monitoring with differential privacy budgets',
      benefits: [
        'Membership advantage tracking',
        'Attribute disclosure monitoring',
        'Re-identification risk assessment',
        'Differential privacy budget management'
      ],
      demoLink: '/stability-demo'
    },
    {
      icon: FileText,
      title: 'Evidence in CI',
      description: 'Every change regenerates signed evidence bundles for complete audit trail',
      benefits: [
        'Automated evidence bundle generation',
        'Signed and verifiable evidence',
        'Complete lineage documentation',
        'Regulatory compliance support'
      ],
      demoLink: '/cards-demo'
    }
  ]

  const packagingFeatures = [
    {
      icon: Package,
      title: 'Air-Gapped Packaging',
      description: 'Generate secure edge bundles with manifests, QR codes, and field verification',
      benefits: [
        'Secure offline deployment packages',
        'QR code verification system',
        'Dual-control signing process',
        'Field engineer verification kiosk'
      ],
      demoLink: '/air-gapped-demo'
    },
    {
      icon: Car,
      title: 'Automotive Quality Control',
      description: 'Golden run systems, calibration, and automotive-specific edge packaging',
      benefits: [
        'Golden run baseline establishment',
        'Camera calibration and alignment',
        'Failure mode handling',
        'Automotive-specific edge bundles'
      ],
      demoLink: '/automotive-demo'
    },
    {
      icon: Database,
      title: 'Dataset & Model Cards',
      description: 'Comprehensive documentation that buyers actually use with Unity Catalog integration',
      benefits: [
        'Detailed dataset and model documentation',
        'Operating points and stability metrics',
        'Unity Catalog integration',
        'Exportable HTML and JSON formats'
      ],
      demoLink: '/cards-demo'
    }
  ]

  const marketplaceFeatures = [
    {
      icon: Globe,
      title: 'Universal Marketplace',
      description: 'Platform-agnostic asset management with trial provisioning and conversion analytics',
      benefits: [
        'Cross-platform asset management',
        'Automated trial provisioning',
        'Usage tracking and analytics',
        'Conversion optimization'
      ],
      demoLink: '/marketplace-demo'
    },
    {
      icon: Users,
      title: 'Trial Management',
      description: 'Platform-agnostic trial management with engagement tracking and conversion workflows',
      benefits: [
        'Automated trial provisioning',
        'Engagement metrics tracking',
        'Conversion trigger management',
        'Multi-platform support'
      ],
      demoLink: '/marketplace-demo'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Operational AI Features
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Evidence‑led AI operations with gated promotions, rollback hooks, and stability reports
            </p>
          </div>
        </div>
      </div>

      {/* Operational AI Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 mr-3 text-blue-500" />
            Operational AI Stability
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Operate AI with gated promotions, rollback hooks, and stability reports (pilot‑scoped)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {operationalFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <feature.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
              </div>
              
              <p className="text-gray-600 mb-4">{feature.description}</p>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Key Benefits:</h4>
                <ul className="space-y-1">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <Link
                to={feature.demoLink}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Try Demo
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Packaging & Deployment Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Package className="w-8 h-8 mr-3 text-green-500" />
              Secure Packaging & Deployment
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Air-gapped packaging, automotive quality control, and comprehensive documentation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {packagingFeatures.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <feature.icon className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-4">{feature.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link
                  to={feature.demoLink}
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                >
                  Try Demo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marketplace Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Globe className="w-8 h-8 mr-3 text-purple-500" />
              Universal Marketplace
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Platform-agnostic asset management with trial provisioning and conversion analytics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {marketplaceFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <feature.icon className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-4">{feature.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link
                  to={feature.demoLink}
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
                >
                  Try Demo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Designed for Regulated Industries
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our operational AI features are specifically designed for industries that require the highest levels of stability and compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Healthcare</h3>
              <p className="text-gray-600 mb-4">
                Privacy‑preserving workflows with probes and evidence‑backed model cards (not legal advice)
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Privacy-preserving model deployment</li>
                <li>• Evidence-backed compliance</li>
                <li>• Automated rollback on incidents</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Financial Services</h3>
              <p className="text-gray-600 mb-4">
                Model risk management with gated promotions and rollback hooks
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Model risk management</li>
                <li>• Fail-closed promotion gates</li>
                <li>• Automated incident response</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Automotive</h3>
              <p className="text-gray-600 mb-4">
                Quality control with golden run systems and automotive-specific edge packaging
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Golden run quality control</li>
                <li>• Automotive edge packaging</li>
                <li>• Field verification systems</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your AI Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join organisations operating AI with confidence using evidence‑led stability and gated promotion principles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/stability-demo"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
            >
              Start with Stability Demo
            </Link>
            <Link
              to="/contact"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-300"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
