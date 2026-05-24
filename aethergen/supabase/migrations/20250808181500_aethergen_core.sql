-- AethergenAI core schema (generic)
-- Safe to run multiple times

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- User-defined schemas captured from the UI (hash for lineage)
create table if not exists public.ae_schemas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  schema_json jsonb not null,
  schema_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ae_schemas_hash on public.ae_schemas (schema_hash);

-- Datasets (seed or synthetic) with lineage
create table if not exists public.ae_datasets (
  id uuid primary key default gen_random_uuid(),
  schema_id uuid references public.ae_schemas(id) on delete set null,
  kind text not null check (kind in ('seed','synthetic')),
  record_count bigint not null default 0,
  storage_uri text,
  created_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);
create index if not exists idx_ae_datasets_schema on public.ae_datasets (schema_id);

-- Ablation runs and summaries
create table if not exists public.ae_ablation_runs (
  id uuid primary key default gen_random_uuid(),
  schema_id uuid references public.ae_schemas(id) on delete set null,
  recipe_hash text not null,
  recipe_json jsonb not null,
  summary_json jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_ae_ablation_runs_schema on public.ae_ablation_runs (schema_id);
create index if not exists idx_ae_ablation_runs_recipe on public.ae_ablation_runs (recipe_hash);

-- Evidence bundles for governance
create table if not exists public.ae_evidence_bundles (
  id uuid primary key default gen_random_uuid(),
  ablation_run_id uuid references public.ae_ablation_runs(id) on delete cascade,
  content jsonb not null,
  created_at timestamptz not null default now()
);

-- Privacy evaluations
create table if not exists public.ae_privacy_evaluations (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references public.ae_datasets(id) on delete cascade,
  epsilon numeric,
  synthetic_ratio numeric,
  attack_metrics jsonb,
  created_at timestamptz not null default now()
);

-- RLS (demo: read-open; tighten later)
alter table public.ae_schemas enable row level security;
alter table public.ae_datasets enable row level security;
alter table public.ae_ablation_runs enable row level security;
alter table public.ae_evidence_bundles enable row level security;
alter table public.ae_privacy_evaluations enable row level security;

create policy if not exists ae_schemas_read on public.ae_schemas for select using (true);
create policy if not exists ae_datasets_read on public.ae_datasets for select using (true);
create policy if not exists ae_ablation_runs_read on public.ae_ablation_runs for select using (true);
create policy if not exists ae_evidence_bundles_read on public.ae_evidence_bundles for select using (true);
create policy if not exists ae_privacy_evaluations_read on public.ae_privacy_evaluations for select using (true);

-- Simple aggregated stats RPC
create or replace function public.ae_get_stats()
returns table (
  schemas bigint,
  datasets bigint,
  ablation_runs bigint,
  evidence_bundles bigint,
  privacy_evaluations bigint
) language sql stable as $$
  select
    (select count(*) from public.ae_schemas) as schemas,
    (select count(*) from public.ae_datasets) as datasets,
    (select count(*) from public.ae_ablation_runs) as ablation_runs,
    (select count(*) from public.ae_evidence_bundles) as evidence_bundles,
    (select count(*) from public.ae_privacy_evaluations) as privacy_evaluations;
$$;

grant execute on function public.ae_get_stats() to anon, authenticated;
