import React, { useEffect, useState } from "react";
import { getEntitlements, hasPlatformAccess, Entitlement } from "../../services/entitlementsClient";
import { BuyButtons } from "./BuyButtons";

type Industry = 'automotive' | 'healthcare' | 'financial';
type ServiceLevel = 'self-service' | 'full-service';

type Props = {
  userEmail?: string;
  industry: Industry;
  priceIdSelfService?: string;
  priceIdFullService?: string;
};

export const PlatformAccess: React.FC<Props> = ({ 
  userEmail, 
  industry, 
  priceIdSelfService, 
  priceIdFullService 
}) => {
  const [ents, setEnts] = useState<Entitlement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceLevel, setSelectedServiceLevel] = useState<ServiceLevel>('self-service');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!userEmail) {
          setEnts([]);
          return;
        }
        const e = await getEntitlements({ email: userEmail });
        if (mounted) setEnts(e);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load entitlements");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userEmail]);

  const hasIndustryAccess = ents ? 
    hasPlatformAccess(ents, [priceIdSelfService || "", priceIdFullService || ""]) : 
    false;

  const getIndustryDisplayName = (ind: Industry) => {
    switch (ind) {
      case 'automotive': return 'Automotive Manufacturing';
      case 'healthcare': return 'Healthcare & NHS';
      case 'financial': return 'Financial Services';
      default: return ind;
    }
  };

  const getCurrentPriceId = () => {
    return selectedServiceLevel === 'self-service' ? priceIdSelfService : priceIdFullService;
  };

  return (
    <div className="p-6 border border-slate-200 rounded-lg bg-white">
      <h3 className="text-xl font-semibold mb-4 text-slate-900">
        {getIndustryDisplayName(industry)} Platform Access
      </h3>
      
      {error && (
        <div className="text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}
      
      {ents === null ? (
        <div className="text-slate-600">Checking your access…</div>
      ) : hasIndustryAccess ? (
        <div className="text-emerald-700 p-4 bg-emerald-50 rounded border border-emerald-200">
          ✅ You have active access to {getIndustryDisplayName(industry)} services.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-slate-700">
            Get access to {getIndustryDisplayName(industry)} synthetic data and AI models.
          </div>
          
          <BuyButtons
            industry={industry}
            serviceLevel={selectedServiceLevel}
            priceId={getCurrentPriceId()}
            onServiceLevelChange={setSelectedServiceLevel}
          />
          
          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
            <strong>Note:</strong> Configure your Stripe Price IDs for both service levels in this component, 
            or contact sales@auspexi.com for enterprise pricing.
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAccess;


