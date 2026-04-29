-- Auth: link products to auth.users (nullable for backwards compatibility).
-- RLS is intentionally NOT enabled yet — onboarding still allows anonymous access.
-- A follow-up migration will enable RLS once auth is enforced end-to-end.

alter table public.products
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

create index if not exists products_owner_idx
  on public.products (owner_id);
