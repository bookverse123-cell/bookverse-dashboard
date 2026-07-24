-- Normalize existing membership periods to fixed 30-day month blocks.
--
-- Rule applied:
--   inferred_month_blocks = max(1, round((end_date - start_date) / 30.0))
--   new_end_date = start_date + (inferred_month_blocks * 30 days)
--
-- Notes:
-- - This updates ALL rows in `memberships` where computed `new_end_date` differs.
-- - Backup rows are stored in `public.membership_duration_migration_backup` for rollback.

begin;

create table if not exists public.membership_duration_migration_backup (
  membership_id uuid primary key,
  old_start_date date not null,
  old_end_date date not null,
  new_end_date date not null,
  old_duration_days integer not null,
  inferred_month_blocks integer not null,
  migrated_at timestamptz not null default now()
);

with recalculated as (
  select
    m.id,
    m.start_date,
    m.end_date,
    greatest(1, round(((m.end_date - m.start_date)::numeric / 30.0)))::int as month_blocks,
    (m.start_date + ((greatest(1, round(((m.end_date - m.start_date)::numeric / 30.0)))::int * 30) * interval '1 day'))::date as computed_end_date,
    (m.end_date - m.start_date)::int as old_duration_days
  from public.memberships m
), candidates as (
  select *
  from recalculated
  where computed_end_date <> end_date
)
insert into public.membership_duration_migration_backup (
  membership_id,
  old_start_date,
  old_end_date,
  new_end_date,
  old_duration_days,
  inferred_month_blocks
)
select
  c.id,
  c.start_date,
  c.end_date,
  c.computed_end_date,
  c.old_duration_days,
  c.month_blocks
from candidates c
on conflict (membership_id) do update
set
  old_start_date = excluded.old_start_date,
  old_end_date = excluded.old_end_date,
  new_end_date = excluded.new_end_date,
  old_duration_days = excluded.old_duration_days,
  inferred_month_blocks = excluded.inferred_month_blocks,
  migrated_at = now();

update public.memberships m
set end_date = b.new_end_date
from public.membership_duration_migration_backup b
where b.membership_id = m.id
  and m.end_date <> b.new_end_date;

commit;

-- Optional verification query:
-- select
--   count(*) as updated_rows,
--   min(old_duration_days) as min_old_days,
--   max(old_duration_days) as max_old_days
-- from public.membership_duration_migration_backup;

-- Rollback query (manual):
-- update public.memberships m
-- set end_date = b.old_end_date
-- from public.membership_duration_migration_backup b
-- where b.membership_id = m.id;
