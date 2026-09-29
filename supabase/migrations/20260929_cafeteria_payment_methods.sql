alter table cafeteria_expenses
  add column if not exists payment_method text not null default 'upi';

alter table cafeteria_expenses
  add column if not exists cash_amount numeric(10, 2);

alter table cafeteria_expenses
  add column if not exists upi_amount numeric(10, 2);

update cafeteria_expenses
set payment_method = 'upi'
where payment_method is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cafeteria_expenses_payment_method_allowed'
  ) then
    alter table cafeteria_expenses
      add constraint cafeteria_expenses_payment_method_allowed
      check (payment_method in ('cash', 'upi', 'cash_upi'));
  end if;
end $$;

alter table cafeteria_sales
  add column if not exists payment_method text not null default 'upi';

alter table cafeteria_sales
  add column if not exists cash_amount numeric(10, 2);

alter table cafeteria_sales
  add column if not exists upi_amount numeric(10, 2);

update cafeteria_sales
set payment_method = 'upi'
where payment_method is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cafeteria_sales_payment_method_allowed'
  ) then
    alter table cafeteria_sales
      add constraint cafeteria_sales_payment_method_allowed
      check (payment_method in ('cash', 'upi', 'cash_upi'));
  end if;
end $$;
