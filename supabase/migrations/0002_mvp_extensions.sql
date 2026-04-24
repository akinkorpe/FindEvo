-- RedditLeads MVP extensions
-- Adds: onboarding survey answers, subreddit rule cache/badge, sent posts tracking,
-- user notification/account settings.

-- ─── products: onboarding survey answers ────────────────────────────────
alter table public.products
  add column if not exists survey_answers jsonb not null default '{}'::jsonb;

-- ─── subreddits: rule cache + badge ─────────────────────────────────────
do $$ begin
  create type subreddit_rule_badge as enum ('green', 'yellow', 'red');
exception when duplicate_object then null; end $$;

alter table public.subreddits
  add column if not exists rule_badge subreddit_rule_badge,
  add column if not exists rules_cache text,
  add column if not exists rules_summary text,
  add column if not exists rules_updated_at timestamptz;

-- ─── sent_posts: track posts the user has acted on ─────────────────────
create table if not exists public.sent_posts (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  post_id         text not null references public.reddit_posts(id) on delete cascade,
  scored_post_id  uuid references public.scored_posts(id) on delete set null,
  kind            text not null default 'sent', -- 'sent' | 'lead'
  created_at      timestamptz not null default now(),
  unique (product_id, post_id)
);

create index if not exists sent_posts_product_idx
  on public.sent_posts (product_id, created_at desc);

-- ─── user_settings: notifications + account prefs (global, not per-product) ─
create table if not exists public.user_settings (
  id                     uuid primary key default gen_random_uuid(),
  product_id             uuid references public.products(id) on delete cascade,
  notify_new_posts       boolean not null default true,
  notify_lead_reminders  boolean not null default true,
  updated_at             timestamptz not null default now(),
  unique (product_id)
);

drop trigger if exists user_settings_touch on public.user_settings;
create trigger user_settings_touch before update on public.user_settings
  for each row execute function public.touch_updated_at();
