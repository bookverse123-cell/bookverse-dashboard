# Remove Plans — Custom Amount + Duration Memberships

**Date:** 2026-07-20  
**Status:** Approved

## Problem

Library charges different prices to different members. Fixed plan pricing doesn't work. Need custom amount per membership with a simple duration selection.

## Solution Overview

Remove the plans system from UI entirely. Each membership captures a manually-entered amount and a duration (1/2/3 months). Revenue calculation is unaffected — it already reads `amount_paid` directly.

## DB Change (manual, Supabase dashboard)

Make `memberships.plan_id` nullable. No other schema changes.

## Components Changed

### 1. AssignSeatModal (`src/components/seats/AssignSeatModal.tsx`)

Remove: `planId` select field.  
Add: `duration` select — options: 1 Month, 2 Months, 3 Months.  
Keep: name, phone, email, start date, amount (manual number input), payment method.  
`end_date` computed as `startDate + duration months`.

### 2. `assignSeat` action (`src/app/dashboard/seats/actions.ts`)

Update `AssignSeatInput` type:
- Remove `planId`
- Add `duration: 1 | 2 | 3`

Logic: compute `end_date = startDate + duration months`, insert membership with `plan_id = null`.

### 3. Renew button + modal

New component: `RenewMembershipModal`  
Fields:
- Amount (number input)
- Duration (select: 1 / 2 / 3 months)
- Start from (radio: Today | Current end date)

New action: `renewMembership(input)` in `src/app/dashboard/seats/actions.ts`  
Input: `membershipId`, `amount`, `duration: 1 | 2 | 3`, `startFrom: 'today' | 'end_date'`  
Logic:
- Resolve new start = today OR current `end_date`
- Compute new end = start + duration months
- Update membership row: `end_date`, `amount_paid`, `status = 'active'`
- Insert payment record

### 4. MembersTable (`src/components/members/MembersTable.tsx`)

- Replace "Plan" column with "Duration" (computed: difference in months between start_date and end_date)
- Add "Renew" button to actions column (opens `RenewMembershipModal`)
- Keep "Remind" button

### 5. Settings page (`src/app/dashboard/settings/page.tsx`)

Remove `PlansEditor` component and `getMembershipPlans` call entirely.

### 6. `data.ts` (`src/lib/data.ts`)

`getMemberships()` join with `membership_plans` for `plan_label` — either remove join or handle null gracefully. Display duration instead of plan_label.

## What Does NOT Change

- Revenue / finance queries — read `amount_paid` directly, unaffected
- Payment method options
- WhatsApp reminder logic
- Auth / middleware
- Seat floor plan UI
