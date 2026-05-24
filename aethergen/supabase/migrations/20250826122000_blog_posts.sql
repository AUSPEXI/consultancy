create table if not exists public.blog_posts (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    title text not null,
    excerpt text not null,
    content_html text not null,
    tags text[] default '{}',
    status text not null default 'draft' check (status in ('draft','scheduled','published')),
    scheduled_at timestamptz,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_blog_posts_status_sched on public.blog_posts(status, scheduled_at);
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

alter table public.blog_posts disable row level security;
