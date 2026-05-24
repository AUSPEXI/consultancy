-- Marketplace DB (idempotent, shelfable). Safe to run multiple times.
-- Tables:
--  provider_profiles, listings, listing_versions, pricing_tiers,
--  listing_evidence_links, usage_events, payout_statements

-- Providers (creators/vendors). Aethergen can also be a provider.
create table if not exists public.provider_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid, -- row ownership (user id)
  org_id uuid,   -- optional org
  handle text unique,
  display_name text not null,
  website text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.provider_profiles enable row level security;

-- Listings (logical product)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  org_id uuid,
  provider_id uuid references public.provider_profiles(id) on delete cascade,
  slug text unique,
  name text not null,
  category text, -- e.g., 'geometric','harmonic','vision','llm','databricks'
  status text not null default 'draft', -- draft|published|paused|delisted
  short_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings enable row level security;
create index if not exists idx_listings_provider on public.listings(provider_id);
create index if not exists idx_listings_status on public.listings(status);

-- Listing versions (immutable metadata snapshots)
create table if not exists public.listing_versions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  version_label text not null,
  artifact_manifest jsonb,  -- filenames, checksums, formats (ONNX/GGUF)
  sbom jsonb,
  license_json jsonb,
  evidence_json jsonb,      -- harness metrics, privacy bounds, latency, etc.
  created_at timestamptz not null default now(),
  unique (listing_id, version_label)
);

create index if not exists idx_listing_versions_listing on public.listing_versions(listing_id);

-- Pricing tiers
create table if not exists public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  name text not null,                -- Free / Pro / Enterprise / Private Offer
  unit text not null,                -- 'per_1k_tokens' | 'per_second' | 'per_call' | 'private'
  unit_price numeric(12,4),          -- nullable for private
  minimum_monthly numeric(12,2),     -- optional commit
  currency text not null default 'GBP',
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_pricing_listing on public.pricing_tiers(listing_id);

-- Evidence links (external pointers to proofs, reports, cards)
create table if not exists public.listing_evidence_links (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  version_id uuid references public.listing_versions(id) on delete set null,
  kind text not null,           -- 'card' | 'proof' | 'report' | 'sbom'
  uri text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_evidence_listing on public.listing_evidence_links(listing_id);

-- Usage events (aggregated later for billing)
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  customer_id uuid,          -- internal customer/account id if available
  tenant_key text,           -- external tenant or token key
  ts timestamptz not null default now(),
  calls integer default 0,
  tokens bigint default 0,
  seconds bigint default 0,
  request_id text,
  meta jsonb
);

create index if not exists idx_usage_listing_ts on public.usage_events(listing_id, ts);

-- Payout statements (creator accounting)
create table if not exists public.payout_statements (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  currency text not null default 'GBP',
  gross_amount numeric(14,2) not null default 0,
  platform_fee numeric(14,2) not null default 0,
  infra_cost numeric(14,2) not null default 0,
  tax_withheld numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  status text not null default 'draft', -- draft|ready|paid
  created_at timestamptz not null default now(),
  unique (provider_id, period_start, period_end)
);

create index if not exists idx_payouts_provider on public.payout_statements(provider_id);

-- RLS policies (idempotent via DO blocks; require owner_id columns)

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'providers_owner_rw' and tablename = 'provider_profiles')
  then execute 'create policy providers_owner_rw on public.provider_profiles for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())'; end if;
exception when others then null; end $$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'listings_owner_rw' and tablename = 'listings')
  then execute 'create policy listings_owner_rw on public.listings for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())'; end if;
exception when others then null; end $$;

-- Read-only policies for published listings to all authenticated users (optional)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'listings_read_published' and tablename = 'listings')
  then execute 'create policy listings_read_published on public.listings for select using (status = ''published'')'; end if;
exception when others then null; end $$;

-- Triggers to update updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tg_listings_updated_at') then
    create trigger tg_listings_updated_at before update on public.listings
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'tg_providers_updated_at') then
    create trigger tg_providers_updated_at before update on public.provider_profiles
    for each row execute function public.set_updated_at();
  end if;
end $$;


