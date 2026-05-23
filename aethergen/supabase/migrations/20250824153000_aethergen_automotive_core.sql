-- Aethergen core metadata for schemas, feature sets, seeds, datasets, models, evidence
-- Idempotent Postgres SQL for Supabase

-- Extensions
create extension if not exists pgcrypto;

-- Domain schemas (canonical)
create table if not exists public.domain_schemas (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  version int not null default 1,
  schema_json jsonb not null,
  created_at timestamp with time zone not null default now(),
  unique(domain, version)
);

-- Feature sets per domain (task-specific schemas layered over canonical)
create table if not exists public.feature_sets (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  name text not null,
  version int not null default 1,
  schema_json jsonb not null,
  created_at timestamp with time zone not null default now(),
  unique(domain, name, version)
);
create index if not exists feature_sets_domain_idx on public.feature_sets(domain);

-- Seeds (small representative samples)
create table if not exists public.seeds (
  id uuid primary key default gen_random_uuid(),
  feature_set_id uuid not null references public.feature_sets(id) on delete cascade,
  row_count int not null,
  sample jsonb not null,
  created_at timestamp with time zone not null default now()
);
create index if not exists seeds_feature_set_idx on public.seeds(feature_set_id);

-- Datasets (large synthetic outputs)
create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  feature_set_id uuid not null references public.feature_sets(id) on delete cascade,
  total_rows bigint not null,
  storage_url text,
  evidence jsonb,
  created_at timestamp with time zone not null default now()
);
create index if not exists datasets_feature_set_idx on public.datasets(feature_set_id);

-- Models metadata
create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  feature_set_id uuid references public.feature_sets(id) on delete set null,
  name text not null,
  version text not null,
  owner_org text not null,
  private boolean not null default true,
  artifact_url text,
  evidence jsonb,
  created_at timestamp with time zone not null default now(),
  unique(name, version, owner_org)
);
create index if not exists models_feature_set_idx on public.models(feature_set_id);

-- Evidence bundles (attach to datasets or models)
create table if not exists public.evidence_bundles (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references public.datasets(id) on delete cascade,
  model_id uuid references public.models(id) on delete cascade,
  bundle jsonb not null,
  created_at timestamp with time zone not null default now()
);
create index if not exists evidence_dataset_idx on public.evidence_bundles(dataset_id);
create index if not exists evidence_model_idx on public.evidence_bundles(model_id);

-- Optional seed data insert for Automotive canonical schema (safe-upsert style)
do $$
begin
  if not exists (
    select 1 from public.domain_schemas where domain = 'automotive' and version = 1
  ) then
    insert into public.domain_schemas (domain, version, schema_json)
    values (
      'automotive', 1,
      jsonb_build_object(
        'domain','automotive',
        'fields', jsonb_build_array(
          jsonb_build_object('name','vin','type','string','required',true),
          jsonb_build_object('name','plant','type','categorical'),
          jsonb_build_object('name','model','type','categorical'),
          jsonb_build_object('name','trim','type','categorical'),
          jsonb_build_object('name','engine_type','type','categorical'),
          jsonb_build_object('name','production_date','type','date'),
          jsonb_build_object('name','shift','type','categorical'),
          jsonb_build_object('name','operator_id','type','string'),
          jsonb_build_object('name','torque_nm','type','number'),
          jsonb_build_object('name','qc_score','type','number'),
          jsonb_build_object('name','test_pass','type','boolean'),
          jsonb_build_object('name','defects_count','type','number'),
          jsonb_build_object('name','defect_type','type','categorical'),
          jsonb_build_object('name','warranty_claim','type','boolean'),
          jsonb_build_object('name','supplier_code','type','categorical'),
          jsonb_build_object('name','batch_id','type','string')
        )
      )
    );
  end if;
end$$;


