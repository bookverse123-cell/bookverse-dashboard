# Member Detail Page Design

**Date:** 2026-07-21  
**Status:** Approved

## Goal

Add `/dashboard/members/[id]` — a full-page member journey view showing all membership periods as a vertical timeline, so staff can see a member's complete subscription history at a glance.

## Navigation Entry Point

In `MembersTable`, wrap the `full_name` cell in a `<Link href={/dashboard/members/${row.member_id}}>` with hover underline styling. `member_id` is already available on `MembershipRow`.

## Route

`src/app/dashboard/members/[id]/page.tsx` — Server Component. `id` param = `member_id` from `members` table.

If no member found, call `notFound()`.

## Data Layer

New function `getMemberDetail(memberId: string)` in `src/lib/data.ts`.

Returns:
```typescript
type MemberDetail = {
  member_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  memberships: MemberHistoryEntry[];
};

type MemberHistoryEntry = {
  membership_id: string;
  start_date: string;
  end_date: string;
  duration_months: number;       // computed: Math.round(months between start and end)
  amount_paid: number;
  status: "active" | "expired" | "cancelled";
  remarks: string | null;
  payments: PaymentEntry[];
};

type PaymentEntry = {
  amount: number;
  payment_date: string;
  method: string;
};
```

Supabase query:
```
.from("memberships")
.select("id, start_date, end_date, amount_paid, status, remarks, members!inner(id, full_name, phone, email), payments(amount, payment_date, method)")
.eq("member_id", memberId)
.order("start_date", { ascending: true })
```

`duration_months` computed from `start_date`/`end_date` same way as existing `getMemberships()`.

Demo mode: return hardcoded `MemberDetail` with 3 sample `MemberHistoryEntry` rows.

## Page Layout

### Header
- Back link: `← Members` → `/dashboard/members`
- Member name (large, display font)
- Phone + email (muted, small)
- "Member since [first membership start_date formatted as 'Jun 2026']"

### KPI Strip (3 tiles)
- **Total periods** — count of membership rows
- **Total paid** — sum of `amount_paid` across all memberships (₹ formatted)
- **Current status** — status pill from the latest membership (Active / Expired / Cancelled)

### Timeline

Vertical list of cards, one per `MemberHistoryEntry`, ordered oldest → newest (chronological).

Each card:
- **Period header:** "15 Jun 2026 → 15 Jul 2026" + duration badge "1 Month"
- **Amount row:** ₹2,300 · Cash (payment method from first payment entry)
- **Remarks:** shown only if non-null, italicised, muted color
- **Status pill:** Active (sage) / Expired (muted) / Cancelled (terracotta)

Connector: vertical line between cards to show the chain visually. Last card has no line below.

## Files

| Action | Path |
|--------|------|
| Modify | `src/lib/data.ts` — add `getMemberDetail` |
| Modify | `src/components/members/MembersTable.tsx` — wrap name in Link |
| Create | `src/app/dashboard/members/[id]/page.tsx` |
| Create | `src/components/members/MemberTimeline.tsx` — timeline UI component |

## Out of Scope

- Editing member details from this page
- Renewing from this page (renew stays on the list)
- Photo display
