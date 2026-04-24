-- RedditLeads initial schema
-- Run in Supabase SQL Editor (or psql via DATABASE_URL).

create extension if not exists "pgcrypto";

-- ─── products ────────────────────────────────────────────────────────────
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  website_url   text not null,
  name          text,
  niche         text,
  summary       text,
  keywords      text[] not null default '{}',
  subreddits    text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── campaigns ───────────────────────────────────────────────────────────
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ─── subreddits (per-product watchlist) ──────────────────────────────────
create type subreddit_priority as enum ('high', 'standard');

create table if not exists public.subreddits (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  name        text not null,
  priority    subreddit_priority not null default 'standard',
  created_at  timestamptz not null default now(),
  unique (product_id, name)
);

-- ─── subreddit_rules ─────────────────────────────────────────────────────
create table if not exists public.subreddit_rules (
  id          uuid primary key default gen_random_uuid(),
  subreddit   text not null,
  title       text not null,
  description text not null default '',
  fetched_at  timestamptz not null default now()
);

create index if not exists subreddit_rules_subreddit_idx
  on public.subreddit_rules (subreddit);

-- ─── reddit_posts (raw ingestion) ────────────────────────────────────────
create table if not exists public.reddit_posts (
  id            text primary key, -- reddit "t3_xxx"
  subreddit     text not null,
  title         text not null,
  body          text not null default '',
  author        text,
  url           text,
  score         integer not null default 0,
  author_karma  integer,
  created_utc   timestamptz,
  fetched_at    timestamptz not null default now()
);

create index if not exists reddit_posts_subreddit_idx
  on public.reddit_posts (subreddit);

-- ─── scored_posts (per product) ──────────────────────────────────────────
create table if not exists public.scored_posts (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  post_id         text not null references public.reddit_posts(id) on delete cascade,
  intent_score    integer not null check (intent_score between 0 and 100),
  reason          text not null default '',
  risk_level      text not null default 'safe', -- safe | review | high_risk
  dismissed       boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (product_id, post_id)
);

create index if not exists scored_posts_product_idx
  on public.scored_posts (product_id);
create index if not exists scored_posts_score_idx
  on public.scored_posts (intent_score desc);

-- ─── approach_guides ─────────────────────────────────────────────────────
create table if not exists public.approach_guides (
  id              uuid primary key default gen_random_uuid(),
  scored_post_id  uuid not null references public.scored_posts(id) on delete cascade,
  why_lead        text not null default '',
  author_context  text not null default '',
  suggested_steps text[] not null default '{}',
  created_at      timestamptz not null default now(),
  unique (scored_post_id)
);

-- ─── leads (CRM) ─────────────────────────────────────────────────────────
create type lead_status as enum (
  'new',
  'engaged',
  'active_pipeline',
  'converted',
  'dismissed'
);

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  scored_post_id  uuid references public.scored_posts(id) on delete set null,
  reddit_username text not null,
  source          text not null,          -- e.g. r/SaaS
  intent_label    text not null default 'exploring',
  status          lead_status not null default 'new',
  last_seen_at    timestamptz,
  notes           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_product_idx on public.leads (product_id);

-- ─── lead_interactions ───────────────────────────────────────────────────
create type interaction_kind as enum ('ai_suggestion', 'comment', 'note', 'status_change');

create table if not exists public.lead_interactions (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  kind        interaction_kind not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists lead_interactions_lead_idx
  on public.lead_interactions (lead_id, created_at desc);

-- ─── ai_credits (usage ledger) ───────────────────────────────────────────
create table if not exists public.ai_credits (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products(id) on delete cascade,
  kind        text not null,  -- analyze_site | score_post | approach_guide
  amount      integer not null, -- negative = spend, positive = grant
  created_at  timestamptz not null default now()
);

create index if not exists ai_credits_product_idx
  on public.ai_credits (product_id, created_at desc);

-- ─── workspace_settings (singleton, keyed by product) ────────────────────
create table if not exists public.workspace_settings (
  product_id                uuid primary key references public.products(id) on delete cascade,
  strict_profanity_filter   boolean not null default true,
  require_competitor_mention boolean not null default false,
  min_author_karma          integer not null default 150,
  max_post_age_hours        integer not null default 24,
  updated_at                timestamptz not null default now()
);

-- ─── updated_at trigger helper ───────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

drop trigger if exists workspace_touch on public.workspace_settings;
create trigger workspace_touch before update on public.workspace_settings
  for each row execute function public.touch_updated_at();
