import React, { useState } from "react";
import { getPriceIdBySku, type PriceSku } from "../../services/stripePriceMap";
import { startStripeCheckout } from "../../services/billingClient";

type Industry = 'automotive' | 'healthcare' | 'financial';
type ServiceLevel = 'self-service' | 'full-service';

type Props = {
  industry: Industry;
  serviceLevel: ServiceLevel;
  priceId?: string;
  priceSku?: PriceSku;
  onServiceLevelChange?: (level: ServiceLevel) => void;
};

export const BuyButtons: React.FC<Props> = ({
  industry,
  serviceLevel,
  priceId,
  priceSku,
  onServiceLevelChange,
}) => {
  const [selectedServiceLevel, setSelectedServiceLevel] = useState<ServiceLevel>(serviceLevel);

  const successUrl = window.location.origin + "/billing/success";
  const cancelUrl = window.location.origin + "/billing/cancel";

  const handleServiceLevelChange = (level: ServiceLevel) => {
    setSelectedServiceLevel(level);
    onServiceLevelChange?.(level);
  };

  const getIndustryDisplayName = (ind: Industry) => {
    switch (ind) {
      case 'automotive': return 'Automotive Manufacturing';
      case 'healthcare': return 'Healthcare & NHS';
      case 'financial': return 'Financial Services';
      default: return ind;
    }
  };

  const getServiceLevelDescription = (level: ServiceLevel) => {
    switch (level) {
      case 'self-service':
        return 'Lower price, you handle compute and infrastructure';
      case 'full-service':
        return 'Premium price, we handle everything including AWS infrastructure';
      default:
        return '';
    }
  };

  const getPricingInfo = (ind: Industry, level: ServiceLevel) => {
    const pricing = {
      automotive: {
        'self-service': { base: 599, range: '£599 - £1,299' },
        'full-service': { base: 2799, range: '£2,799 - £3,999' }
      },
      healthcare: {
        'self-service': { base: 699, range: '£699 - £1,299' },
        'full-service': { base: 3499, range: '£3,499 - £5,999' }
      },
      financial: {
        'self-service': { base: 1299, range: '£1,299 - £1,999' },
        'full-service': { base: 6999, range: '£6,999 - £9,999' }
      }
    };
    return pricing[ind][level];
  };

  const pricing = getPricingInfo(industry, selectedServiceLevel);
  const resolvedPriceId = priceId || (priceSku ? getPriceIdBySku(priceSku) : undefined);

  return (
    <div className="space-y-6">
      {/* Service Level Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Choose Your Service Level for {getIndustryDisplayName(industry)}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              selectedServiceLevel === 'self-service'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => handleServiceLevelChange('self-service')}
          >
            <div className="font-semibold text-slate-900 mb-2">Self-Service</div>
            <div className="text-2xl font-bold text-blue-600 mb-2">{pricing.range}</div>
            <div className="text-sm text-slate-600">{getServiceLevelDescription('self-service')}</div>
            <div className="mt-3 text-xs text-slate-500">
              ✅ Pre-trained models + training data + evidence bundles<br/>
              ❌ You handle compute costs and deployment
            </div>
          </button>

          <button
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              selectedServiceLevel === 'full-service'
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => handleServiceLevelChange('full-service')}
          >
            <div className="font-semibold text-slate-900 mb-2">Full-Service</div>
            <div className="text-2xl font-bold text-purple-600 mb-2">{pricing.range}</div>
            <div className="text-sm text-slate-600">{getServiceLevelDescription('full-service')}</div>
            <div className="mt-3 text-xs text-slate-500">
              ✅ Everything from self-service + AWS infrastructure<br/>
              ✅ Compute management + deployment support
            </div>
          </button>
        </div>
      </div>

      {/* Purchase Button */}
      <div className="text-center">
        <button
          className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!resolvedPriceId}
          onClick={() =>
            resolvedPriceId &&
            startStripeCheckout(resolvedPriceId, {
              mode: "subscription",
              successUrl,
              cancelUrl,
              metadata: { 
                sku: `${industry}_${selectedServiceLevel}`,
                industry,
                serviceLevel: selectedServiceLevel
              },
            })
          }
        >
          {resolvedPriceId ? (
            <>
              Get Started with {getIndustryDisplayName(industry)} {selectedServiceLevel === 'self-service' ? 'Self-Service' : 'Full-Service'}
              <div className="text-sm opacity-90 mt-1">
                Starting at £{pricing.base}/month
              </div>
            </>
          ) : (
            'Contact Sales for Pricing'
          )}
        </button>
        
        {!resolvedPriceId && (
          <div className="mt-3 text-sm text-slate-600">
            Price IDs not configured. Contact sales@auspexi.com for setup.
          </div>
        )}
      </div>

      {/* Strategic Note */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <div className="text-sm text-slate-700">
          <strong>Strategic Advantage:</strong> This dual-model approach eliminates the compute cost burden that kills most AI companies. 
          Customers choose their comfort level while we maintain healthy margins regardless of their choice.
        </div>
      </div>
    </div>
  );
};

export default BuyButtons;


