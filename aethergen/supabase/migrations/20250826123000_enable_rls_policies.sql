-- Enable RLS on flagged public tables and add safe, minimal policies
-- Idempotent: ALTER TABLE ENABLE RLS is safe; policies use drop-if-exists guards

-- Core metadata/domain tables (RLS on; access via service_role from Functions)
alter table if exists public.evidence_bundles enable row level security;
alter table if exists public.feature_sets enable row level security;
alter table if exists public.seeds enable row level security;
alter table if exists public.domain_schemas enable row level security;
alter table if exists public.datasets enable row level security;
alter table if exists public.models enable row level security;
alter table if exists public.organizations enable row level security;
alter table if exists public.user_profiles enable row level security;
alter table if exists public.roles enable row level security;
alter table if exists public.role_entitlements enable row level security;
alter table if exists public.entitlements enable row level security;
alter table if exists public.user_roles enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.prices enable row level security;
alter table if exists public.subscriptions enable row level security;
alter table if exists public.model_rentals enable row level security;
alter table if exists public.marketplace_listings enable row level security;
alter table if exists public.audit_logs enable row level security;
alter table if exists public.social_accounts enable row level security;
alter table if exists public.social_posts enable row level security;

-- Blog posts: public can read only published rows
alter table if exists public.blog_posts enable row level security;

drop policy if exists blog_posts_read_published on public.blog_posts;
create policy blog_posts_read_published
  on public.blog_posts
  for select
  to anon
  using (status = 'published');

-- Allow authenticated users to read published as well

drop policy if exists blog_posts_read_published_auth on public.blog_posts;
create policy blog_posts_read_published_auth
  on public.blog_posts
  for select
  to authenticated
  using (status = 'published');
