-- Billing & Entitlements schema for Stripe integration
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT patterns expected by webhook

create extension if not exists pgcrypto;

create table if not exists public.ae_customers (
  id uuid primary key default gen_random_uuid(),
  email text,
  stripe_customer text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ae_entitlements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.ae_customers(id) on delete cascade,
  stripe_price text,
  quantity int not null default 1,
  subscription_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, stripe_price)
);

-- RLS demo: keep open read for now (optional, align with your policy baseline)
alter table public.ae_customers enable row level security;
alter table public.ae_entitlements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ae_customers' and policyname = 'ae_customers_read'
  ) then
    create policy ae_customers_read on public.ae_customers for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ae_entitlements' and policyname = 'ae_entitlements_read'
  ) then
    create policy ae_entitlements_read on public.ae_entitlements for select using (true);
  end if;
end $$;


