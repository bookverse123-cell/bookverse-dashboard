alter table daily_passes
  add column if not exists payment_method text not null default 'upi';

alter table daily_passes
  add column if not exists cash_amount numeric(10, 2);

alter table daily_passes
  add column if not exists upi_amount numeric(10, 2);

update daily_passes
set payment_method = 'upi'
where payment_method is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'daily_passes_payment_method_allowed'
  ) then
    alter table daily_passes
      add constraint daily_passes_payment_method_allowed
      check (payment_method in ('cash', 'upi', 'cash_upi'));
  end if;
end $$;
