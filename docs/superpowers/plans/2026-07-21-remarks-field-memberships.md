# Remarks Field — Memberships Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional free-text `remarks` field to the assign seat and renew membership flows, persisted to `memberships.remarks` in Supabase.

**Architecture:** Three tasks bottom-up — DB migration first, then types + server actions, then UI. No test suite; each task ends with a manual verification step.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase, Tailwind CSS v4.

## Global Constraints

- No new npm packages.
- Tailwind classes must use existing design tokens: `ink`, `ink-soft`, `ink-line`, `parchment`, `parchment-dim`, `parchment-line`, `brass`, `brass-soft`, `sage`, `terracotta`, `muted`, `muted-light`.
- Server Actions live in `src/app/dashboard/seats/actions.ts` with `"use server"` directive.
- Client components need `"use client"` directive.

---

### Task 1: Add `remarks` column to Supabase

**Files:**
- No code files — Supabase schema change only.

**Interfaces:**
- Produces: `memberships.remarks` column (text, nullable) available for insert/update.

- [ ] **Step 1: Run migration SQL in Supabase**

Go to Supabase Dashboard → SQL Editor and run:

```sql
ALTER TABLE memberships ADD COLUMN remarks text;
```

- [ ] **Step 2: Verify column exists**

In Supabase Dashboard → Table Editor → `memberships` table, confirm `remarks` column appears with type `text` and nullable.

---

### Task 2: Update types and server actions

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/app/dashboard/seats/actions.ts`

**Interfaces:**
- Consumes: `memberships.remarks` column from Task 1.
- Produces:
  - `MembershipRow` with `remarks: string | null`
  - `AssignSeatInput` with `remarks?: string`
  - `RenewInput` with `remarks?: string`
  - `assignSeat` passes `remarks: input.remarks ?? null` to memberships insert
  - `renewMembership` passes `remarks: input.remarks ?? null` to memberships update

- [ ] **Step 1: Add `remarks` to `MembershipRow` in `src/lib/types.ts`**

Current `MembershipRow` ends at line 37. Add `remarks` field:

```typescript
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
  remarks: string | null;
};
```

- [ ] **Step 2: Add `remarks` to `AssignSeatInput` in `src/app/dashboard/seats/actions.ts`**

Current `AssignSeatInput` (lines 7–16). Add `remarks?: string`:

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
  remarks?: string;
};
```

- [ ] **Step 3: Pass `remarks` in `assignSeat` memberships insert**

In `assignSeat`, the memberships insert is at lines 69–76. Add `remarks`:

```typescript
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      member_id: memberId,
      seat_id: input.seatId,
      start_date: input.startDate,
      end_date: endDate,
      amount_paid: input.amountPaid,
      status: "active",
      remarks: input.remarks ?? null,
    })
    .select("id")
    .single();
```

- [ ] **Step 4: Add `remarks` to `RenewInput` in `src/app/dashboard/seats/actions.ts`**

Current `RenewInput` (lines 120–126). Add `remarks?: string`:

```typescript
export type RenewInput = {
  membershipId: string;
  amount: number;
  duration: 1 | 2 | 3;
  startFrom: "today" | "end_date";
  paymentMethod: string;
  remarks?: string;
};
```

- [ ] **Step 5: Pass `remarks` in `renewMembership` memberships update**

In `renewMembership`, the memberships update is at lines 153–161. Add `remarks`:

```typescript
  const { error: updateError } = await supabase
    .from("memberships")
    .update({
      start_date: newStart,
      end_date: newEnd,
      amount_paid: input.amount,
      status: "active",
      remarks: input.remarks ?? null,
    })
    .eq("id", input.membershipId);
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no TypeScript errors. (Lint warnings about unused vars are fine if any.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/app/dashboard/seats/actions.ts
git commit -m "feat: add remarks field to AssignSeatInput, RenewInput, and memberships insert/update"
```

---

### Task 3: Add remarks textarea to both modals

**Files:**
- Modify: `src/components/seats/AssignSeatModal.tsx`
- Modify: `src/components/members/RenewMembershipModal.tsx`

**Interfaces:**
- Consumes: `AssignSeatInput.remarks?: string` and `RenewInput.remarks?: string` from Task 2.

- [ ] **Step 1: Add `remarks` state to `AssignSeatModal`**

In `src/components/seats/AssignSeatModal.tsx`, after the existing state declarations (line 34), add:

```typescript
  const [remarks, setRemarks] = useState("");
```

- [ ] **Step 2: Pass `remarks` in `assignSeat` call in `AssignSeatModal`**

In `handleSubmit`, the `assignSeat` call (lines 43–52). Add `remarks`:

```typescript
      res = await assignSeat({
        seatId: seat.seat_id,
        fullName,
        phone,
        email: email || undefined,
        duration,
        startDate,
        amountPaid: amount,
        paymentMethod,
        remarks: remarks || undefined,
      });
```

- [ ] **Step 3: Add remarks textarea to `AssignSeatModal` form**

In the form (line 98), add the textarea between the error block and the submit button (after the second `grid` div, before the `{error && ...}` block at line 202):

```tsx
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Remarks (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any notes about this membership…"
              rows={2}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30 resize-none"
            />
          </div>
```

- [ ] **Step 4: Add `remarks` state to `RenewMembershipModal`**

In `src/components/members/RenewMembershipModal.tsx`, after the existing state declarations (line 28), add:

```typescript
  const [remarks, setRemarks] = useState("");
```

- [ ] **Step 5: Pass `remarks` in `renewMembership` call in `RenewMembershipModal`**

In `handleSubmit`, the `renewMembership` call (lines 42–48). Add `remarks`:

```typescript
      res = await renewMembership({
        membershipId: membership.membership_id,
        amount,
        duration,
        startFrom,
        paymentMethod,
        remarks: remarks || undefined,
      });
```

- [ ] **Step 6: Add remarks textarea to `RenewMembershipModal` form**

Add the textarea between the payment method `<div>` and the `{error && ...}` block (after line 174, before line 176):

```tsx
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink-text/50 mb-1.5">
              Remarks (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any notes about this membership…"
              rows={2}
              className="w-full rounded-lg border border-parchment-line bg-white/70 px-3 py-2.5 text-sm text-ink-text outline-none focus:border-brass focus:ring-2 focus:ring-brass/30 resize-none"
            />
          </div>
```

- [ ] **Step 7: Manual verification — assign seat**

Run `npm run dev`. Open `/dashboard/seats`, click an available seat, fill out the form with a remarks value, submit. Check Supabase → `memberships` table — the new row should have `remarks` populated.

- [ ] **Step 8: Manual verification — renew membership**

Click an occupied seat → Renew, fill in remarks, submit. Check Supabase → `memberships` row for that member — `remarks` should be updated.

- [ ] **Step 9: Commit**

```bash
git add src/components/seats/AssignSeatModal.tsx src/components/members/RenewMembershipModal.tsx
git commit -m "feat: add remarks textarea to AssignSeatModal and RenewMembershipModal"
```
