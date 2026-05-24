import React, { useState } from 'react';
import { Check, Star, Zap, Shield, Users, Crown, ArrowRight, AlertCircle } from 'lucide-react';
import { 
  createCheckoutSession, 
  logSubscriptionAttempt,
  getAvailableCategories, 
  getCategoryConfig, 
  getAddonDescriptions,
  calculateTotalPrice,
  type SubscriptionData 
} from '../services/subscriptionManager';

interface SubscriptionFormProps {
  selectedCategory?: string;
}

export default function SubscriptionForm({ selectedCategory }: SubscriptionFormProps) {
  const [category, setCategory] = useState(selectedCategory || '');
  const [type, setType] = useState<'static' | 'premium' | 'enterprise'>('premium');
  const [premiumUpgrade, setPremiumUpgrade] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const availableCategories = getAvailableCategories();
  const categoryConfig = category ? getCategoryConfig(category) : null;
  const addonDescriptions = getAddonDescriptions();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !customerEmail || !customerName) {
      setError('Please fill in all required fields');
      return;
    }

    if (!categoryConfig) {
      setError('Invalid category selected');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const subscriptionData: SubscriptionData = {
        category,
        type,
        price: categoryConfig[type],
        addons: type === 'enterprise' 
          ? [...categoryConfig.addons.core, ...categoryConfig.addons.premium]
          : categoryConfig.addons.core,
        premiumUpgrade,
        customerEmail,
        customerName,
      };

      // Log the subscription attempt
      await logSubscriptionAttempt(subscriptionData);

      // Create checkout session and redirect to Stripe
      await createCheckoutSession(subscriptionData);
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to create subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalPrice = () => {
    if (!categoryConfig) return 0;
    
    const subscriptionData: SubscriptionData = {
      category,
      type,
      price: categoryConfig[type],
      addons: [],
      premiumUpgrade,
      customerEmail,
      customerName,
    };
    
    return calculateTotalPrice(subscriptionData);
  };

  const getPricingTiers = () => {
    if (!categoryConfig) return [];

    return [
      {
        name: 'Static',
        type: 'static' as const,
        price: categoryConfig.static,
        billing: 'One-time payment',
        description: 'Perfect for research projects and one-time analysis',
        features: [
          `4 core add-ons included (bundled)`,
          'Static dataset access',
          'API documentation',
          'Email support',
          'Data export capabilities'
        ],
        addons: {
          core: categoryConfig.addons.core.length,
          premium: 0
        },
        icon: Shield,
        popular: false
      },
      {
        name: 'Premium',
        type: 'premium' as const,
        price: categoryConfig.premium,
        billing: 'per month',
        description: 'Ideal for ongoing operations and regular updates',
        features: [
          `4 core add-ons included (bundled)`,
          'Real-time data updates',
          'Advanced API access',
          'Priority support',
          'Custom integrations',
          'Monthly data refresh'
        ],
        addons: {
          core: categoryConfig.addons.core.length,
          premium: 0
        },
        icon: Star,
        popular: true
      },
      {
        name: 'Enterprise',
        type: 'enterprise' as const,
        price: categoryConfig.enterprise,
        billing: 'per month',
        description: 'Complete solution with all features and premium support',
        features: [
          `8 add-ons included (4 core + 4 premium)`,
          'All premium features',
          'All premium add-ons included',
          'Dedicated account manager',
          'Custom development',
          'SLA guarantees',
          '24/7 support'
        ],
        addons: {
          core: categoryConfig.addons.core.length,
          premium: categoryConfig.addons.premium.length
        },
        icon: Crown,
        popular: false
      }
    ];
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Category Selection */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
          Choose Your Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCategories.map((cat) => {
            const config = getCategoryConfig(cat);
            if (!config) return null;
            
            return (
              <div
                key={cat}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  category === cat
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
                onClick={() => setCategory(cat)}
              >
                <h3 className="text-xl font-bold text-slate-900 mb-2">{cat}</h3>
                <p className="text-slate-600 mb-4">{config.description}</p>
                <div className="text-sm text-blue-600">
                  {config.suites.length} suites • 4 core + 4 premium add-ons
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Tiers */}
      {categoryConfig && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
            Select Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {getPricingTiers().map((tier) => (
              <div
                key={tier.type}
                className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all ${
                  type === tier.type
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : 'border-slate-200 hover:border-blue-300'
                } ${tier.popular ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setType(tier.type)}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <tier.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    ${tier.price.toLocaleString()}
                  </div>
                  <div className="text-slate-600">{tier.billing}</div>
                  <p className="text-sm text-slate-500 mt-2">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Add-on Summary */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Add-ons Included</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Core: {tier.addons.core}</span>
                    <span className="text-purple-600">Premium: {tier.addons.premium}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Upgrade Option */}
      {categoryConfig && type !== 'enterprise' && (
        <div className="mb-12">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-6 w-6 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Premium Add-on Upgrade</h3>
                  <p className="text-slate-600">Add all 4 premium add-ons to your plan</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-purple-600">
                    ${type === 'static' ? '2,400' : '200'}
                  </div>
                  <div className="text-sm text-slate-500">
                    {type === 'static' ? 'one-time' : 'per month'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={premiumUpgrade}
                    onChange={(e) => setPremiumUpgrade(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add-ons Display */}
      {categoryConfig && (
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Add-on System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Users className="h-5 w-5 text-green-500 mr-2" />
                Core Add-ons (4 Bundled)
              </h4>
              <div className="space-y-3">
                {categoryConfig.addons.core.map((addon) => (
                  <div key={addon} className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h5 className="font-medium text-slate-900 mb-1">
                      {addon.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h5>
                    <p className="text-sm text-slate-600">
                      {addonDescriptions[addon as keyof typeof addonDescriptions] || 'Advanced analytics and insights'}
                    </p>
                    <div className="text-xs text-green-600 font-medium mt-2">
                      ✓ Included in all plans
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Crown className="h-5 w-5 text-purple-500 mr-2" />
                Premium Add-ons (4 Optional)
              </h4>
              <div className="space-y-3">
                {categoryConfig.addons.premium.map((addon) => (
                  <div 
                    key={addon} 
                    className={`p-4 rounded-lg border ${
                      type === 'enterprise' || premiumUpgrade
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <h5 className="font-medium text-slate-900 mb-1 flex items-center">
                      {addon.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      {(type === 'enterprise' || premiumUpgrade) && (
                        <Check className="h-4 w-4 text-green-500 ml-2" />
                      )}
                    </h5>
                    <p className="text-sm text-slate-600">
                      {addonDescriptions[addon as keyof typeof addonDescriptions] || 'Premium analytics and insights'}
                    </p>
                    {type === 'enterprise' ? (
                      <div className="text-xs text-purple-600 font-medium mt-2">
                        ✓ Included in Enterprise
                      </div>
                    ) : premiumUpgrade ? (
                      <div className="text-xs text-purple-600 font-medium mt-2">
                        ✓ Added with Premium Upgrade
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 mt-2">
                        Available with Premium Upgrade (+${type === 'static' ? '2,400' : '200'}{type !== 'static' ? '/month' : ''})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Information Form */}
      {categoryConfig && (
        <form onSubmit={handleSubscribe} className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Complete Your Subscription</h3>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="customerEmail"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@company.com"
              />
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Pricing Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">{category} {type.charAt(0).toUpperCase() + type.slice(1)} Plan:</span>
                <span className="font-medium">${categoryConfig[type].toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Core Add-ons (4 bundled):</span>
                <span className="font-medium text-green-600">Included</span>
              </div>
              {type === 'enterprise' ? (
                <div className="flex justify-between">
                  <span className="text-slate-600">Premium Add-ons (4 included):</span>
                  <span className="font-medium text-purple-600">Included</span>
                </div>
              ) : premiumUpgrade ? (
                <div className="flex justify-between">
                  <span className="text-slate-600">Premium Add-ons (4 optional):</span>
                  <span className="font-medium">
                    ${(type === 'static' ? 2400 : 200).toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-600">Premium Add-ons (4 optional):</span>
                  <span className="font-medium text-slate-400">Not selected</span>
                </div>
              )}
              <div className="border-t border-blue-200 pt-2 flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-blue-600">
                  ${getTotalPrice().toLocaleString()}
                  {type !== 'static' && <span className="text-sm font-normal"> /month</span>}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !category || !customerEmail || !customerName}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-105"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <>
                Subscribe for ${getTotalPrice().toLocaleString()}
                {type !== 'static' && '/month'}
                <ArrowRight className="ml-2 h-6 w-6" />
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Secure payment powered by <strong>Stripe</strong>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              14-day free trial • Cancel anytime • Your payment information is encrypted and secure
            </p>
          </div>
        </form>
      )}
    </div>
  );
}