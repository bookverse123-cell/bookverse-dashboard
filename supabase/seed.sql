-- ============================================================================
-- Seed data — run AFTER schema.sql
-- Creates 100 library seats + 20 premium lounge seats with floor-plan
-- coordinates (0-100 scale, used by the SVG floor plan in the dashboard),
-- plus starter membership plans. Edit prices to match your real pricing —
-- you can also edit these later from Settings in the dashboard.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- LIBRARY SEATS — 25 reading tables x 4 seats (2x2) = 100 seats, codes L-001..L-100
-- ----------------------------------------------------------------------------
with grid as (
  select tx, ty, sx, sy,
    row_number() over (order by ty, tx, sy, sx) as seat_num
  from generate_series(1, 5) tx,
       generate_series(1, 5) ty,
       generate_series(1, 2) sx,
       generate_series(1, 2) sy
)
insert into seats (seat_code, zone, pos_x, pos_y)
select
  'L-' || lpad(seat_num::text, 3, '0'),
  'library',
  8 + (tx - 1) * 12 + (sx - 1) * 4,
  14 + (ty - 1) * 14 + (sy - 1) * 5
from grid
on conflict (seat_code) do nothing;

-- ----------------------------------------------------------------------------
-- PREMIUM LOUNGE SEATS — 10 pods x 2 seats = 20 seats, codes P-01..P-20
-- ----------------------------------------------------------------------------
with grid as (
  select tx, ty, sx,
    row_number() over (order by ty, tx, sx) as seat_num
  from generate_series(1, 2) tx,
       generate_series(1, 5) ty,
       generate_series(1, 2) sx
)
insert into seats (seat_code, zone, pos_x, pos_y)
select
  'P-' || lpad(seat_num::text, 2, '0'),
  'lounge',
  78 + (tx - 1) * 12 + (sx - 1) * 5,
  14 + (ty - 1) * 14
from grid
on conflict (seat_code) do nothing;

-- ----------------------------------------------------------------------------
-- MEMBERSHIP PLANS — placeholder pricing, edit in dashboard > Settings
-- ----------------------------------------------------------------------------
insert into membership_plans (zone, duration_months, price, label) values
  ('library', 1, 1500, 'Library — 1 Month'),
  ('library', 3, 4000, 'Library — 3 Months'),
  ('library', 6, 7500, 'Library — 6 Months'),
  ('lounge',  1, 3000, 'Premium Lounge — 1 Month'),
  ('lounge',  3, 8000, 'Premium Lounge — 3 Months'),
  ('lounge',  6, 15000, 'Premium Lounge — 6 Months')
on conflict (zone, duration_months) do nothing;
