-- Queue of social posts to publish via functions
create table if not exists public.social_posts (
    id uuid primary key default gen_random_uuid(),
    provider text not null check (provider in ('linkedin')),
    text text not null,
    url text,
    scheduled_at timestamptz not null,
    status text not null default 'queued' check (status in ('queued','posted','failed')),
    result_json jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_social_posts_provider on public.social_posts(provider);
create index if not exists idx_social_posts_status_sched on public.social_posts(status, scheduled_at);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_social_posts_updated_at on public.social_posts;
create trigger trg_social_posts_updated_at
before update on public.social_posts
for each row execute function public.set_updated_at();

alter table public.social_posts disable row level security;
