-- scored_posts TTL + cleanup
-- Keeps lead-converted scored posts forever (expires_at = null).

alter table public.scored_posts
  add column if not exists expires_at timestamptz
  default (now() + interval '24 hours');

create index if not exists scored_posts_expires_at_idx
  on public.scored_posts (expires_at)
  where expires_at is not null;

-- Backfill existing rows:
-- - keep rows linked to leads forever
-- - expire all other rows in 24h
update public.scored_posts sp
set expires_at = null
where exists (
  select 1
  from public.leads l
  where l.scored_post_id = sp.id
);

update public.scored_posts
set expires_at = now() + interval '24 hours'
where expires_at is null
  and id not in (
    select l.scored_post_id
    from public.leads l
    where l.scored_post_id is not null
  );

create or replace function public.cleanup_expired_scored_posts()
returns void
language plpgsql
as $$
begin
  delete from public.scored_posts
  where expires_at < now();

  delete from public.reddit_posts rp
  where not exists (
    select 1
    from public.scored_posts sp
    where sp.post_id = rp.id
  );
end;
$$;

-- Daily cleanup at 03:00 UTC via pg_cron (when available on the project)
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    if not exists (
      select 1 from cron.job where jobname = 'cleanup-expired-scored-posts'
    ) then
      perform cron.schedule(
        'cleanup-expired-scored-posts',
        '0 3 * * *',
        $$select public.cleanup_expired_scored_posts();$$
      );
    end if;
  end if;
exception
  when insufficient_privilege then
    raise notice 'Skipping cron schedule due to insufficient privileges.';
end $$;
