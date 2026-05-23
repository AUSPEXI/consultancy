-- Platform core: orgs, profiles, roles, entitlements, billing, listings, audit
-- Idempotent Postgres SQL for Supabase

create extension if not exists pgcrypto;

-- Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- User profiles (link to auth.users via UUID)
create table if not exists public.user_profiles (
  user_id uuid primary key,
  org_id uuid references public.organizations(id) on delete set null,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);
create index if not exists user_profiles_org_idx on public.user_profiles(org_id);

-- Roles
create table if not exists public.roles (
  id serial primary key,
  name text not null unique
);

-- Entitlements (features by slug)
create table if not exists public.entitlements (
  id serial primary key,
  slug text not null unique,
  description text
);

-- Role → Entitlement mapping
create table if not exists public.role_entitlements (
  role_id int references public.roles(id) on delete cascade,
  entitlement_id int references public.entitlements(id) on delete cascade,
  primary key (role_id, entitlement_id)
);

-- User role assignments
create table if not exists public.user_roles (
  user_id uuid references public.user_profiles(user_id) on delete cascade,
  role_id int references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- Products/SKUs
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  stripe_price_id text unique,
  currency text not null default 'gbp',
  unit_amount integer not null,
  interval text,
  created_at timestamptz not null default now()
);
create index if not exists prices_product_idx on public.prices(product_id);

-- Subscriptions & rentals
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists subs_user_idx on public.subscriptions(user_id);

create table if not exists public.model_rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  model_id uuid not null references public.models(id) on delete cascade,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ends_at timestamptz
);
create index if not exists rentals_user_idx on public.model_rentals(user_id);
create index if not exists rentals_model_idx on public.model_rentals(model_id);

-- Marketplace listings (for datasets/models)
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  owner_org text not null,
  kind text not null check (kind in ('dataset','model')),
  ref_id uuid not null,
  title text not null,
  summary text,
  price_id uuid references public.prices(id) on delete set null,
  visibility text not null default 'public',
  created_at timestamptz not null default now()
);
create index if not exists listings_owner_idx on public.marketplace_listings(owner_org);
create index if not exists listings_kind_idx on public.marketplace_listings(kind);

-- Audit log
create table if not exists public.audit_logs (
  id bigserial primary key,
  at timestamptz not null default now(),
  user_id uuid,
  action text not null,
  entity text,
  entity_id uuid,
  meta jsonb
);
create index if not exists audit_action_idx on public.audit_logs(action);

-- Seed core roles and entitlements if missing
do $$
begin
  if not exists (select 1 from public.roles where name = 'admin') then
    insert into public.roles (name) values ('admin'), ('manager'), ('engineer'), ('viewer');
  end if;
  if not exists (select 1 from public.entitlements where slug = 'schemas.manage') then
    insert into public.entitlements (slug, description) values
      ('schemas.manage','Create and edit canonical schemas and feature-sets'),
      ('data.generate','Run synthetic data generation jobs'),
      ('models.train','Train models in workspace'),
      ('models.rent','Rent models from marketplace'),
      ('marketplace.publish','Publish datasets/models to marketplace');
  end if;
end$$;


