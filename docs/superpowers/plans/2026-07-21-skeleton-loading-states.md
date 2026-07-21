# Skeleton Loading States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add instant navigation to all dashboard pages using Next.js `loading.tsx` files with skeleton placeholders, so clicking a sidebar item shows the page shell immediately while data fetches in the background.

**Architecture:** One shared `Skeleton` primitive, then one `loading.tsx` per route. Each `loading.tsx` mirrors its page's layout using skeleton blocks — same grid structure, same spacing, same Topbar. No changes to existing pages. No test suite — each task ends with a manual navigation check.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, TypeScript.

## Global Constraints

- No new npm packages.
- Skeleton fill: `animate-pulse` + `bg-ink-text/5` only — no raw colors.
- All `loading.tsx` files are Server Components — no `"use client"` directive.
- `Skeleton` imported from `@/components/ui/Skeleton`.
- `Topbar` imported from `@/components/dashboard/Topbar` — used in every loading.tsx with the real page title so the header shows instantly.
- Match existing page spacing: `space-y-6 px-6 py-6 lg:px-10`.

---

### Task 1: Skeleton primitive + `/dashboard` loading

**Files:**
- Create: `src/components/ui/Skeleton.tsx`
- Create: `src/app/dashboard/loading.tsx`

**Interfaces:**
- Produces: `Skeleton({ className?: string })` — used by all later tasks.

- [ ] **Step 1: Create `src/components/ui/Skeleton.tsx`**

```tsx
export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-text/5 ${className ?? ""}`} />;
}
```

- [ ] **Step 2: Create `src/app/dashboard/loading.tsx`**

The dashboard overview page has: Topbar, 4 KPI cards (lg:grid-cols-4), a chart area (lg:col-span-2) + 2 donut placeholders stacked, and a "this month" panel (lg:col-span-2) + renewals list.

```tsx
import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <>
      <Topbar title="Overview" subtitle="Today at a glance" />
      <div className="space-y-6 px-6 py-6 lg:px-10">

        {/* 4 KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink-line/10 bg-white/60 p-5">
              <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Chart + donuts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>

        {/* This month + renewals */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-ink-line/10 bg-white/60 p-5">
            <Skeleton className="mb-3 h-3 w-20" />
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Skeleton className="mb-2 h-8 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div>
                <Skeleton className="mb-2 h-8 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <Skeleton className="h-48 rounded-2xl" />
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

Expected: clean build, `/dashboard` route still dynamic.

- [ ] **Step 4: Manual verify**

Run `npm run dev`. Click the Overview sidebar item from another page. Confirm the skeleton flashes briefly before real data loads. The Topbar title "Overview" should appear instantly.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Skeleton.tsx src/app/dashboard/loading.tsx
git commit -m "feat: add Skeleton primitive and dashboard overview loading state"
```

---

### Task 2: Seats and Members loading states

**Files:**
- Create: `src/app/dashboard/seats/loading.tsx`
- Create: `src/app/dashboard/members/loading.tsx`

**Interfaces:**
- Consumes: `Skeleton` from `@/components/ui/Skeleton` (Task 1).

- [ ] **Step 1: Create `src/app/dashboard/seats/loading.tsx`**

The seats page has: Topbar + a FloorPlan grid. Mirror it with a grid of seat tile skeletons.

```tsx
import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SeatsLoading() {
  return (
    <>
      <Topbar title="Seat Map" subtitle="Loading floor plan…" />
      <div className="px-6 py-6 lg:px-10">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {Array.from({ length: 30 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create `src/app/dashboard/members/loading.tsx`**

The members page has: Topbar, 4 KPI cards, search bar + filter pills, and a table with rows.

```tsx
import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MembersLoading() {
  return (
    <>
      <Topbar title="Members" subtitle="Every membership, past and present, in one table" />
      <div className="space-y-6 px-6 py-6 lg:px-10">

        {/* 4 KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink-line/10 bg-white/60 p-5">
              <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
          {/* Search + filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:max-w-xs" />
            <Skeleton className="h-10 w-48" />
          </div>
          {/* Table rows */}
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <div className="flex-1">
                  <Skeleton className="mb-1.5 h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-12 rounded-md" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            ))}
          </div>
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

Expected: clean build.

- [ ] **Step 4: Manual verify**

Navigate to Seat Map and Members from another page. Both show skeletons immediately before data loads.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/seats/loading.tsx src/app/dashboard/members/loading.tsx
git commit -m "feat: add seats and members skeleton loading states"
```

---

### Task 3: Member detail and Finance loading states

**Files:**
- Create: `src/app/dashboard/members/[id]/loading.tsx`
- Create: `src/app/dashboard/finance/loading.tsx`

**Interfaces:**
- Consumes: `Skeleton` from `@/components/ui/Skeleton` (Task 1).

- [ ] **Step 1: Create `src/app/dashboard/members/[id]/loading.tsx`**

The member detail page has: Topbar, back link, member header card, 3 stat tiles, timeline with 3 cards and connector lines.

```tsx
import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MemberDetailLoading() {
  return (
    <>
      <Topbar title="Member" subtitle="Member journey" />
      <div className="space-y-6 px-6 py-6 lg:px-10">

        {/* Back link */}
        <Skeleton className="h-4 w-20" />

        {/* Member header card */}
        <div className="rounded-2xl border border-parchment-line bg-white/60 p-6">
          <Skeleton className="mb-3 h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="mt-2 h-3 w-36" />
        </div>

        {/* 3 stat tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-parchment-line bg-white/60 p-4">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-parchment-line bg-white/60 p-6">
          <Skeleton className="mb-6 h-3 w-36" />
          <div className="relative">
            {Array.from({ length: 3 }).map((_, i) => {
              const isLast = i === 2;
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Skeleton className="mt-1 h-3 w-3 rounded-full" />
                    {!isLast && <div className="mt-1 w-px grow bg-parchment-line" />}
                  </div>
                  <div className={`${isLast ? "mb-0" : "mb-6"} flex-1 rounded-xl border border-parchment-line bg-white/60 p-4`}>
                    <div className="flex justify-between">
                      <div>
                        <Skeleton className="mb-1.5 h-4 w-48" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="mt-3 flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
```

- [ ] **Step 2: Create `src/app/dashboard/finance/loading.tsx`**

The finance page has: Topbar, 4 KPI cards, and a large tabbed content area.

```tsx
import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function FinanceLoading() {
  return (
    <>
      <Topbar title="Finance" subtitle="All-time revenue, expenses, and investments" />
      <div className="space-y-6 px-6 py-6 lg:px-10">

        {/* 4 KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink-line/10 bg-white/60 p-5">
              <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Tabs + chart */}
        <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
          {/* Tab bar */}
          <div className="mb-6 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-lg" />
            ))}
          </div>
          {/* Chart area */}
          <Skeleton className="h-64 w-full rounded-xl" />
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

Expected: clean build, `/dashboard/members/[id]` and `/dashboard/finance` still dynamic.

- [ ] **Step 4: Manual verify**

Navigate to Finance from another page — 4 KPI skeletons and chart placeholder show immediately. Click a member name from the members list — member detail skeleton shows instantly, then real data loads.

- [ ] **Step 5: Commit**

```bash
git add "src/app/dashboard/members/[id]/loading.tsx" src/app/dashboard/finance/loading.tsx
git commit -m "feat: add member detail and finance skeleton loading states"
```
