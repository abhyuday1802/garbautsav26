# Garba Utsav 2026 — Entry Pass Website

A full Next.js site for Sun Group's **Garba Utsav 2026** (Oct 11–19,
organized by Sanskardhani Garba Utsav Group, Rajnandgaon (C.G.), Title
Sponsor Shivnath Vatika): buy passes, get a QR ticket, and let gate
staff scan/admit — with a real Postgres database and Stripe checkout.

## Pages

- `/` — landing page (hero, sponsor block, organizer credit — matches
  the official poster's palette and copy)
- `/buy` — pick Daily or Season pass, enter details, pay via Stripe
  Checkout
- `/ticket` — look up a pass by code, see its QR, save it as an image
- `/gate` — staff-only: camera QR scan or manual code entry, per-night
  date selector, couple/family admit stepper
- `/staff` — staff-only: issue a counter pass paid in **cash** (marks it
  paid immediately, records which staff member collected it), generate
  a real **online payment link** for the buyer's phone (stays pending
  until they pay, exactly like a website purchase), or issue a free
  **complimentary** pass (sponsor/reason required)
- `/admin` — admin-only: total collection, passes sold vs. pending,
  breakdowns by pass type/category/channel/payment mode, a cash
  reconciliation table by staff member, and a recent-transactions log

`/gate` and `/staff` are gated by a single shared `STAFF_TOKEN` (see
Notes below) — not linked from the main nav, only from the footer of
the homepage. `/admin` uses its own, separate `ADMIN_TOKEN`.

## What's here

- `prisma/schema.prisma` — Pass, Checkin, EventDay tables
- `lib/event.ts` — all event branding/copy (name, dates, sponsor,
  organizer) in one place
- `lib/passes.ts` — pricing table (placeholders — see Notes) and the
  pass-code generator
- `app/api/checkout/route.ts` — starts a Stripe Checkout session
- `app/api/webhook/route.ts` — Stripe calls this on successful
  payment; it's the only thing that marks a pass "paid"
- `app/api/pass/[code]/route.ts` — public lookup used by `/ticket`
- `app/api/scan/route.ts` — the gate scanner's brain: daily pass
  validity, and season-pass per-day headcount with the stepper
- `app/api/staff/issue/route.ts` — counter tickets and free
  complimentary passes
- `app/api/admin/summary/route.ts` — aggregated totals/breakdowns for
  the `/admin` dashboard

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in real values:
   - `DATABASE_URL` — a free Postgres database at
     [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)
   - `STRIPE_SECRET_KEY` — from your Stripe dashboard (start with a
     test key)
   - `APP_URL` — fill in once you know your deployed URL (step 4)
   - `STAFF_TOKEN` — any long random string; this is what staff type
     into the `/gate` and `/staff` unlock screens
   - `ADMIN_TOKEN` — a different long random string, for `/admin`
3. `npm run db:push` — creates the tables
4. `vercel` (or push to GitHub and import at vercel.com) — deploys and
   gives you a URL; put that URL back into `APP_URL` and redeploy
5. In the Stripe dashboard, add a webhook endpoint at
   `https://your-domain.com/api/webhook`, listening for
   `checkout.session.completed`, and copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`

## Notes

- **Prices are placeholders** — ₹200 daily, ₹1,500/₹2,800/₹5,000 for
  single/couple/family season passes, set in `lib/passes.ts`. Update
  those before going live.
- **Currency is INR.** Accepting INR live (not just test mode) on
  Stripe requires a Stripe account registered to an Indian business
  entity; if that's not in place yet, Razorpay is worth a look as an
  India-first alternative — the checkout route is the only file that
  would need to change.
- `STAFF_TOKEN` is a placeholder auth model — one shared code for the
  whole gate/counter team, kept in the browser's `sessionStorage`
  after unlock. Fine to start with; swap for real per-user login
  (e.g. NextAuth with a staff role) before you have more than a
  couple of staff or want an audit trail of who scanned what.
- Every pass now records a **payment mode** — `online` (website or a
  staff-generated payment link), `cash` (collected at the counter,
  with `collectedBy` recording who took it), or `free` (comp passes).
  This is on the `Pass` table, so if you're updating an existing
  database run `npm run db:push` again after pulling this change.
- Nothing here sends SMS/WhatsApp — `/staff` shows a copyable link for
  staff to paste into a message themselves. Wiring up Twilio (or
  similar) to send it automatically is a small, separate addition.
- The gate scanner needs camera permission and HTTPS (Vercel gives you
  that by default) to use the camera scan button; the manual code
  field always works as a fallback.
- All event copy — name, dates, sponsor, organizer — lives in
  `lib/event.ts`. Change it there and it updates everywhere.
