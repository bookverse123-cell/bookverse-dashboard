# BOOKVERSE — Library & Coworking Dashboard

A management dashboard for a library + premium coworking space: seat
allocation on an interactive floor plan, membership lifecycle tracking,
automated WhatsApp renewal reminders, and revenue/expense/investment
analytics — built with **Next.js (App Router)**, **Framer Motion**,
**Supabase**, and deployed on **Vercel**.

Right now the app runs on built-in **demo data** so you can preview every
screen immediately. Once you connect Supabase (free tier), it switches
seamlessly to your real data.

---

## 1. Run it locally (demo mode)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on the dashboard with realistic
demo data (100 reading-hall seats, 20 premium lounge seats, members,
finances). No Supabase needed for this step.

---

## 2. Connect Supabase (free tier)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → Run.
   This creates all tables, views, and security policies.
3. Paste the contents of `supabase/seed.sql` → Run.
   This creates 100 library seats (`L-001`–`L-100`), 20 lounge seats
   (`P-01`–`P-20`), and starter membership plans (edit prices later in
   **Settings**).
4. Go to **Project Settings → API** and copy the **Project URL** and
   **anon public key**.
5. Copy `.env.local.example` to `.env.local` and fill in those two values:

   ```bash
   cp .env.local.example .env.local
   ```

6. Create your admin login: **Authentication → Users → Add user** (email +
   password). This is the only account — there's no public sign-up.
7. Restart `npm run dev`. The app now reads/writes your real data, and
   `/login` requires that admin account.

---

## 3. Floor plan & seat numbering

The seat map mirrors your uploaded layout's spirit (reading hall with
bookshelves + circulation zone, premium lounge with arches) using a clean
grid of `L-001`…`L-100` for the reading hall and `P-01`…`P-20` for the
lounge. Seat positions live in the `seats` table (`pos_x`, `pos_y`, 0–100
scale) — you can re-arrange them later by editing those values directly in
Supabase's table editor if your real layout differs, without touching any
code.

---

## 4. WhatsApp reminders (Twilio)

Reminders are sent by a Supabase **Edge Function**
(`supabase/functions/send-membership-reminders`) using the **Twilio
WhatsApp Sandbox** (free for testing; upgrade to a paid Twilio WhatsApp
sender for production).

### One-time Twilio setup
1. Create a free [Twilio](https://www.twilio.com/try-twilio) account.
2. In the Twilio console, activate the **WhatsApp Sandbox** (Messaging →
   Try it out → Send a WhatsApp message). Note the sandbox number
   (e.g. `whatsapp:+14155238886`) and join code.
3. From your own WhatsApp and the member's WhatsApp (for testing), send the
   sandbox join code to the sandbox number — required for the sandbox to
   message that number.

### Deploy the function
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_auth_token
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
supabase secrets set ADMIN_WHATSAPP_NUMBER=whatsapp:+9198xxxxxxxx

supabase functions deploy send-membership-reminders
```

### Schedule the daily check
```bash
supabase functions schedule send-membership-reminders --cron "30 3 * * *"
```
(`30 3 * * *` UTC ≈ 9:00am IST. Adjust as you like.)

This daily job finds memberships ending within 3 days, messages each
member on WhatsApp, and sends you a summary of everyone due for renewal.
The **"Send WhatsApp reminder now"** button on a seat's detail panel calls
the same function for an instant, one-off reminder.

> **Going live:** when you outgrow the sandbox, apply for a WhatsApp
> Business sender in Twilio (requires Meta Business verification — usually
> a few days). No code changes needed — just update `TWILIO_WHATSAPP_FROM`.

---

## 5. Deploy to Vercel (free)

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Add the same two environment variables from `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in
   **Project Settings → Environment Variables**.
4. Deploy. Done — your dashboard is live on a free Vercel URL.

---

## What's included

- **Login** — Supabase Auth (single admin), animated split layout.
- **Overview** — KPI cards (occupancy, active members, renewals due),
  revenue-vs-expense chart, occupancy donuts, renewals list.
- **Seat Map** — interactive floor plan (reading hall + premium lounge),
  color-coded by status (available / occupied / renewal due / overdue),
  click a seat to view the member, assign a new member, send a reminder, or
  end a membership.
- **Members** — searchable/filterable table of every membership, with a
  one-click WhatsApp reminder per row.
- **Finance** — monthly revenue vs. expenses chart, expense-by-category
  breakdown, and editable ledgers for café sales, café/operating expenses,
  and investments (with profit auto-calculated).
- **Settings** — edit membership pricing per plan/zone, integration status,
  reminder automation docs.

## What to build next (ideas)

- Seat-layout editor (drag seats on the floor plan to match your exact space)
- Payment history per member + receipts
- Multi-staff roles (you mentioned single-admin for now — easy to extend
  via Supabase Auth roles later)
- Email reminders as a fallback channel
- CSV export for accounting

---

## Tech stack

- **Next.js 16** (App Router, Server Actions)
- **Framer Motion** for animation
- **Supabase** (Postgres, Auth, Edge Functions) — free tier
- **Recharts** for charts
- **Tailwind CSS v4** with a custom "reading room" design system
- **Twilio WhatsApp API** for reminders
- **Vercel** for hosting — free tier
