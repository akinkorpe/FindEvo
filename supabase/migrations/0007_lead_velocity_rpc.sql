-- Aggregate lead counts by day in the database to avoid fetching all rows
create or replace function lead_velocity_by_day(
  p_product_id uuid,
  p_since timestamptz
)
returns table(date text, count bigint)
language sql
stable
as $$
  select
    to_char(created_at at time zone 'utc', 'YYYY-MM-DD') as date,
    count(*) as count
  from leads
  where product_id = p_product_id
    and created_at >= p_since
  group by 1
  order by 1;
$$;
