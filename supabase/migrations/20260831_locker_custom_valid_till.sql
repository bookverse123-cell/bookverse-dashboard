begin;

alter table public.locker_allocations
  alter column duration_months drop not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'locker_allocations_duration_allowed'
  ) then
    alter table public.locker_allocations
      drop constraint locker_allocations_duration_allowed;
  end if;

  alter table public.locker_allocations
    add constraint locker_allocations_duration_allowed
    check (duration_months in (1, 3) or duration_months is null);

  if not exists (
    select 1
    from pg_constraint
    where conname = 'locker_allocations_valid_till_after_assigned_at'
  ) then
    alter table public.locker_allocations
      add constraint locker_allocations_valid_till_after_assigned_at
      check (valid_till >= assigned_at);
  end if;
end $$;

commit;
