# Remove Plans — Custom Amount + Duration Memberships Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed plans system with a simple custom amount + duration (1/2/3 months) per membership, add a Renew button, and remove PlansEditor from settings.

**Architecture:** Types updated first (foundation), then the data layer, then server actions, then UI components from bottom to top (modals before tables before pages). No test suite — each task ends with a manual verification step.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase, Tailwind CSS v4, Framer Motion, Lucide React.

## Global Constraints

- No new npm packages.
- All Tailwind classes must use existing design tokens: `ink`, `ink-soft`, `ink-line`, `parchment`, `parchment-dim`, `parchment-line`, `brass`, `brass-soft`, `sage`, `terracotta`, `muted`, `muted-light`.
- Server Actions live in `src/app/dashboard/*/actions.ts` with `"use server"` directive.
- Client components need `"use client"` directive.
- `plan_id` insert must be omitted (or `null`) — user must make `memberships.plan_id` nullable in Supabase dashboard before running the app.

---

### Task 1: Update types and data layer

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/data.ts`

**Interfaces:**
- Produces: `MembershipRow` with `duration_months: number` replacing `plan_label: string`. All later tasks depend on this shape.

- [ ] **Step 1: Update `MembershipRow` in `src/lib/types.ts`**

Replace `plan_label: string` with `duration_months: number` and remove the `MembershipPlan` type entirely:

```typescript
export type Zone = "library" | "lounge";
export type OccupancyStatus = "available" | "occupied" | "expired";

export type SeatStatus = {
  seat_id: string;
  seat_code: string;
  zone: Zone;
  pos_x: number;
  pos_y: number;
  is_active: boolean;
  membership_id: string | null;
  start_date: string | null;
  end_date: string | null;
  membership_status: string | null;
  member_id: string | null;
  full_name: string | null;
  phone: string | null;
  photo_url: string | null;
  occupancy_status: OccupancyStatus;
  days_until_expiry: number | null;
};

export type MembershipRow = {
  membership_id: string;
  member_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  seat_code: string;
  zone: Zone;
  duration_months: number;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  days_until_expiry: number;
};

export type LedgerRow = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
};

export type DailyPassRow = {
  id: string;
  full_name: string;
  phone: string;
  date: string;
  amount: number;
};
```

- [ ] **Step 2: Update `getMemberships` in `src/lib/data.ts`**

Remove the `membership_plans` join and `plan_label` mapping. Compute `duration_months` from `start_date` and `end_date` using calendar month difference. Replace lines 223–271 with:

```typescript
type MembershipJoinRow = {
  id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  amount_paid: number;
  members: { id: string; full_name: string; phone: string; email: string | null } | null;
  seats: { seat_code: string; zone: "library" | "lounge" } | null;
};

export async function getMemberships(): Promise<{ data: MembershipRow[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select(
      "id, start_date, end_date, status, amount_paid, members(id, full_name, phone, email), seats(seat_code, zone)"
    )
    .order("created_at", { ascending: false });

  if (error || !data) return { data: [] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: MembershipRow[] = (data as unknown as MembershipJoinRow[])
    .filter((row) => row.members && row.seats)
    .map((row) => {
      const start = new Date(row.start_date);
      const end = new Date(row.end_date);
      const days = Math.round((end.getTime() - today.getTime()) / 86400000);
      const duration_months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return {
        membership_id: row.id,
        member_id: row.members!.id,
        full_name: row.members!.full_name,
        phone: row.members!.phone,
        email: row.members!.email,
        seat_code: row.seats!.seat_code,
        zone: row.seats!.zone,
        duration_months,
        amount_paid: Number(row.amount_paid),
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        days_until_expiry: days,
      };
    });

  return { data: rows };
}
```

- [ ] **Step 3: Remove `getMembershipPlans` from `src/lib/data.ts`**

Delete the entire `getMembershipPlans` function (lines 210–221):

```typescript
// DELETE this entire function:
export async function getMembershipPlans(): Promise<{ data: MembershipPlan[] }> {
  ...
}
```

Also remove `MembershipPlan` from the import of `@/lib/types` at the top of data.ts if it's imported there (check the imports).

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/user/Extras/BOOKVERSE_DASHBOARD && npm run build 2>&1 | head -40
```

Expected: errors only about files that still reference `plan_label`, `planId`, `MembershipPlan`, or `getMembershipPlans` — those will be fixed in later tasks. No errors in `data.ts` or `types.ts` themselves.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/data.ts
git commit -m "refactor: remove MembershipPlan type, replace plan_label with duration_months in MembershipRow"
```

---

### Task 2: Update `assignSeat` server action

**Files:**
- Modify: `src/app/dashboard/seats/actions.ts`

**Interfaces:**
- Consumes: nothing from Task 1 (types.ts not imported in actions.ts)
- Produces: `AssignSeatInput` with `duration: 1 | 2 | 3` replacing `planId: string`. `assignSeat()` takes duration directly.

- [ ] **Step 1: Replace `AssignSeatInput` type and `assignSeat` function**

In `src/app/dashboard/seats/actions.ts`, replace the type and function (lines 7–111) with:

```typescript
export type AssignSeatInput = {
  seatId: string;
  fullName: string;
  phone: string;
  email?: string;
  duration: 1 | 2 | 3;
  startDate: string;
  amountPaid: number;
  paymentMethod: string;
};

export async function assignSeat(input: AssignSeatInput) {
  if (!isSupabaseConfigured()) {
    return {
      error: "Connect Supabase first (see README) — demo data is read-only.",
    };
  }

  const supabase = await createClient();

  // find or create member by phone
  let memberId: string;
  const { data: existingMember } = await supabase
    .from("members")
    .select("id")
    .eq("phone", input.phone)
    .maybeSingle();

  if (existingMember) {
    memberId = existingMember.id;
  } else {
    const { data: newMember, error: memberError } = await supabase
      .from("members")
      .insert({
        full_name: input.fullName,
        phone: input.phone,
        email: input.email || null,
      })
      .select("id")
      .single();

    if (memberError || !newMember) {
      return { error: memberError?.message ?? "Failed to create member" };
    }
    memberId = newMember.id;
  }

  const start = new Date(input.startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + input.duration);
  const endDate = end.toISOString().slice(0, 10);

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      member_id: memberId,
      seat_id: input.seatId,
      start_date: input.startDate,
      end_date: endDate,
      amount_paid: input.amountPaid,
      status: "active",
    })
    .select("id")
    .single();

  if (membershipError || !membership) {
    return {
      error:
        membershipError?.message ??
        "Failed to create membership (the seat may already be occupied)",
    };
  }

  await supabase.from("payments").insert({
    membership_id: membership.id,
    amount: input.amountPaid,
    payment_date: input.startDate,
    method: input.paymentMethod,
  });

  revalidateAll();
  return { success: true };
}
```

- [ ] **Step 2: Add `renewMembership` action to the same file**

Append after `endMembership` (after line 131), before `sendManualReminder`:

```typescript
export type RenewInput = {
  membershipId: string;
  amount: number;
  duration: 1 | 2 | 3;
  startFrom: "today" | "end_date";
  paymentMethod: string;
};

export async function renewMembership(input: RenewInput) {
  if (!isSupabaseConfigured()) {
    return { error: "Connect Supabase first — demo data is read-only." };
  }

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("memberships")
    .select("end_date")
    .eq("id", input.membershipId)
    .single();

  if (fetchError || !current) {
    return { error: "Membership not found" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const newStart = input.startFrom === "today" ? today : current.end_date;
  const startDate = new Date(newStart);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + input.duration);
  const newEnd = endDate.toISOString().slice(0, 10);

  const { error: updateError } = await supabase
    .from("memberships")
    .update({
      end_date: newEnd,
      amount_paid: input.amount,
      status: "active",
    })
    .eq("id", input.membershipId);

  if (updateError) return { error: updateError.message };

  await supabase.from("payments").insert({
    membership_id: input.membershipId,
    amount: input.amount,
    payment_date: today,
    method: input.paymentMethod,
  });

  revalidateAll();
  return { success: true };
}
```

- [ ] **Step 3: Verify no TypeScript errors in actions.ts**

```bash
cd /Users/user/Extras/BOOKVERSE_DASHBOARD && npx tsc --noEmit 2>&1 | grep "actions.ts"
```

Expected: no errors in `seats/actions.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/seats/actions.ts
git commit -m "feat: replace planId with duration in assignSeat, add renewMembership action"
```

---

### Task 3: Update `AssignSeatModal` component

**Files:**
- Modify: `src/components/seats/AssignSeatModal.tsx`

**Interfaces:**
- Consumes: `assignSeat` with `AssignSeatInput` (duration, not planId) from Task 2.
- Produces: `AssignSeatModal` with no `plans` prop — takes only `seat`, `onClose`, `onAssigned`.

- [ ] **Step 1: Rewrite `AssignSeatModal.tsx`**

Replace the entire file content:

```typescript
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import type { SeatStatus } from "@/lib/types";
import { assignSeat } from "@/app/dashboard/seats/actions";

const todayStr = () => new Date().toISOString().slice(0, 10);

const DURATION_OPTIONS = [
  { value: 1, label: "1 Month" },
  { value: 2, label: "2 Months" },
  { value: 3, label: "3 Months" },
] as const;

export function AssignSeatModal({
  seat,
  onClose,
  onAssigned,
}: {
  seat: SeatStatus;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+91");
  const [email, setEmail] = useState("");
  const [duration, setDuration] = useState<1 | 2 | 3>(1);
  const [startDate, setStartDate] = useState(todayStr());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await assignSeat({
      seatId: seat.seat_id,
      fullName,
      phone,
      email: email || undefined,
      duration,
      startDate,
      amountPaid: amount,
      paymentMethod,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    onAssigned();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-parchment p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-text/40">
              {seat.seat_code}
            </span>
            <h2 className="font-display text-2xl text-ink-text mt-1">
              Assign seat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-text/40 transition hover:bg-ink-text/5 hover:text-ink-text"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Member name
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                WhatsApp number
              </label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+9198xxxxxxx"
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                Start date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                Amount paid (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                Payment method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-text px-4 py-3 text-sm font-medium text-parchment transition hover:bg-ink disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Assigning…" : "Confirm assignment"}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/seats/AssignSeatModal.tsx
git commit -m "feat: replace plan selector with duration select in AssignSeatModal"
```

---

### Task 4: Update `FloorPlan` and seats page to remove plans prop

**Files:**
- Modify: `src/components/seats/FloorPlan.tsx`
- Modify: `src/app/dashboard/seats/page.tsx`

**Interfaces:**
- Consumes: `AssignSeatModal` with no `plans` prop (Task 3).
- Produces: `FloorPlan` with no `plans` prop.

- [ ] **Step 1: Remove `plans` prop from `FloorPlan`**

In `src/components/seats/FloorPlan.tsx`:

1. Remove `MembershipPlan` from the import: change line 5 to:
```typescript
import type { SeatStatus } from "@/lib/types";
```

2. Remove `plans` from the component props type and destructuring (around line 109–112). Find the props interface — it will look like:
```typescript
  plans,
}: {
  ...
  plans: MembershipPlan[];
```
Remove those lines.

3. Remove `plans={plans}` from the `<AssignSeatModal>` call (around line 233).

- [ ] **Step 2: Update seats page**

In `src/app/dashboard/seats/page.tsx`:

Replace the data fetching and component render. The page currently does:
```typescript
import { getSeatStatuses, getMembershipPlans } from "@/lib/data";
...
const [{ seats }, { data: plans }] = await Promise.all([
  getSeatStatuses(),
  getMembershipPlans(),
]);
...
<FloorPlan seats={seats} plans={plans} />
```

Change to:
```typescript
import { getSeatStatuses } from "@/lib/data";
...
const { seats } = await getSeatStatuses();
...
<FloorPlan seats={seats} />
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/user/Extras/BOOKVERSE_DASHBOARD && npm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: errors only in `MembersTable` (plan_label) and `settings/page.tsx` (PlansEditor) — both fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add src/components/seats/FloorPlan.tsx src/app/dashboard/seats/page.tsx
git commit -m "refactor: remove plans prop from FloorPlan and seats page"
```

---

### Task 5: Create `RenewMembershipModal` component

**Files:**
- Create: `src/components/members/RenewMembershipModal.tsx`

**Interfaces:**
- Consumes: `renewMembership` and `RenewInput` from `src/app/dashboard/seats/actions.ts` (Task 2).
- Produces: `RenewMembershipModal` component — props: `membership: { membership_id: string; full_name: string; end_date: string }`, `onClose: () => void`, `onRenewed: () => void`.

- [ ] **Step 1: Create `RenewMembershipModal.tsx`**

```typescript
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { renewMembership } from "@/app/dashboard/seats/actions";

const DURATION_OPTIONS = [
  { value: 1, label: "1 Month" },
  { value: 2, label: "2 Months" },
  { value: 3, label: "3 Months" },
] as const;

export function RenewMembershipModal({
  membership,
  onClose,
  onRenewed,
}: {
  membership: { membership_id: string; full_name: string; end_date: string };
  onClose: () => void;
  onRenewed: () => void;
}) {
  const [duration, setDuration] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState(0);
  const [startFrom, setStartFrom] = useState<"today" | "end_date">("today");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endDateFormatted = new Date(membership.end_date).toLocaleDateString(
    "en-IN",
    { day: "2-digit", month: "short", year: "numeric" }
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await renewMembership({
      membershipId: membership.membership_id,
      amount,
      duration,
      startFrom,
      paymentMethod,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    onRenewed();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-parchment p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-text/40">
              Renew membership
            </span>
            <h2 className="font-display text-2xl text-ink-text mt-1">
              {membership.full_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-ink-text/40 transition hover:bg-ink-text/5 hover:text-ink-text"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-2">
              Start from
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="startFrom"
                  value="today"
                  checked={startFrom === "today"}
                  onChange={() => setStartFrom("today")}
                  className="accent-brass"
                />
                <span className="text-sm text-ink-text">Today</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="startFrom"
                  value="end_date"
                  checked={startFrom === "end_date"}
                  onChange={() => setStartFrom("end_date")}
                  className="accent-brass"
                />
                <span className="text-sm text-ink-text">
                  Current end date ({endDateFormatted})
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
                Amount paid (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Payment method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && (
            <p className="rounded-lg border border-terracotta/20 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-text px-4 py-3 text-sm font-medium text-parchment transition hover:bg-ink disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Renewing…" : "Confirm renewal"}
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/members/RenewMembershipModal.tsx
git commit -m "feat: add RenewMembershipModal component"
```

---

### Task 6: Update `MembersTable` — Duration column + Renew button

**Files:**
- Modify: `src/components/members/MembersTable.tsx`

**Interfaces:**
- Consumes: `MembershipRow` with `duration_months` (Task 1), `RenewMembershipModal` (Task 5).
- Produces: Updated table with "Duration" column, Renew button per membership row.

- [ ] **Step 1: Update imports in `MembersTable.tsx`**

Change the import block at the top:

```typescript
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, Phone, Ticket, Trash2, RefreshCw } from "lucide-react";
import type { MembershipRow, DailyPassRow } from "@/lib/types";
import { sendManualReminder } from "@/app/dashboard/seats/actions";
import { deleteDailyPass } from "@/app/dashboard/members/actions";
import { AddDailyPassModal } from "@/components/members/AddDailyPassModal";
import { RenewMembershipModal } from "@/components/members/RenewMembershipModal";
```

- [ ] **Step 2: Add renew state variables**

Inside the `MembersTable` function, add after the existing state declarations (after `const [showModal, setShowModal] = useState(false);`):

```typescript
const [renewTarget, setRenewTarget] = useState<MembershipRow | null>(null);
```

- [ ] **Step 3: Update table header — rename "Plan" to "Duration"**

Find line 135:
```typescript
<th className="py-3 font-mono">Plan</th>
```
Change to:
```typescript
<th className="py-3 font-mono">Duration</th>
```

- [ ] **Step 4: Replace `plan_label` cell with duration display**

Find line 214:
```typescript
<td className="py-3 text-ink-text/70">{row_.plan_label}</td>
```
Replace with:
```typescript
<td className="py-3 text-ink-text/70">
  {row_.duration_months === 1 ? "1 Month" : `${row_.duration_months} Months`}
</td>
```

- [ ] **Step 5: Add Renew button next to Remind button**

Find the action cell for membership rows (around line 226–235). Replace it with:

```typescript
<td className="py-3 text-right">
  <div className="flex items-center justify-end gap-2">
    <button
      onClick={() => setRenewTarget(row_)}
      className="inline-flex items-center gap-1.5 rounded-md border border-brass/30 px-2.5 py-1.5 text-xs font-medium text-brass-soft transition hover:bg-brass/10"
    >
      <RefreshCw size={13} />
      Renew
    </button>
    <button
      onClick={() => handleRemind(row_.membership_id)}
      disabled={sendingId === row_.membership_id}
      className="inline-flex items-center gap-1.5 rounded-md border border-sage/30 px-2.5 py-1.5 text-xs font-medium text-sage transition hover:bg-sage/10 disabled:opacity-50"
    >
      <MessageCircle size={13} />
      {sendingId === row_.membership_id ? "Sending…" : "Remind"}
    </button>
  </div>
</td>
```

- [ ] **Step 6: Add `RenewMembershipModal` to the `AnimatePresence` block**

Find the `AnimatePresence` block at the bottom (around line 247–254). Add the renew modal alongside `AddDailyPassModal`:

```typescript
<AnimatePresence>
  {showModal && (
    <AddDailyPassModal
      onClose={() => setShowModal(false)}
      onAdded={() => setShowModal(false)}
    />
  )}
  {renewTarget && (
    <RenewMembershipModal
      membership={renewTarget}
      onClose={() => setRenewTarget(null)}
      onRenewed={() => setRenewTarget(null)}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 7: Commit**

```bash
git add src/components/members/MembersTable.tsx
git commit -m "feat: replace Plan column with Duration, add Renew button to members table"
```

---

### Task 7: Clean up settings page

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

**Interfaces:**
- Produces: Settings page without PlansEditor or getMembershipPlans.

- [ ] **Step 1: Remove PlansEditor from settings page**

Replace the entire file content of `src/app/dashboard/settings/page.tsx`:

```typescript
import { MessageCircle, Database, ShieldCheck } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { isSupabaseConfigured } from "@/lib/data";

export default async function SettingsPage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <>
      <Topbar title="Settings" subtitle="Integrations and account" />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
          <h3 className="font-display text-lg text-ink-text">Integrations</h3>
          <p className="mb-4 text-sm text-ink-text/50">
            Status of the services this dashboard connects to.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-parchment-line bg-white/70 p-4">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${supabaseReady ? "bg-sage/15 text-sage" : "bg-brass/15 text-brass-soft"}`}>
                <Database size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-text">Supabase</p>
                <p className="text-xs text-ink-text/50">
                  {supabaseReady ? "Connected — live data" : "Not connected"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-parchment-line bg-white/70 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brass/15 text-brass-soft">
                <MessageCircle size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-text">Twilio WhatsApp</p>
                <p className="text-xs text-ink-text/50">
                  Configured via Supabase Edge Function secrets — see setup steps below
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-parchment-line bg-white/70 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-text/10 text-ink-text">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-text">Admin access</p>
                <p className="text-xs text-ink-text/50">
                  Single admin account via Supabase Auth (email + password)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
          <h3 className="font-display text-lg text-ink-text">Automated reminders</h3>
          <p className="mt-2 text-sm text-ink-text/60">
            A scheduled Supabase Edge Function checks daily for memberships
            expiring within 3 days and sends a WhatsApp reminder to the
            member and a summary to your number. Deploy with{" "}
            <code className="font-mono text-xs">supabase functions deploy send-membership-reminders</code>{" "}
            then set your Twilio secrets in the Supabase dashboard.
          </p>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Full build check**

```bash
cd /Users/user/Extras/BOOKVERSE_DASHBOARD && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors. The `PlansEditor` component file can remain on disk — it just won't be used.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat: remove PlansEditor from settings page"
```

---

### Task 8: Manual verification

- [ ] **Step 1: Make `memberships.plan_id` nullable in Supabase**

In the Supabase dashboard → Table Editor → `memberships` table → `plan_id` column → uncheck "Not Null" → Save.

- [ ] **Step 2: Start dev server**

```bash
cd /Users/user/Extras/BOOKVERSE_DASHBOARD && npm run dev
```

- [ ] **Step 3: Verify — Add member**

1. Go to `/dashboard/seats`
2. Click an available seat
3. Modal should show: Name, Phone, Email, Duration (1/2/3 months), Start date, Amount, Payment method — **no plan selector**
4. Fill in, submit
5. Seat should show as occupied

- [ ] **Step 4: Verify — Members table**

1. Go to `/dashboard/members`
2. Table should show "Duration" column (e.g. "1 Month") — **no Plan column**
3. Each row should have "Renew" button (brass) and "Remind" button (sage)

- [ ] **Step 5: Verify — Renew flow**

1. Click "Renew" on any member
2. Modal shows: Start from radio (Today / Current end date with formatted date), Duration, Amount, Payment method
3. Submit — member's end_date updates, stays active

- [ ] **Step 6: Verify — Settings**

1. Go to `/dashboard/settings`
2. PlansEditor section **gone** — only Integrations + Automated reminders sections remain

- [ ] **Step 7: Verify — Finance / Revenue**

1. Go to `/dashboard/finance`
2. Revenue charts should still work (they read `amount_paid` directly, unchanged)
