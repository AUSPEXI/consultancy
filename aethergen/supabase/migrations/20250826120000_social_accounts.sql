-- Idempotent table for storing social OAuth tokens (single-tenant friendly)
create table if not exists public.social_accounts (
    id uuid primary key default gen_random_uuid(),
    provider text not null check (provider in ('linkedin','twitter','meta','instagram')),
    account_ref text,
    owner_email text,
    access_token text,
    refresh_token text,
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_social_accounts_provider on public.social_accounts(provider);
create index if not exists idx_social_accounts_owner on public.social_accounts(owner_email);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_social_accounts_updated_at on public.social_accounts;
create trigger trg_social_accounts_updated_at
before update on public.social_accounts
for each row execute function public.set_updated_at();

alter table public.social_accounts disable row level security;
