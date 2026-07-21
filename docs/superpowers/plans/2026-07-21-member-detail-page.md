# Member Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/dashboard/members/[id]` — a full-page membership journey view showing a vertical timeline of all subscription periods for a member.

**Architecture:** Data layer first (new `getMemberDetail` function + types), then the page + timeline component, then the navigation entry point (link in `MembersTable`). No test suite — each task ends with a manual verification step.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase, Tailwind CSS v4, Lucide React.

## Global Constraints

- No new npm packages.
- Tailwind classes must use existing design tokens: `ink`, `ink-soft`, `ink-line`, `parchment`, `parchment-dim`, `parchment-line`, `brass`, `brass-soft`, `sage`, `terracotta`, `muted`, `muted-light`.
- Server Components fetch data directly — no client fetch hooks.
- `params` in Next.js 15 is a `Promise` — must be awaited.

---

### Task 1: Data layer — types and `getMemberDetail`

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/data.ts`

**Interfaces:**
- Produces:
  - `PaymentEntry` type
  - `MemberHistoryEntry` type
  - `MemberDetail` type
  - `getMemberDetail(memberId: string): Promise<MemberDetail | null>`
  - Also fixes `getMemberships` to select `remarks` so `MembershipRow.remarks` is populated

- [ ] **Step 1: Add new types to `src/lib/types.ts`**

Append after the existing `MembershipRow` type (after line 37):

```typescript
export type PaymentEntry = {
  amount: number;
  payment_date: string;
  method: string;
};

export type MemberHistoryEntry = {
  membership_id: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  amount_paid: number;
  status: "active" | "expired" | "cancelled";
  remarks: string | null;
  payments: PaymentEntry[];
};

export type MemberDetail = {
  member_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  memberships: MemberHistoryEntry[];
};
```

- [ ] **Step 2: Fix `getMemberships` to select `remarks`**

In `src/lib/data.ts`, the `getMemberships` select string (line 225) does not include `remarks`. Update it:

```typescript
    .select(
      "id, start_date, end_date, status, amount_paid, remarks, members(id, full_name, phone, email), seats(seat_code, zone)"
    )
```

Also update the `MembershipJoinRow` type (lines 210–218) to include `remarks`:

```typescript
type MembershipJoinRow = {
  id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  amount_paid: number;
  remarks: string | null;
  members: { id: string; full_name: string; phone: string; email: string | null } | null;
  seats: { seat_code: string; zone: "library" | "lounge" } | null;
};
```

And add `remarks` to the mapped return object inside `getMemberships` (after `days_until_expiry`):

```typescript
        days_until_expiry: days,
        remarks: row.remarks,
```

- [ ] **Step 3: Add `getMemberDetail` to `src/lib/data.ts`**

Add this function at the end of the file:

```typescript
export async function getMemberDetail(memberId: string): Promise<import("./types").MemberDetail | null> {
  if (!isSupabaseConfigured()) {
    return {
      member_id: memberId,
      full_name: "Ankit Sharma",
      phone: "+919417249290",
      email: "ankit@example.com",
      memberships: [
        {
          membership_id: "demo-1",
          start_date: "2026-04-15",
          end_date: "2026-05-15",
          duration_months: 1,
          amount_paid: 2200,
          status: "expired",
          remarks: null,
          payments: [{ amount: 2200, payment_date: "2026-04-15", method: "cash" }],
        },
        {
          membership_id: "demo-2",
          start_date: "2026-05-15",
          end_date: "2026-07-15",
          duration_months: 2,
          amount_paid: 4200,
          status: "expired",
          remarks: "Paid in advance",
          payments: [{ amount: 4200, payment_date: "2026-05-15", method: "upi" }],
        },
        {
          membership_id: "demo-3",
          start_date: "2026-07-15",
          end_date: "2026-08-15",
          duration_months: 1,
          amount_paid: 2300,
          status: "active",
          remarks: null,
          payments: [{ amount: 2300, payment_date: "2026-07-15", method: "cash" }],
        },
      ],
    };
  }

  const supabase = await createClient();

  const [{ data: member }, { data: memberships, error }] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name, phone, email")
      .eq("id", memberId)
      .single(),
    supabase
      .from("memberships")
      .select("id, start_date, end_date, status, amount_paid, remarks, payments(amount, payment_date, method)")
      .eq("member_id", memberId)
      .order("start_date", { ascending: true }),
  ]);

  if (!member || error || !memberships) return null;

  const historyEntries: import("./types").MemberHistoryEntry[] = memberships.map((m: {
    id: string;
    start_date: string;
    end_date: string;
    status: "active" | "expired" | "cancelled";
    amount_paid: number;
    remarks: string | null;
    payments: { amount: number; payment_date: string; method: string }[];
  }) => {
    const start = new Date(m.start_date);
    const end = new Date(m.end_date);
    const duration_months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return {
      membership_id: m.id,
      start_date: m.start_date,
      end_date: m.end_date,
      duration_months,
      amount_paid: Number(m.amount_paid),
      status: m.status,
      remarks: m.remarks,
      payments: (m.payments ?? []).map((p) => ({
        amount: Number(p.amount),
        payment_date: p.payment_date,
        method: p.method,
      })),
    };
  });

  return {
    member_id: member.id,
    full_name: member.full_name,
    phone: member.phone,
    email: member.email,
    memberships: historyEntries,
  };
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/data.ts
git commit -m "feat: add MemberDetail types and getMemberDetail data function"
```

---

### Task 2: `MemberTimeline` component + detail page

**Files:**
- Create: `src/components/members/MemberTimeline.tsx`
- Create: `src/app/dashboard/members/[id]/page.tsx`

**Interfaces:**
- Consumes: `MemberDetail`, `MemberHistoryEntry` from Task 1.
- Consumes: `getMemberDetail(memberId)` from Task 1.
- Consumes: `Topbar` from `@/components/dashboard/Topbar` (existing pattern — used in all dashboard pages).

- [ ] **Step 1: Create `src/components/members/MemberTimeline.tsx`**

```tsx
import type { MemberHistoryEntry } from "@/lib/types";

function statusPill(status: MemberHistoryEntry["status"]) {
  if (status === "active") return "bg-sage/15 text-sage";
  if (status === "cancelled") return "bg-terracotta/15 text-terracotta";
  return "bg-ink-text/10 text-ink-text/50";
}

function statusLabel(status: MemberHistoryEntry["status"]) {
  if (status === "active") return "Active";
  if (status === "cancelled") return "Cancelled";
  return "Expired";
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function methodLabel(method: string) {
  const map: Record<string, string> = {
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };
  return map[method] ?? method;
}

export function MemberTimeline({ memberships }: { memberships: MemberHistoryEntry[] }) {
  if (memberships.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink-text/40">No membership history found.</p>
    );
  }

  return (
    <div className="relative">
      {memberships.map((m, i) => {
        const isLast = i === memberships.length - 1;
        const primaryPayment = m.payments[0];
        const durationLabel = m.duration_months === 1 ? "1 Month" : `${m.duration_months} Months`;

        return (
          <div key={m.membership_id} className="relative flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-brass bg-parchment" />
              {!isLast && <div className="mt-1 w-px grow bg-parchment-line" />}
            </div>

            {/* Card */}
            <div className={`mb-6 flex-1 rounded-xl border border-parchment-line bg-white/60 p-4 ${isLast ? "mb-0" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink-text">
                    {fmt(m.start_date)} → {fmt(m.end_date)}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-ink-text/40 uppercase tracking-wider">
                    {durationLabel}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(m.status)}`}>
                  {statusLabel(m.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-text/70">
                <span>₹{m.amount_paid.toLocaleString("en-IN")}</span>
                {primaryPayment && (
                  <span className="text-ink-text/40">· {methodLabel(primaryPayment.method)}</span>
                )}
              </div>

              {m.remarks && (
                <p className="mt-2 text-xs italic text-ink-text/50">{m.remarks}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/dashboard/members/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Phone, Mail, IndianRupee, CalendarDays, Layers } from "lucide-react";
import { getMemberDetail } from "@/lib/data";
import { Topbar } from "@/components/dashboard/Topbar";
import { MemberTimeline } from "@/components/members/MemberTimeline";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getMemberDetail(id);
  if (!detail) notFound();

  const totalPaid = detail.memberships.reduce((sum, m) => sum + m.amount_paid, 0);
  const latestMembership = detail.memberships[detail.memberships.length - 1];
  const firstMembership = detail.memberships[0];

  const joinedLabel = firstMembership
    ? new Date(firstMembership.start_date).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const currentStatusLabel = latestMembership
    ? latestMembership.status === "active"
      ? "Active"
      : latestMembership.status === "cancelled"
      ? "Cancelled"
      : "Expired"
    : "—";

  const currentStatusClass = latestMembership?.status === "active"
    ? "bg-sage/15 text-sage"
    : latestMembership?.status === "cancelled"
    ? "bg-terracotta/15 text-terracotta"
    : "bg-ink-text/10 text-ink-text/50";

  return (
    <>
      <Topbar title={detail.full_name} subtitle="Member journey" />
      <div className="space-y-6 px-6 py-6 lg:px-10">

        {/* Back link */}
        <Link
          href="/dashboard/members"
          className="inline-flex items-center gap-1.5 text-sm text-ink-text/50 transition hover:text-ink-text"
        >
          <ChevronLeft size={16} />
          Members
        </Link>

        {/* Member header */}
        <div className="rounded-2xl border border-parchment-line bg-white/60 p-6">
          <h1 className="font-display text-3xl text-ink-text">{detail.full_name}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-text/60">
            <span className="flex items-center gap-1.5">
              <Phone size={14} />
              {detail.phone}
            </span>
            {detail.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                {detail.email}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-mono uppercase tracking-wider text-ink-text/30">
            Member since {joinedLabel}
          </p>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-parchment-line bg-white/60 p-4">
            <div className="flex items-center gap-2 text-ink-text/40">
              <Layers size={15} />
              <span className="text-xs font-mono uppercase tracking-wider">Total periods</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-text">{detail.memberships.length}</p>
          </div>
          <div className="rounded-xl border border-parchment-line bg-white/60 p-4">
            <div className="flex items-center gap-2 text-ink-text/40">
              <IndianRupee size={15} />
              <span className="text-xs font-mono uppercase tracking-wider">Total paid</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-text">
              ₹{totalPaid.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl border border-parchment-line bg-white/60 p-4">
            <div className="flex items-center gap-2 text-ink-text/40">
              <CalendarDays size={15} />
              <span className="text-xs font-mono uppercase tracking-wider">Current status</span>
            </div>
            <div className="mt-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${currentStatusClass}`}>
                {currentStatusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-parchment-line bg-white/60 p-6">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-wider text-ink-text/40">
            Membership history
          </h2>
          <MemberTimeline memberships={detail.memberships} />
        </div>

      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors, no missing module errors.

- [ ] **Step 4: Manual verify**

Run `npm run dev`. Navigate directly to `http://localhost:3000/dashboard/members/<any-member-id-from-supabase>`. Confirm:
- Page renders with member name, phone, email.
- KPI strip shows correct period count, total paid, current status pill.
- Timeline shows one card per membership period, ordered oldest to newest, with connector lines between cards.
- Remarks show only when non-null.

- [ ] **Step 5: Commit**

```bash
git add src/components/members/MemberTimeline.tsx src/app/dashboard/members/[id]/page.tsx
git commit -m "feat: add member detail page with membership timeline"
```

---

### Task 3: Wire navigation — click member name → detail page

**Files:**
- Modify: `src/components/members/MembersTable.tsx`

**Interfaces:**
- Consumes: `member_id` from `MembershipRow` (already present on each row).

- [ ] **Step 1: Import `Link` in `MembersTable.tsx`**

At the top of `src/components/members/MembersTable.tsx`, add `Link` to the imports:

```typescript
import Link from "next/link";
```

- [ ] **Step 2: Wrap member name in a `Link`**

In `MembersTable.tsx`, find the membership row's member name cell (around line 205):

```tsx
                    <td className="py-3">
                      <p className="font-medium text-ink-text">{row_.full_name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-ink-text/45">
                        <Phone size={11} />
                        {row_.phone}
                      </p>
                    </td>
```

Replace with:

```tsx
                    <td className="py-3">
                      <Link
                        href={`/dashboard/members/${row_.member_id}`}
                        className="font-medium text-ink-text hover:underline"
                      >
                        {row_.full_name}
                      </Link>
                      <p className="flex items-center gap-1.5 text-xs text-ink-text/45">
                        <Phone size={11} />
                        {row_.phone}
                      </p>
                    </td>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Manual verify**

Run `npm run dev`. Go to `/dashboard/members`. Hover over a member name — cursor becomes pointer, name underlines. Click it — navigates to `/dashboard/members/[member_id]` and shows their detail page. Use browser back button to return to the list.

- [ ] **Step 5: Commit**

```bash
git add src/components/members/MembersTable.tsx
git commit -m "feat: link member names to detail page"
```
