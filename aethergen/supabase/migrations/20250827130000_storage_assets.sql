-- Storage schema for datasets, models, templates, snapshots, evidence
-- Safe to run multiple times

create extension if not exists pgcrypto;

-- Datasets
create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  owner_id uuid,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure required columns exist if table pre-existed
alter table public.datasets add column if not exists org_id uuid;
alter table public.datasets add column if not exists owner_id uuid;
alter table public.datasets add column if not exists description text;
alter table public.datasets add column if not exists created_at timestamptz not null default now();
alter table public.datasets add column if not exists updated_at timestamptz not null default now();

create table if not exists public.dataset_versions (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.datasets(id) on delete cascade,
  version_label text not null,
  row_count bigint not null default 0,
  byte_size bigint not null default 0,
  checksum text,
  proof_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.dataset_versions add column if not exists dataset_id uuid;
alter table public.dataset_versions add column if not exists version_label text;
alter table public.dataset_versions add column if not exists row_count bigint not null default 0;
alter table public.dataset_versions add column if not exists byte_size bigint not null default 0;
alter table public.dataset_versions add column if not exists checksum text;
alter table public.dataset_versions add column if not exists proof_json jsonb;
alter table public.dataset_versions add column if not exists created_at timestamptz not null default now();

create table if not exists public.dataset_artifacts (
  id uuid primary key default gen_random_uuid(),
  dataset_version_id uuid not null references public.dataset_versions(id) on delete cascade,
  storage_path text not null,
  content_type text,
  byte_size bigint,
  checksum text,
  created_at timestamptz not null default now()
);

alter table public.dataset_artifacts add column if not exists dataset_version_id uuid;
alter table public.dataset_artifacts add column if not exists storage_path text;
alter table public.dataset_artifacts add column if not exists content_type text;
alter table public.dataset_artifacts add column if not exists byte_size bigint;
alter table public.dataset_artifacts add column if not exists checksum text;
alter table public.dataset_artifacts add column if not exists created_at timestamptz not null default now();

-- Models
create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  owner_id uuid,
  name text not null,
  task text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.models add column if not exists org_id uuid;
alter table public.models add column if not exists owner_id uuid;
alter table public.models add column if not exists task text;
alter table public.models add column if not exists description text;
alter table public.models add column if not exists created_at timestamptz not null default now();
alter table public.models add column if not exists updated_at timestamptz not null default now();

create table if not exists public.model_versions (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  framework text,
  format text,
  quantization text,
  params jsonb,
  sbom jsonb,
  license text,
  created_at timestamptz not null default now()
);

alter table public.model_versions add column if not exists model_id uuid;
alter table public.model_versions add column if not exists framework text;
alter table public.model_versions add column if not exists format text;
alter table public.model_versions add column if not exists quantization text;
alter table public.model_versions add column if not exists params jsonb;
alter table public.model_versions add column if not exists sbom jsonb;
alter table public.model_versions add column if not exists license text;
alter table public.model_versions add column if not exists created_at timestamptz not null default now();

create table if not exists public.model_artifacts (
  id uuid primary key default gen_random_uuid(),
  model_version_id uuid not null references public.model_versions(id) on delete cascade,
  storage_path text not null,
  byte_size bigint,
  checksum text,
  created_at timestamptz not null default now()
);

alter table public.model_artifacts add column if not exists model_version_id uuid;
alter table public.model_artifacts add column if not exists storage_path text;
alter table public.model_artifacts add column if not exists byte_size bigint;
alter table public.model_artifacts add column if not exists checksum text;
alter table public.model_artifacts add column if not exists created_at timestamptz not null default now();

-- Schema Templates
create table if not exists public.schema_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  owner_id uuid,
  name text not null,
  domain text,
  tags text[],
  created_at timestamptz not null default now()
);

alter table public.schema_templates add column if not exists org_id uuid;
alter table public.schema_templates add column if not exists owner_id uuid;
alter table public.schema_templates add column if not exists domain text;
alter table public.schema_templates add column if not exists tags text[];
alter table public.schema_templates add column if not exists created_at timestamptz not null default now();

create table if not exists public.schema_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.schema_templates(id) on delete cascade,
  schema_json jsonb not null,
  dp_defaults jsonb,
  created_at timestamptz not null default now()
);

alter table public.schema_template_versions add column if not exists template_id uuid;
alter table public.schema_template_versions add column if not exists schema_json jsonb;
alter table public.schema_template_versions add column if not exists dp_defaults jsonb;
alter table public.schema_template_versions add column if not exists created_at timestamptz not null default now();

-- Pipeline Snapshots
create table if not exists public.pipeline_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  owner_id uuid,
  label text,
  config jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.pipeline_snapshots add column if not exists org_id uuid;
alter table public.pipeline_snapshots add column if not exists owner_id uuid;
alter table public.pipeline_snapshots add column if not exists label text;
alter table public.pipeline_snapshots add column if not exists config jsonb;
alter table public.pipeline_snapshots add column if not exists created_at timestamptz not null default now();

create table if not exists public.snapshot_proofs (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.pipeline_snapshots(id) on delete cascade,
  proof_json jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.snapshot_proofs add column if not exists snapshot_id uuid;
alter table public.snapshot_proofs add column if not exists proof_json jsonb;
alter table public.snapshot_proofs add column if not exists created_at timestamptz not null default now();

create table if not exists public.snapshot_metrics (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.pipeline_snapshots(id) on delete cascade,
  metrics jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.snapshot_metrics add column if not exists snapshot_id uuid;
alter table public.snapshot_metrics add column if not exists metrics jsonb;
alter table public.snapshot_metrics add column if not exists created_at timestamptz not null default now();

-- Evidence and Proof Links
create table if not exists public.evidence_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  owner_id uuid,
  event_type text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.evidence_events add column if not exists org_id uuid;
alter table public.evidence_events add column if not exists owner_id uuid;
alter table public.evidence_events add column if not exists details jsonb;
alter table public.evidence_events add column if not exists created_at timestamptz not null default now();

create table if not exists public.proof_links (
  id uuid primary key default gen_random_uuid(),
  dataset_version_id uuid references public.dataset_versions(id) on delete cascade,
  model_version_id uuid references public.model_versions(id) on delete cascade,
  proof_id uuid references public.snapshot_proofs(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.proof_links add column if not exists dataset_version_id uuid;
alter table public.proof_links add column if not exists model_version_id uuid;
alter table public.proof_links add column if not exists proof_id uuid;
alter table public.proof_links add column if not exists created_at timestamptz not null default now();

-- RLS
alter table public.datasets enable row level security;
alter table public.dataset_versions enable row level security;
alter table public.dataset_artifacts enable row level security;
alter table public.models enable row level security;
alter table public.model_versions enable row level security;
alter table public.model_artifacts enable row level security;
alter table public.schema_templates enable row level security;
alter table public.schema_template_versions enable row level security;
alter table public.pipeline_snapshots enable row level security;
alter table public.snapshot_proofs enable row level security;
alter table public.snapshot_metrics enable row level security;
alter table public.evidence_events enable row level security;
alter table public.proof_links enable row level security;

-- Owner can read/write own rows
-- Create policies only if missing (Postgres doesn't support IF NOT EXISTS for policies)
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='datasets' and column_name='owner_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='datasets' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.datasets for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='dataset_versions' and column_name='dataset_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='dataset_versions' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.dataset_versions for all using (exists (select 1 from public.datasets d where d.id = dataset_id and d.owner_id = auth.uid())) with check (exists (select 1 from public.datasets d where d.id = dataset_id and d.owner_id = auth.uid()))';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='dataset_artifacts' and column_name='dataset_version_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='dataset_artifacts' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.dataset_artifacts for all using (exists (select 1 from public.dataset_versions v join public.datasets d on d.id = v.dataset_id where v.id = dataset_version_id and d.owner_id = auth.uid())) with check (exists (select 1 from public.dataset_versions v join public.datasets d on d.id = v.dataset_id where v.id = dataset_version_id and d.owner_id = auth.uid()))';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='models' and column_name='owner_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='models' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.models for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='model_versions' and column_name='model_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='model_versions' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.model_versions for all using (exists (select 1 from public.models m where m.id = model_id and m.owner_id = auth.uid())) with check (exists (select 1 from public.models m where m.id = model_id and m.owner_id = auth.uid()))';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='model_artifacts' and column_name='model_version_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='model_artifacts' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.model_artifacts for all using (exists (select 1 from public.model_versions v join public.models m on m.id = v.model_id where v.id = model_version_id and m.owner_id = auth.uid())) with check (exists (select 1 from public.model_versions v join public.models m on m.id = v.model_id where v.id = model_version_id and m.owner_id = auth.uid()))';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='schema_templates' and column_name='owner_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='schema_templates' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.schema_templates for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='schema_template_versions' and column_name='template_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='schema_template_versions' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.schema_template_versions for all using (exists (select 1 from public.schema_templates t where t.id = template_id and t.owner_id = auth.uid())) with check (exists (select 1 from public.schema_templates t where t.id = template_id and t.owner_id = auth.uid()))';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='pipeline_snapshots' and column_name='owner_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='pipeline_snapshots' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.pipeline_snapshots for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='snapshot_proofs' and column_name='snapshot_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='snapshot_proofs' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.snapshot_proofs for all using (exists (select 1 from public.pipeline_snapshots s where s.id = snapshot_id and s.owner_id = auth.uid())) with check (exists (select 1 from public.pipeline_snapshots s where s.id = snapshot_id and s.owner_id = auth.uid()))';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='snapshot_metrics' and column_name='snapshot_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='snapshot_metrics' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.snapshot_metrics for all using (exists (select 1 from public.pipeline_snapshots s where s.id = snapshot_id and s.owner_id = auth.uid())) with check (exists (select 1 from public.pipeline_snapshots s where s.id = snapshot_id and s.owner_id = auth.uid()))';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='evidence_events' and column_name='owner_id') and
     not exists (select 1 from pg_policies where schemaname='public' and tablename='evidence_events' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.evidence_events for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='proof_links' and policyname='owner_rw') then
    execute 'create policy owner_rw on public.proof_links for all using (true) with check (true)';
  end if;
end $$;


