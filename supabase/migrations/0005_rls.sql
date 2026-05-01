-- RLS: scope every workspace table to the product owner (auth.uid()).
--
-- Strategy:
--   • products.owner_id is the source of truth (set by the API on insert).
--   • All product-scoped tables (campaigns, subreddits, scored_posts, leads,
--     ai_credits, sent_posts, workspace_settings) inherit access via a
--     product_id → products.owner_id lookup.
--   • Service-role calls bypass RLS automatically; admin server jobs keep
--     working without changes.
--
-- Helper that returns true when a product is owned by the current user.
create or replace function public.user_owns_product(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.products
     where id = p_id and owner_id = auth.uid()
  );
$$;

-- ─── products ──────────────────────────────────────────────────────────────
alter table public.products enable row level security;

drop policy if exists products_select on public.products;
create policy products_select on public.products
  for select using (owner_id = auth.uid());

drop policy if exists products_insert on public.products;
create policy products_insert on public.products
  for insert with check (owner_id = auth.uid());

drop policy if exists products_update on public.products;
create policy products_update on public.products
  for update using (owner_id = auth.uid())
            with check (owner_id = auth.uid());

drop policy if exists products_delete on public.products;
create policy products_delete on public.products
  for delete using (owner_id = auth.uid());

-- ─── campaigns ─────────────────────────────────────────────────────────────
alter table public.campaigns enable row level security;

drop policy if exists campaigns_all on public.campaigns;
create policy campaigns_all on public.campaigns
  for all using (public.user_owns_product(product_id))
          with check (public.user_owns_product(product_id));

-- ─── subreddits ────────────────────────────────────────────────────────────
alter table public.subreddits enable row level security;

drop policy if exists subreddits_all on public.subreddits;
create policy subreddits_all on public.subreddits
  for all using (public.user_owns_product(product_id))
          with check (public.user_owns_product(product_id));

-- ─── scored_posts ──────────────────────────────────────────────────────────
alter table public.scored_posts enable row level security;

drop policy if exists scored_posts_all on public.scored_posts;
create policy scored_posts_all on public.scored_posts
  for all using (public.user_owns_product(product_id))
          with check (public.user_owns_product(product_id));

-- ─── approach_guides ───────────────────────────────────────────────────────
alter table public.approach_guides enable row level security;

drop policy if exists approach_guides_all on public.approach_guides;
create policy approach_guides_all on public.approach_guides
  for all using (
    exists (
      select 1 from public.scored_posts sp
       where sp.id = approach_guides.scored_post_id
         and public.user_owns_product(sp.product_id)
    )
  )
  with check (
    exists (
      select 1 from public.scored_posts sp
       where sp.id = approach_guides.scored_post_id
         and public.user_owns_product(sp.product_id)
    )
  );

-- ─── leads ─────────────────────────────────────────────────────────────────
alter table public.leads enable row level security;

drop policy if exists leads_all on public.leads;
create policy leads_all on public.leads
  for all using (public.user_owns_product(product_id))
          with check (public.user_owns_product(product_id));

-- ─── lead_interactions ─────────────────────────────────────────────────────
alter table public.lead_interactions enable row level security;

drop policy if exists lead_interactions_all on public.lead_interactions;
create policy lead_interactions_all on public.lead_interactions
  for all using (
    exists (
      select 1 from public.leads l
       where l.id = lead_interactions.lead_id
         and public.user_owns_product(l.product_id)
    )
  )
  with check (
    exists (
      select 1 from public.leads l
       where l.id = lead_interactions.lead_id
         and public.user_owns_product(l.product_id)
    )
  );

-- ─── ai_credits ────────────────────────────────────────────────────────────
alter table public.ai_credits enable row level security;

drop policy if exists ai_credits_all on public.ai_credits;
create policy ai_credits_all on public.ai_credits
  for all using (
    product_id is null  -- system grants without a product (rare) — read-only via service role
    or public.user_owns_product(product_id)
  )
  with check (public.user_owns_product(product_id));

-- ─── workspace_settings ────────────────────────────────────────────────────
alter table public.workspace_settings enable row level security;

drop policy if exists workspace_settings_all on public.workspace_settings;
create policy workspace_settings_all on public.workspace_settings
  for all using (public.user_owns_product(product_id))
          with check (public.user_owns_product(product_id));

-- ─── sent_posts (added in 0002) ────────────────────────────────────────────
alter table public.sent_posts enable row level security;

drop policy if exists sent_posts_all on public.sent_posts;
create policy sent_posts_all on public.sent_posts
  for all using (public.user_owns_product(product_id))
          with check (public.user_owns_product(product_id));

-- ─── user_settings (added in 0002, keyed by product_id) ───────────────────
alter table public.user_settings enable row level security;

drop policy if exists user_settings_all on public.user_settings;
create policy user_settings_all on public.user_settings
  for all using (
    product_id is null or public.user_owns_product(product_id)
  )
  with check (
    product_id is null or public.user_owns_product(product_id)
  );

-- ─── shared / read-only tables ─────────────────────────────────────────────
-- reddit_posts and subreddit_rules are global caches (not user-scoped).
-- Keep RLS off so service-role ingestion writes freely; reads still happen
-- only through scored_posts/leads joins which ARE scoped.
-- (Intentionally NOT enabling RLS on reddit_posts, subreddit_rules.)
