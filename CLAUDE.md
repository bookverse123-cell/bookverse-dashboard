# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
```

No test suite is configured.

## Architecture

**Next.js 16 App Router** with Supabase as backend and a built-in demo mode.

### Demo / Supabase mode

`src/lib/data.ts` is the central data layer. Every data-fetching function checks `isSupabaseConfigured()` at the top — if `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing or placeholder values, it falls back to static demo data from `src/lib/demo-data.ts`. The same fallback fires on Supabase query errors. This means the app runs fully without any backend.

Mutations (Server Actions) also check `isSupabaseConfigured()` first and return a user-facing error if in demo mode.

### Route structure

```
src/app/
  page.tsx                 → redirects to /dashboard or /login
  login/page.tsx           → Supabase Auth login
  dashboard/
    layout.tsx             → wraps all dashboard pages with <Sidebar>
    page.tsx               → overview (KPIs, charts, renewals)
    seats/
      page.tsx             → interactive floor plan
      actions.ts           → assignSeat, endMembership, sendManualReminder
    members/page.tsx       → searchable membership table
    finance/
      page.tsx             → revenue/expense analytics
      actions.ts           → ledger CRUD
    settings/
      page.tsx             → plan pricing editor, integrations
      actions.ts           → updatePlan
```

### Auth / middleware

`src/middleware.ts` runs on every non-static request and calls `updateSession` from `src/lib/supabase/middleware.ts`, which refreshes the Supabase session cookie. Unauthenticated users are redirected to `/login` by the middleware logic.

### Supabase clients

Three separate clients for different Next.js contexts:
- `src/lib/supabase/server.ts` — Server Components and Server Actions (uses `cookies()`)
- `src/lib/supabase/client.ts` — Client Components (browser)
- `src/lib/supabase/middleware.ts` — middleware session refresh

### Database views used by the app

The app queries several Postgres views defined in `supabase/schema.sql`:
- `seat_status` — joins seats + active membership + member; computes `occupancy_status` and `days_until_expiry`
- `monthly_revenue` — union of membership payments and cafeteria sales, bucketed by month
- `monthly_expenses` — union of cafeteria expenses and investments, bucketed by month
- `expiring_memberships` — active memberships ending within 3 days

### Design system

Tailwind CSS v4 with custom tokens defined in `src/app/globals.css` under `@theme inline`. Key color names used throughout components:
- `ink` / `ink-soft` / `ink-line` — dark backgrounds
- `parchment` / `parchment-dim` / `parchment-line` — light surfaces
- `brass` / `brass-soft` — accent/highlight
- `sage` / `terracotta` — status colors (available / expired)
- `muted` / `muted-light` — secondary text

The `.grain` CSS class adds a subtle noise texture overlay (used on auth and hero surfaces).

### WhatsApp reminders

Sent via a Supabase Edge Function (`send-membership-reminders`) using Twilio. The `sendManualReminder` Server Action in `seats/actions.ts` invokes this function directly via `supabase.functions.invoke()`. Deployment and scheduling are described in the README.
