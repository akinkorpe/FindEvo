-- 0008_subscriptions.sql
--
-- Persists the active plan for each signed-in user. Source of truth for what
-- /api/* rate limits enforce. Lemon Squeezy webhooks write here; everything
-- else only reads.
--
-- Migration is intentionally backwards-compatible — if this table is missing
-- or empty, the app falls back to the Starter plan defaults at runtime, so
-- existing users keep working until they upgrade.

-- Postgres doesn't support `create type if not exists`. Guard with a do-block
-- so the migration is idempotent if re-run on an environment where the types
-- already exist.
do $$ begin
  create type plan_key as enum ('starter', 'growth', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum (
    'active',
    'trialing',
    'past_due',
    'cancelled',
    'expired'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.subscriptions (
  -- one row per user. If we ever support multiple seats per workspace this
  -- becomes (user_id, workspace_id) — not a concern for the beta.
  user_id                  uuid primary key references auth.users(id) on delete cascade,
  plan                     plan_key             not null,
  status                   subscription_status  not null default 'active',
  current_period_end       timestamptz,
  -- Which billing provider issued this subscription. "lemonsqueezy" today;
  -- left as text so we can add Stripe later without a schema migration.
  provider                 text,
  provider_subscription_id text,
  provider_customer_id     text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);
create index if not exists subscriptions_provider_subscription_idx
  on public.subscriptions (provider, provider_subscription_id);

-- updated_at trigger — same pattern as products / scored_posts.
create or replace function public.touch_subscriptions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_subscriptions_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────
alter table public.subscriptions enable row level security;

-- A user can read their own subscription row. Writes go through service-role
-- (webhook handler) only — RLS blocks user-side mutations by omission.
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select using (user_id = auth.uid());
