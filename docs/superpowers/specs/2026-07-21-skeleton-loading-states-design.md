# Skeleton Loading States Design

**Date:** 2026-07-21  
**Status:** Approved

## Goal

Add instant navigation to all dashboard pages. Clicking a sidebar item shows the page chrome and skeleton placeholders immediately (via Next.js `loading.tsx`), then real data swaps in once fetched.

## Mechanism

Next.js App Router `loading.tsx` convention. A `loading.tsx` placed next to a `page.tsx` is automatically wrapped in a React Suspense boundary by the framework. On navigation:
1. Sidebar + layout renders immediately (already present).
2. `loading.tsx` content renders immediately in the content area.
3. `page.tsx` content replaces it once async data resolves.

No client-side changes to existing pages required.

## Shared Primitive

`src/components/ui/Skeleton.tsx` — a single reusable block:

```tsx
export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-text/5 ${className ?? ""}`} />;
}
```

All `loading.tsx` files import from here.

## Files

| Action | Path |
|--------|------|
| Create | `src/components/ui/Skeleton.tsx` |
| Create | `src/app/dashboard/loading.tsx` |
| Create | `src/app/dashboard/seats/loading.tsx` |
| Create | `src/app/dashboard/members/loading.tsx` |
| Create | `src/app/dashboard/members/[id]/loading.tsx` |
| Create | `src/app/dashboard/finance/loading.tsx` |

Settings page excluded — no async data, renders instantly.

## Per-Page Skeleton Layouts

### `/dashboard` loading.tsx
- Topbar with placeholder title skeleton
- 4 KPI card skeletons (grid, same dimensions as real cards)
- Chart area skeleton (tall block, 2/3 width)
- Right column: 2 donut skeletons + renewals list skeleton rows

### `/dashboard/seats` loading.tsx
- Topbar with placeholder title skeleton
- Grid of ~20 seat tile skeletons (matching FloorPlan tile size)

### `/dashboard/members` loading.tsx
- Topbar with placeholder title skeleton
- 4 KPI card skeletons
- Search bar skeleton + filter pill skeletons
- 8 table row skeletons

### `/dashboard/members/[id]` loading.tsx
- Topbar with placeholder title skeleton
- Back-link placeholder
- Member header card skeleton (name, phone, email lines)
- 3 stat tile skeletons
- Timeline: 3 card skeletons with connector lines

### `/dashboard/finance` loading.tsx
- Topbar with placeholder title skeleton
- 4 KPI card skeletons
- Tab bar skeleton
- Large chart area skeleton

## Design Constraints

- Use only `animate-pulse` and `bg-ink-text/5` for skeleton fill — no raw colors.
- Match real page layout structure (same grid columns, same spacing).
- All `loading.tsx` files are Server Components (no `"use client"`).
- No new npm packages.

## Out of Scope

- Skeleton for settings page.
- Per-section Suspense boundaries within a page.
- Animated shimmer (Tailwind `animate-pulse` is sufficient).
