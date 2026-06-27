-- ============================================================================
-- BOOKVERSE — Library + Coworking Management Dashboard
-- Core database schema for Supabase (Postgres)
-- ============================================================================
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- SEATS
-- One row per physical seat, in either the library or the premium lounge.
-- pos_x / pos_y are percentages (0-100) used to place the seat on the SVG
-- floor plan in the dashboard.
-- ----------------------------------------------------------------------------
create table if not exists seats (
  id uuid primary key default uuid_generate_v4(),
  seat_code text not null unique,         -- e.g. "L-001", "P-04"
  zone text not null check (zone in ('library', 'lounge')),
  pos_x numeric not null,                 -- 0-100, % from left of floor plan
  pos_y numeric not null,                 -- 0-100, % from top of floor plan
  is_active boolean not null default true, -- false = seat removed/under repair
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- MEMBERS
-- ----------------------------------------------------------------------------
create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,                    -- include country code, e.g. +9198xxxxxxx
  email text,
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- MEMBERSHIP PLANS
-- Pricing per zone and duration. Seed with your real prices after setup.
-- ----------------------------------------------------------------------------
create table if not exists membership_plans (
  id uuid primary key default uuid_generate_v4(),
  zone text not null check (zone in ('library', 'lounge')),
  duration_months integer not null check (duration_months in (1, 3, 6)),
  price numeric(10, 2) not null,
  label text not null,                    -- e.g. "Library — 1 Month"
  is_active boolean not null default true,
  unique (zone, duration_months)
);

-- ----------------------------------------------------------------------------
-- MEMBERSHIPS
-- A membership ties a member to a seat for a plan period.
-- A member can have multiple memberships over time (history), but only one
-- active membership per seat at a time (enforced in app logic + partial index).
-- ----------------------------------------------------------------------------
create table if not exists memberships (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete cascade,
  seat_id uuid not null references seats(id) on delete restrict,
  plan_id uuid not null references membership_plans(id),
  start_date date not null,
  end_date date not null,
  amount_paid numeric(10, 2) not null default 0,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  reminder_sent_at timestamptz,           -- last time an expiry reminder was sent
  created_at timestamptz not null default now()
);

create index if not exists idx_memberships_seat on memberships(seat_id);
create index if not exists idx_memberships_member on memberships(member_id);
create index if not exists idx_memberships_status_end on memberships(status, end_date);

-- Only one ACTIVE membership per seat at a time
create unique index if not exists uniq_active_seat
  on memberships(seat_id)
  where (status = 'active');

-- ----------------------------------------------------------------------------
-- PAYMENTS
-- Individual payment records (a membership may be paid in installments).
-- ----------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  membership_id uuid not null references memberships(id) on delete cascade,
  amount numeric(10, 2) not null,
  payment_date date not null default current_date,
  method text not null default 'cash' check (method in ('cash', 'upi', 'card', 'bank_transfer', 'other')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_date on payments(payment_date);

-- ----------------------------------------------------------------------------
-- CAFETERIA EXPENSES
-- ----------------------------------------------------------------------------
create table if not exists cafeteria_expenses (
  id uuid primary key default uuid_generate_v4(),
  category text not null,                 -- e.g. "Groceries", "Snacks", "Utilities"
  description text,
  amount numeric(10, 2) not null,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_cafeteria_expenses_date on cafeteria_expenses(expense_date);

-- ----------------------------------------------------------------------------
-- CAFETERIA REVENUE (optional — track café sales separately from memberships)
-- ----------------------------------------------------------------------------
create table if not exists cafeteria_sales (
  id uuid primary key default uuid_generate_v4(),
  description text,
  amount numeric(10, 2) not null,
  sale_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_cafeteria_sales_date on cafeteria_sales(sale_date);

-- ----------------------------------------------------------------------------
-- INVESTMENTS / CAPITAL EXPENDITURE
-- One-off or recurring investments into the business (furniture, equipment, etc.)
-- ----------------------------------------------------------------------------
create table if not exists investments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null default 'general',
  amount numeric(10, 2) not null,
  investment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_investments_date on investments(investment_date);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS LOG
-- Records every WhatsApp/email reminder sent (to members or to the admin).
-- ----------------------------------------------------------------------------
create table if not exists notifications_log (
  id uuid primary key default uuid_generate_v4(),
  membership_id uuid references memberships(id) on delete set null,
  member_id uuid references members(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'email', 'admin_whatsapp')),
  message text not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error text,
  sent_at timestamptz not null default now()
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Current status of every seat: available / occupied, with member + membership info
create or replace view seat_status as
select
  s.id as seat_id,
  s.seat_code,
  s.zone,
  s.pos_x,
  s.pos_y,
  s.is_active,
  m.id as membership_id,
  m.start_date,
  m.end_date,
  m.status as membership_status,
  mem.id as member_id,
  mem.full_name,
  mem.phone,
  mem.photo_url,
  case
    when m.id is not null and m.status = 'active' and m.end_date >= current_date then 'occupied'
    when m.id is not null and m.status = 'active' and m.end_date < current_date then 'expired'
    else 'available'
  end as occupancy_status,
  (m.end_date - current_date) as days_until_expiry
from seats s
left join memberships m on m.seat_id = s.id and m.status = 'active'
left join members mem on mem.id = m.member_id;

-- Monthly revenue (from membership payments + cafeteria sales)
create or replace view monthly_revenue as
select
  date_trunc('month', payment_date)::date as month,
  'membership' as source,
  sum(amount) as total
from payments
group by 1
union all
select
  date_trunc('month', sale_date)::date as month,
  'cafeteria' as source,
  sum(amount) as total
from cafeteria_sales
group by 1;

-- Monthly expenses (cafeteria expenses + investments)
create or replace view monthly_expenses as
select
  date_trunc('month', expense_date)::date as month,
  'cafeteria' as source,
  sum(amount) as total
from cafeteria_expenses
group by 1
union all
select
  date_trunc('month', investment_date)::date as month,
  'investment' as source,
  sum(amount) as total
from investments
group by 1;

-- Memberships expiring within the next N days (used by the reminder function)
create or replace view expiring_memberships as
select
  m.id as membership_id,
  m.end_date,
  m.reminder_sent_at,
  mem.id as member_id,
  mem.full_name,
  mem.phone,
  s.seat_code,
  s.zone,
  (m.end_date - current_date) as days_left
from memberships m
join members mem on mem.id = m.member_id
join seats s on s.id = m.seat_id
where m.status = 'active'
  and m.end_date >= current_date
  and m.end_date <= current_date + interval '3 days';

-- ============================================================================
-- FUNCTION + TRIGGER: auto-expire memberships whose end_date has passed
-- ============================================================================
create or replace function expire_old_memberships()
returns void as $$
begin
  update memberships
  set status = 'expired'
  where status = 'active'
    and end_date < current_date;
end;
$$ language plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- This is a single-admin dashboard: any authenticated user (the admin) has
-- full access. Anonymous access is blocked entirely.
-- ============================================================================
alter table seats enable row level security;
alter table members enable row level security;
alter table membership_plans enable row level security;
alter table memberships enable row level security;
alter table payments enable row level security;
alter table cafeteria_expenses enable row level security;
alter table cafeteria_sales enable row level security;
alter table investments enable row level security;
alter table notifications_log enable row level security;

create policy "authenticated full access" on seats for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on members for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on membership_plans for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on memberships for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on payments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on cafeteria_expenses for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on cafeteria_sales for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on investments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on notifications_log for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
