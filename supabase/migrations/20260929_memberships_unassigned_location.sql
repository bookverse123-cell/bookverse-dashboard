alter table memberships
  add column if not exists unassigned_location text not null default 'reading_commons';

update memberships
set unassigned_location = 'reading_commons'
where seat_id is null and (unassigned_location is null or unassigned_location not in ('reading_commons', 'nook'));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'memberships_unassigned_location_allowed'
  ) then
    alter table memberships
      add constraint memberships_unassigned_location_allowed
      check (unassigned_location in ('reading_commons', 'nook'));
  end if;
end $$;
