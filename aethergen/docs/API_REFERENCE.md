# AethergenAI API Reference (Public Endpoints)

## Company Information
- Website: Auspexi.com
- Email: sales@auspexi.com
- Address: Bridge Street, Guildford, Surrey, UK

## Overview
Base: browser app via Netlify. All endpoints proxied under `/api/*`.
Public site routes include `/press`, `/pricing`, `/about`, `/technology`, `/resources`.

## Notes
- Offline mode disables remote calls in the app.
- Some endpoints require Netlify env vars (Supabase, Stripe).

## Authentication
- Current MVP: public endpoints with demo‑open read policies for selected tables. 
- Production should add auth tokens and project scoping.

## Core Endpoints

### Statistics & Monitoring
- GET `/refresh-stats`
  - Purpose: fetch aggregate counts via Supabase RPC.
  - Returns: `{ schemas: number, datasets: number, ablations: number, evidence: number }`
  - Use case: Dashboard metrics and platform status

### Schema Management
- POST `/api/store-schema`
  - Purpose: insert/update schema in `ae_schemas`.
  - Body: `{ id?: string, name: string, fields: Field[], privacy: {...}, version?: string }`
  - Returns: `{ id: string }`
  - Use case: Create or update data schemas for synthetic generation

### Dataset Operations
- POST `/api/record-dataset`
  - Purpose: record dataset metadata in `ae_datasets`.
  - Body: `{ schema_id?: string, rows: number, cleaning_report?: {...}, storage_uri?: string }`
  - Returns: `{ id: string }`
  - Use case: Record generated synthetic datasets and metadata

### Ablation Testing
- POST `/api/record-ablation`
  - Purpose: record ablation run details in `ae_ablation_runs`.
  - Body: `{ recipe: {...}, summary: {...}, metrics: {...} }`
  - Returns: `{ id: string }`
  - Use case: Record ablation testing results and optimization metrics

### Evidence Management
- POST `/api/publish-evidence`
  - Purpose: store evidence bundles in `ae_evidence_bundles`.
  - Body: see `docs/EVIDENCE_BUNDLE_SPEC.md`
  - Returns: `{ id: string, hash: string }`
  - Use case: Store compliance and audit evidence bundles

### MLflow Integration
- POST `/api/log-mlflow`
  - Purpose: log ablation/benchmark results to Databricks MLflow (when configured).
  - Body: `{ experiment: string, run: {...}, artifacts?: {...} }`
  - Returns: `{ ok: boolean, run_url?: string }`
  - Use case: Integration with enterprise ML platforms

## Billing & Access Endpoints

### Stripe Checkout
- POST `/api/stripe/create-checkout`
  - Purpose: create Stripe Checkout session.
  - Body: `{ priceId: string, mode?: 'payment'|'subscription', quantity?: number, customer_email?: string, success_url?: string, cancel_url?: string, metadata?: {...} }`
  - Returns: `{ url: string }`
  - Use case: Platform access and dataset purchases

### Stripe Webhook
- POST `/api/stripe/webhook`
  - Purpose: Stripe event receiver; writes entitlements into Supabase.
  - Headers: `stripe-signature`
  - Body: Stripe event payload (raw JSON)
  - Returns: `{ received: true }`
  - Use case: Automatic subscription and payment processing

### Entitlements
- GET `/api/entitlements?email=...` or `?stripe_customer=...`
  - Purpose: fetch active entitlements.
  - Returns: `{ entitlements: [{ stripe_price, quantity, subscription_id, active, updated_at }] }`
  - Use case: Feature gating and access control

### Pricing Catalog (optional)
- GET `/api/pricing`
  - Purpose: return public pricing tiers aligned with live site (platform tiers, datasets, streams, white‑label, models)
  - Returns: `{ platform: [...], datasets: [...], streams: [...], whiteLabel: [...], models: [...] }`

## Response Codes
- 200: Success
- 4xx: Client input errors
- 5xx: Server/config issues

## Security Considerations
- Move to authenticated endpoints and project‑scoped RBAC before production.
- Never pass secrets from browser; use Netlify functions with env vars.
- Implement rate limiting for production use.

## Rate Limits
- Development: No rate limits
- Production: Implement based on subscription tier
- Enterprise: Custom rate limits negotiated

## Error Handling
All endpoints return consistent error responses:
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

## Support & Documentation
For API support or questions:
- Email: sales@auspexi.com
- Website: https://auspexi.com
- Documentation: https://auspexi.com/resources

## Versioning
- Current API version: v1.0
- Backward compatibility maintained within major versions
- Deprecation notices provided 6 months in advance

## Testing
- Use Stripe CLI for webhook testing: `stripe listen --forward-to localhost:8888/api/stripe/webhook`
- Create test Checkout Sessions to verify entitlements
- Test all endpoints with sample data before production use


