import type { Handler } from '@netlify/functions';
import { createHash } from 'node:crypto';

// Returns current public pricing catalog used by the Pricing page
// Aligns with src/pages/Pricing.tsx defaults
export const handler: Handler = async () => {
  const catalog = {
    platform: [
      {
        name: 'Developer Hub',
        price: { gbp: '£299', usd: '$379' },
        period: 'per month per seat',
        quotas: { rows: '10M', ablation: '100', api: '2 RPS' },
        features: [
          '10M synthetic rows/month',
          '100 ablation runs/month',
          '2 RPS API cap',
          'Basic support',
          'Standard datasets access',
          'API documentation'
        ]
      },
      {
        name: 'Developer Hub Pro',
        price: { gbp: '£499', usd: '$629' },
        period: 'per month per seat',
        quotas: { rows: '50M', ablation: '500', api: '5 RPS' },
        features: [
          '50M synthetic rows/month',
          '500 ablation runs/month',
          '5 RPS API cap',
          'VRME/FRO extended variants',
          'Priority support',
          'Advanced datasets access',
          'Custom model training'
        ]
      },
      {
        name: 'Team Platform',
        price: { gbp: '£1,299', usd: '$1,649' },
        period: 'per month (includes 3 seats)',
        quotas: { rows: '100M', ablation: '1,000', api: '10 RPS' },
        features: [
          '100M synthetic rows/month',
          '1,000 ablation runs/month',
          '10 RPS API cap',
          'SSO integration',
          'Priority support',
          'Advanced datasets access',
          'Custom model training',
          'Basic SLA'
        ]
      },
      {
        name: 'Enterprise Platform',
        price: { gbp: '£2,999', usd: '$3,799' },
        period: 'per month (includes 5 seats)',
        quotas: { rows: '500M+', ablation: 'Unlimited', api: 'Unlimited' },
        features: [
          '500M+ rows/month (negotiated)',
          'Unlimited ablation runs',
          'Unlimited API calls',
          'SSO integration',
          'SLA guarantees',
          'Audit exports',
          'Dedicated support',
          'White-label capabilities'
        ]
      }
    ],
    datasets: [
      { name: 'Small Dataset', price: { gbp: '£399', usd: '$499' }, period: 'per month', features: ['Up to 100K records', 'Full Delta table', 'Evidence bundle', 'Monthly refresh', 'Basic support'] },
      { name: 'Medium Dataset', price: { gbp: '£799', usd: '$999' }, period: 'per month', features: ['Up to 1M records', 'Full Delta table', 'Evidence bundle', 'Monthly refresh', 'Priority support'] },
      { name: 'Large Dataset', price: { gbp: '£1,499', usd: '$1,899' }, period: 'per month', features: ['Up to 10M records', 'Full Delta table', 'Evidence bundle', 'Monthly refresh', 'Priority support'] }
    ],
    streams: [
      { name: 'Basic Stream', price: { gbp: '£2,999', usd: '$3,749' }, period: 'per month', features: ['1M rows/day (30M/month)', 'Real-time generation', 'Evidence bundles', 'Basic storage included', 'API access'] },
      { name: 'Professional Stream', price: { gbp: '£7,999', usd: '$9,999' }, period: 'per month', features: ['10M rows/day (300M/month)', 'Real-time generation', 'Evidence bundles', 'Extended storage', 'Priority API access'] },
      { name: 'Enterprise Stream', price: { gbp: '£19,999', usd: '$24,999' }, period: 'per month', features: ['100M rows/day (3B/month)', 'Real-time generation', 'Evidence bundles', 'Unlimited storage', 'Dedicated support'] }
    ],
    whiteLabel: [
      { name: 'White Label Basic', price: { gbp: '£4,999', usd: '$6,249' }, period: 'per month', features: ['Custom branding', 'Up to 50M records/mo', 'Basic API access', 'Standard support', 'Custom compliance'] },
      { name: 'White Label Pro', price: { gbp: '£12,999', usd: '$16,249' }, period: 'per month', features: ['Custom branding', 'Up to 500M records/mo', 'Advanced API access', 'Priority support', 'Custom compliance'] },
      { name: 'Enterprise Platform', price: { gbp: 'Contact Sales', usd: 'Contact Sales' }, period: '', features: ['Full platform licensing', 'Unlimited records', 'Custom integrations', 'Dedicated team', 'SLA guarantees'] }
    ],
    models: [
      { name: 'Model Seat', price: { gbp: '£149', usd: '$199' }, period: 'per seat/month', features: ['Access to one niche model', 'Per-seat rate', 'Evidence-backed', 'Basic support'] },
      { name: 'Prediction Credits 100k', price: { gbp: '£49', usd: '$59' }, period: 'one-time', features: ['100k prediction credits', 'Usage-based', 'No expiration', 'Basic support'] },
      { name: 'Prediction Credits 1M', price: { gbp: '£399', usd: '$499' }, period: 'one-time', features: ['1M prediction credits', 'Usage-based', 'No expiration', 'Priority support'] }
    ],
    storage: [
      { name: 'Hot Storage', price: { gbp: '£99', usd: '$129' }, period: 'per TB/month', features: ['Frequently accessed data', 'Fast retrieval', 'High availability', 'SLA guarantee'] },
      { name: 'Warm Storage', price: { gbp: '£49', usd: '$69' }, period: 'per TB/month', features: ['Occasionally accessed data', 'Balanced performance', 'Cost optimization'] },
      { name: 'Cold Storage', price: { gbp: '£19', usd: '$29' }, period: 'per TB/month', features: ['Rarely accessed data', 'Maximum cost savings', 'Long-term retention'] }
    ]
  } as const;

  const body = JSON.stringify(catalog);
  const etag = createHash('sha1').update(body).digest('hex');
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=300, stale-while-revalidate=86400',
      etag
    },
    body
  };
};

