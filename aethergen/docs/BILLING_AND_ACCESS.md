# Billing, Pricing, and Access Control (Stripe + Netlify + Supabase)

This document outlines our dual-service model for charging customers: **Self-Service** (lower price, customer handles compute) and **Full-Service** (premium price, we handle everything). This eliminates the compute cost burden that kills most AI companies.

## Company Information
- Website: Auspexi.com
- Email: sales@auspexi.com
- Address: Bridge Street, Guildford, Surrey, UK

## Service Model Overview

### Self-Service Model
- **Lower price point** for technical teams with existing infrastructure
- **What's included:** Pre-trained models + training data + evidence bundles + basic API access + documentation
- **What customer handles:** Compute costs, model hosting, infrastructure setup, deployment support
- **Our margins:** Higher margins since we don't bear compute costs
- **Customer benefit:** Lower total cost, full control over infrastructure

### Full-Service Model
- **Premium pricing** for managed service and infrastructure
- **What's included:** Everything from self-service + AWS infrastructure + compute management + deployment support + SLA guarantees + dedicated support
- **What customer handles:** Nothing - fully managed service
- **Our margins:** Premium margins for complex deployments
- **Customer benefit:** Zero infrastructure management, focus on business outcomes

## Industry-Specific Pricing (GBP)

### Automotive Manufacturing
- **Quality Control & Defect Detection**
  - Self-Service: £599/month
  - Full-Service: £2,999/month
- **Manufacturing Analytics & Optimization**
  - Self-Service: £899/month
  - Full-Service: £3,999/month
- **Safety & Testing Systems**
  - Self-Service: £699/month
  - Full-Service: £2,799/month
- **Supply Chain & Logistics**
  - Self-Service: £799/month
  - Full-Service: £2,899/month

### Healthcare & NHS
- **Fraud Detection & Risk Management**
  - Self-Service: £799/month
  - Full-Service: £3,999/month
- **Medical Research & Clinical Trials**
  - Self-Service: £1,299/month
  - Full-Service: £5,999/month
- **Patient Care & Analytics**
  - Self-Service: £899/month
  - Full-Service: £4,499/month
- **Healthcare Operations & Compliance**
  - Self-Service: £699/month
  - Full-Service: £3,499/month

### Financial Services
- **Credit Risk & Fraud Detection**
  - Self-Service: £1,299/month
  - Full-Service: £6,999/month
- **Market Risk & Trading**
  - Self-Service: £1,999/month
  - Full-Service: £9,999/month
- **Compliance & Regulatory**
  - Self-Service: £1,599/month
  - Full-Service: £7,999/month
- **Insurance & Risk Transfer**
  - Self-Service: £1,799/month
  - Full-Service: £8,999/month

## Platform Access Tiers (Aligned with Live Site)

### Current Platform Tiers (Public Pricing)
- **Developer Hub:** £299/month per seat
  - Quotas: 10M synthetic rows/month, 100 ablation runs/month, 2 RPS API cap
- **Developer Hub Pro:** £499/month per seat
  - Quotas: 50M rows/month, 500 ablation runs/month, 5 RPS, VRME/FRO extended variants
- **Team Platform:** £1,299/month (includes 3 seats)
  - Quotas: 100M rows/month, 1,000 ablation runs/month, 10 RPS, SSO integration
- **Enterprise Platform:** £2,999/month (includes 5 seats; extra seats £199)
  - Quotas negotiated (e.g., 500M+ rows/month), SSO, SLA, audit exports

### Dataset Plans (SMB & Startup)
- Small: £399/month (up to 100K records)
- Medium: £799/month (up to 1M records)
- Large: £1,499/month (up to 10M records)

### Continuous Data Streams
- Basic Stream: £2,999/month (1M rows/day)
- Professional Stream: £7,999/month (10M rows/day)
- Enterprise Stream: £19,999/month (100M rows/day)

## Strategic Pricing Notes

### Cost Savings Proposition
- **90% cost savings** vs Bloomberg Terminal and traditional solutions
- **Primary savings:** Data generation and AI training costs
- **Compute costs:** Handled by customer (self-service) or included in premium (full-service)

### Revenue Protection
- **No cannibalization:** Self-service and full-service serve different customer segments
- **Balanced pricing:** Each tier provides appropriate value for the price point
- **Upsell potential:** Self-service customers can upgrade to full-service

### Market Positioning
- **Self-Service:** Competitive entry point for technical teams
- **Full-Service:** Premium positioning for enterprise customers
- **Flexibility:** Customers choose their comfort level with infrastructure

## Stripe Products & Prices

### Create in Stripe Dashboard:

#### Self-Service Products
- `Automotive: Quality Control - Self Service`
- `Automotive: Manufacturing Analytics - Self Service`
- `Automotive: Safety Testing - Self Service`
- `Automotive: Supply Chain - Self Service`
- `Healthcare: Fraud Detection - Self Service`
- `Healthcare: Medical Research - Self Service`
- `Healthcare: Patient Care - Self Service`
- `Healthcare: Operations - Self Service`
- `Financial: Credit Risk - Self Service`
- `Financial: Market Risk - Self Service`
- `Financial: Compliance - Self Service`
- `Financial: Insurance - Self Service`

#### Full-Service Products
- `Automotive: Quality Control - Full Service`
- `Automotive: Manufacturing Analytics - Full Service`
- `Automotive: Safety Testing - Full Service`
- `Automotive: Supply Chain - Full Service`
- `Healthcare: Fraud Detection - Full Service`
- `Healthcare: Medical Research - Full Service`
- `Healthcare: Patient Care - Full Service`
- `Healthcare: Operations - Full Service`
- `Financial: Credit Risk - Full Service`
- `Financial: Market Risk - Full Service`
- `Financial: Compliance - Full Service`
- `Financial: Insurance - Full Service`

### Price IDs (Examples - Create GBP and USD each)
- `automotive_quality_self_gbp`, `automotive_quality_self_usd`
- `automotive_quality_full_gbp`, `automotive_quality_full_usd`
- `healthcare_fraud_self_gbp`, `healthcare_fraud_self_usd`
- `healthcare_fraud_full_gbp`, `healthcare_fraud_full_usd`
- `financial_credit_self_gbp`, `financial_credit_self_usd`
- `financial_credit_full_gbp`, `financial_credit_full_usd`

## API Endpoints

### Stripe Integration
- `POST /api/stripe/create-checkout` → creates a Checkout Session
  - body: `{ priceId, quantity?, mode?, customer_email?, success_url?, cancel_url?, metadata? }`
  - returns: `{ url }` (redirect user to Stripe)
- `POST /api/stripe/webhook` → receives Stripe events, updates entitlements (Supabase)
- `GET /api/entitlements?email=...` → returns active entitlements for gating UI/features

### Service Level Tracking
- `GET /api/service-level?email=...` → returns customer's service level (self-service vs full-service)
- `POST /api/upgrade-service` → upgrades customer from self-service to full-service

## Environment Variables
Set in Netlify (Site → Settings → Environment):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL` or `SUPABASE_DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for webhook to write entitlements)

## Supabase Tables (Entitlements)

### Customer Management
```sql
create table if not exists public.ae_customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  stripe_customer text unique,
  service_level text check (service_level in ('self-service', 'full-service')) default 'self-service',
  industry text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Service Entitlements
```sql
create table if not exists public.ae_entitlements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.ae_customers(id) on delete cascade,
  stripe_price text not null,
  service_name text not null,
  service_level text not null check (service_level in ('self-service', 'full-service')),
  industry text not null,
  quantity int not null default 1,
  subscription_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, stripe_price)
);
```

### Service Usage Tracking
```sql
create table if not exists public.ae_service_usage (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.ae_customers(id) on delete cascade,
  service_name text not null,
  usage_type text not null,
  usage_amount numeric not null,
  usage_date date not null default current_date,
  created_at timestamptz not null default now()
);
```

## UI Integration

### Service Selection
- **Industry Dropdown:** Automotive, Healthcare, Financial Services
- **Service Level Selection:** Self-Service vs Full-Service radio buttons
- **Pricing Display:** Clear comparison between service levels
- **Service Description:** What's included vs what's not included

### Access Control
- **Self-Service:** Access to models, data, and basic API
- **Full-Service:** Access to models, data, API, infrastructure, and support
- **Feature Gating:** Based on service level entitlements

### Upgrade Flow
- **Self-Service → Full-Service:** Seamless upgrade process
- **Prorated Billing:** Handle partial month upgrades
- **Service Migration:** Transfer existing entitlements

## Webhook Testing
- In Stripe CLI: `stripe listen --forward-to localhost:8888/api/stripe/webhook`
- Create test Checkout Sessions for both service levels
- Verify entitlements written with correct service level
- Test upgrade flow from self-service to full-service

## Strategic Advantages

### For Customers
- **Choice:** Select service level based on infrastructure capabilities
- **Cost Control:** Self-service for technical teams, full-service for business focus
- **Flexibility:** Upgrade service level as needs evolve

### For Auspexi
- **Revenue Protection:** No compute cost burden
- **Market Expansion:** Serve both technical and non-technical customers
- **Margin Optimization:** Higher margins on self-service, premium pricing on full-service
- **Customer Retention:** Multiple upgrade paths and service options

## Databricks Integration
- **Marketplace:** For discoverability and enterprise deals
- **Delta Sharing:** For large-scale enterprise deployments
- **Stripe:** For direct online sales and subscription management
- **Service Model:** Consistent across all channels

## Contact Information
For billing questions, enterprise pricing, or service level upgrades:
- Email: sales@auspexi.com
- Website: https://auspexi.com
- Address: Bridge Street, Guildford, Surrey, UK

## Future Considerations
- **Service Level Analytics:** Track customer usage patterns by service level
- **Automated Upgrades:** Suggest service level upgrades based on usage
- **Hybrid Models:** Custom service level combinations for enterprise customers
- **Regional Pricing:** Localized pricing for different markets


