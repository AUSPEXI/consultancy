import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface CategoryConfig {
  self_service: {
    base_price: number;
    range: string;
    categories: string[];
    features: string[];
  };
  full_service: {
    base_price: number;
    range: string;
    categories: string[];
    features: string[];
  };
  description: string;
  available: boolean;
}

export const categories: Record<string, CategoryConfig> = {
  'Automotive': {
    self_service: {
      base_price: 599,
      range: '£599 - £1,299',
      categories: ['Quality Control', 'Manufacturing Analytics', 'Safety Testing', 'Supply Chain'],
      features: [
        'Pre-trained models for automotive applications',
        'Training datasets with evidence bundles',
        'Basic API access and documentation',
        'Customer handles compute and infrastructure'
      ]
    },
    full_service: {
      base_price: 2799,
      range: '£2,799 - £3,999',
      categories: ['Quality Control', 'Manufacturing Analytics', 'Safety Testing', 'Supply Chain'],
      features: [
        'Everything from self-service',
        'AWS infrastructure setup',
        'Compute management and deployment',
        'SLA guarantees and dedicated support'
      ]
    },
    description: 'Quality control, defect detection, production optimization, and supply chain analytics',
    available: true
  },
  'Healthcare': {
    self_service: {
      base_price: 699,
      range: '£699 - £1,299',
      categories: ['Fraud Detection', 'Medical Research', 'Patient Care', 'Operations'],
      features: [
        'Pre-trained models for healthcare applications',
        'Training datasets with evidence bundles',
        'Basic API access and documentation',
        'Customer handles compute and infrastructure'
      ]
    },
    full_service: {
      base_price: 3499,
      range: '£3,499 - £5,999',
      categories: ['Fraud Detection', 'Medical Research', 'Patient Care', 'Operations'],
      features: [
        'Everything from self-service',
        'AWS infrastructure setup',
        'Compute management and deployment',
        'SLA guarantees and dedicated support'
      ]
    },
    description: 'Medical research, fraud detection, healthcare analytics, and NHS compliance',
    available: true
  },
  'Financial': {
    self_service: {
      base_price: 1299,
      range: '£1,299 - £1,999',
      categories: ['Credit Risk', 'Market Risk', 'Compliance', 'Insurance'],
      features: [
        'Pre-trained models for financial applications',
        'Training datasets with evidence bundles',
        'Basic API access and documentation',
        'Customer handles compute and infrastructure'
      ]
    },
    full_service: {
      base_price: 6999,
      range: '£6,999 - £9,999',
      categories: ['Credit Risk', 'Market Risk', 'Compliance', 'Insurance'],
      features: [
        'Everything from self-service',
        'AWS infrastructure setup',
        'Compute management and deployment',
        'SLA guarantees and dedicated support'
      ]
    },
    description: 'Banking, trading, risk management, compliance, and insurance applications',
    available: true
  }
};

export interface SubscriptionData {
  category: string;
  serviceLevel: 'self_service' | 'full_service';
  price: number;
  features: string[];
  customerEmail: string;
  customerName: string;
}

export async function createCheckoutSession(subscriptionData: SubscriptionData) {
  try {
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    
    // Redirect to Stripe Checkout
    const stripe = await import('@stripe/stripe-js').then(module => 
      module.loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    );
    
    if (stripe) {
      await stripe.redirectToCheckout({ sessionId });
    }
  } catch (error) {
    console.error('Subscription error:', error);
    throw error;
  }
}

export async function logSubscriptionAttempt(subscriptionData: SubscriptionData) {
  try {
    const { data, error } = await supabase
      .from('subscription_attempts')
      .insert([
        {
          category: subscriptionData.category,
          service_level: subscriptionData.serviceLevel,
          price: subscriptionData.price,
          customer_email: subscriptionData.customerEmail,
          customer_name: subscriptionData.customerName,
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to log subscription attempt:', error);
    throw error;
  }
}

export async function getSubscriptionHistory(email: string) {
  try {
    const { data, error } = await supabase
      .from('subscription_attempts')
      .select('*')
      .eq('customer_email', email)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get subscription history:', error);
    throw error;
  }
}

export function getCategoryPricing(category: string) {
  return categories[category] || null;
}

export function getServiceLevelPricing(category: string, serviceLevel: 'self_service' | 'full_service') {
  const categoryConfig = categories[category];
  if (!categoryConfig) return null;
  
  return categoryConfig[serviceLevel];
}

export function calculateTotalPrice(category: string, serviceLevel: 'self_service' | 'full_service', addons: string[] = []) {
  const basePricing = getServiceLevelPricing(category, serviceLevel);
  if (!basePricing) return 0;
  
  // Base price for the service level
  let total = basePricing.base_price;
  
  // Add-on pricing could be implemented here
  // For now, we're using the base pricing structure
  
  return total;
}

export function getAvailableCategories(): string[] {
  return Object.keys(categories).filter(cat => categories[cat].available);
}

export function getAllCategories(): string[] {
  return Object.keys(categories);
}

export function getAddonsForCategory(category: string) {
  return categories[category]?.addons || { core: [], premium: [] };
}

export function getCategoryConfig(category: string): CategoryConfig | null {
  return categories[category] || null;
}

export function getAddonDescriptions() {
  return {
    // Government add-ons (v1.0 current) - 4 core bundled + 4 premium optional
    sentimentDynamics: 'Real-time sentiment analysis and community engagement tracking',
    behaviorPrediction: 'Behavioral pattern prediction and outcome forecasting',
    environmentalImpact: 'Environmental impact assessment and sustainability metrics',
    resourceOptimization: 'Resource allocation and operational efficiency optimization',
    networkAnalysis: 'Advanced network analysis and relationship mapping',
    advancedOptimization: 'Advanced optimization algorithms and decision support',
    patternClustering: 'Machine learning clustering and pattern recognition',
    predictiveForecasting: 'Predictive forecasting and trend analysis',
    
    // Finance add-ons (now available) - 4 core bundled + 4 premium optional
    financialSentiment: 'Market sentiment analysis and investor behavior tracking',
    transactionAnalytics: 'Transaction pattern analysis and fraud detection',
    regulatoryCompliance: 'Automated compliance monitoring and reporting',
    wealthManagement: 'Portfolio optimization and wealth advisory analytics',
    riskOptimization: 'Advanced risk modeling and mitigation strategies',
    portfolioAnalytics: 'Portfolio performance analysis and optimization',
    marketForecasting: 'Market trend prediction and analysis',
    fraudDetection: 'Advanced fraud detection and prevention systems',
    
    // Manufacturing add-ons (planned 2026) - 4 core bundled + 4 premium optional
    productionOptimization: 'Production line efficiency and throughput optimization',
    qualityControl: 'Automated quality assurance and defect prediction',
    supplyChainAnalytics: 'Supply chain visibility and optimization',
    maintenancePrediction: 'Predictive maintenance and equipment lifecycle management',
    iotIntegration: 'Industrial IoT data integration and analytics',
    energyOptimization: 'Energy consumption optimization and efficiency',
    safetyAnalytics: 'Industrial safety monitoring and risk assessment',
    demandForecasting: 'Demand prediction and inventory optimization'
  };
}