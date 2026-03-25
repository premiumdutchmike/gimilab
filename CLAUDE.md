# Gimmelab — Claude Code Reference

A credit-based golf access SaaS. Three systems fused together: a fintech-grade **credit ledger**, a real-time **tee time inventory engine**, and an **AI-native UX layer**.

> Also see AGENTS.md — this version of Next.js has breaking changes from training data.

## Architecture Overview

```
Next.js 16 (App Router) on Vercel
├── app/(public)/     — Marketing pages, no auth
├── app/(member)/     — Golfer portal (auth required, member role)
├── app/(partner)/    — Course operator portal (partner role)
├── app/(admin)/      — Admin console (admin role, IP-restricted)
└── app/api/
    ├── webhooks/stripe/   — Stripe events
    ├── ai/                — AI search + pricing advice
    └── cron/              — Slot release, credit expiry, slot generation

Supabase  → PostgreSQL + Realtime + Storage + Auth
Drizzle ORM → schema-first, TypeScript-native
Stripe    → Subscriptions + Customer Portal + Connect (partner payouts)
Vercel AI SDK (v6) + Anthropic claude-sonnet-4-6 → AI features
Upstash Redis → caching + rate limiting
Upstash QStash → background jobs
Resend + React Email → transactional email
```

## Tech Stack (locked — do not substitute)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16, TypeScript strict, Tailwind v4 |
| Components | shadcn/ui (copy-into-repo, not a dependency) |
| Database | Supabase PostgreSQL + RLS on every table |
| ORM | Drizzle ORM with drizzle-kit migrations |
| Auth | Supabase Auth (email/Google/Apple) — NOT Clerk |
| Payments | Stripe (subscriptions + Connect) |
| AI | Vercel AI SDK v6 + Anthropic claude-sonnet-4-6 |
| Cache | Upstash Redis + QStash |
| Email | Resend + React Email |
| Animations | Motion (v11) |
| Forms | React Hook Form + Zod |
| Testing | Vitest (unit) + Playwright (e2e) |

## Subscription Tiers

| Tier | Price | Credits/mo | Rollover |
|------|-------|-----------|----------|
| Casual | $99/mo | 100 | None — credits expire on billing date |
| Core | $149/mo | 170 | 10% of unused credits roll over — 1-month cap, then expire |
| Heavy | $199/mo | 250 | 15% of unused credits roll over — 1-month cap, then expire |

**Rollover is tier-based.** Casual has no rollover. Core and Heavy roll over a percentage of unused credits for one additional month only — after that they expire. Rollover is processed by the nightly cron at billing date.

Top-up credits expire in 90 days. Bonus credits expire in 60 days.

## Critical Rules — READ BEFORE EVERY CHANGE

### Credit Ledger
- **NEVER** store credit balance as a single integer column on users.
- Balance = `SUM(amount)` on the `credit_ledger` table — always computed.
- Every credit event is an immutable new row — never UPDATE ledger rows.
- Use `getCreditBalance(userId)` from `lib/credits/ledger.ts`.
- Ledger entry types: `SUBSCRIPTION_GRANT` | `BOOKING_DEBIT` | `BOOKING_REFUND` | `TOP_UP_PURCHASE` | `ADMIN_ADJUSTMENT` | `CREDIT_EXPIRY` | `BONUS_GRANT` | `ROLLOVER_GRANT`
- `ROLLOVER_GRANT` — inserted at billing date for Core/Heavy members; amount = floor(unused_credits × rollover_pct); expires after 1 month

### Booking Engine
- **ALWAYS** use `db.transaction()` for bookings — credit debit + slot update must be atomic.
- Use `SELECT FOR UPDATE` on the slot row inside the transaction to prevent race conditions.
- Booking state machine: `AVAILABLE → BOOKED` (on confirm), `BOOKED → AVAILABLE` (on cancel/timeout).
- Core function: `lib/booking/book-tee-time.ts` → `bookTeeTime(userId, slotId)`

### Stripe / Billing
- Stripe is the **ONLY source of truth** for subscription status.
- Check `users.subscription_status` (synced by webhooks) — never call Stripe API on every request.
- **Always** verify Stripe webhook signatures with `stripe.webhooks.constructEvent()`. Reject unverified with 400.
- Webhook events to handle: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`, `checkout.session.completed`
- On `invoice.paid` → insert `SUBSCRIPTION_GRANT` ledger entry.

### Row Level Security
- **NEVER** bypass RLS. Browser clients use anon key + RLS policies.
- Only Server Actions, API routes, and Cron handlers may use the service role key.
- Every table needs RLS policies before going to production.

### Next.js 16 Patterns
- Use `proxy.ts` at the project root (NOT `middleware.ts` — renamed in v16).
- All request APIs are async: `await cookies()`, `await headers()`, `await params`, `await searchParams`.
- Default to Server Components. Only add `'use client'` when interactivity or browser APIs are needed.
- Use Server Actions (`'use server'`) for all mutations — NOT client fetch to API routes.
- `@vercel/postgres` and `@vercel/kv` are sunset — use Supabase + Upstash instead.

### AI Features
- Cache ALL AI responses in Upstash Redis:
  - Booking search: 5-minute TTL
  - Pricing advice: 24-hour TTL
  - Recommendations: 1-hour TTL
- Never make an AI call on every page render.
- Use structured output (Zod schemas) for booking search intent extraction.
- Model string: `'anthropic/claude-sonnet-4-6'` via AI SDK.

### Cron Routes
- All `/api/cron/*` routes must verify `Authorization: Bearer [CRON_SECRET]` header.
- Cron schedule (vercel.json):
  - `/api/cron/release-slots` — `0 * * * *` (hourly, releases slots 48hr before tee time)
  - `/api/cron/expire-credits` — `0 0 * * *` (midnight UTC, processes credit expiry)
  - `/api/cron/generate-slots` — `0 2 * * *` (2am UTC, materializes next 14 days of slots from blocks)

### Forms & Validation
- Define Zod schemas for ALL API inputs, form data, and AI structured outputs.
- Share Zod schemas between client and server (put in `lib/validations/`).
- Never trust unvalidated input.

## Role-Based Access

```
Role     | Access
---------|--------
member   | /dashboard, /book, /rounds, /credits, /courses, /account
partner  | /partner/dashboard, /partner/inventory, /partner/bookings, /partner/pricing, /partner/payouts, /partner/analytics, /partner/profile, /partner/settings
admin    | /admin/* (all admin routes)
```

One role per user for MVP. Role stored in Supabase Auth user metadata and checked in `proxy.ts`.

## Database Schema (tables)

- `users` — synced from Supabase Auth
- `credit_ledger` — immutable ledger (NEVER update rows)
- `courses` — partner golf courses
- `tee_time_blocks` — partner-defined recurring inventory rules
- `tee_time_slots` — materialized individual bookable slots (generated from blocks)
- `bookings` — confirmed bookings
- `partners` — course operator accounts
- `subscription_tiers` — static config (casual/core/heavy)
- `ratings` — post-round member ratings

## File Order for New Features

1. Add/update schema in `lib/db/schema.ts`
2. Run migration: `npx drizzle-kit push`
3. Write business logic in `lib/`
4. Write Server Action in `actions/`
5. Build Server Component page in `app/(portal)/`
6. Add Client Component only if interactivity needed

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CASUAL_PRICE_ID
STRIPE_CORE_PRICE_ID
STRIPE_HEAVY_PRICE_ID
ANTHROPIC_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
QSTASH_URL
QSTASH_TOKEN
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_APP_URL
CRON_SECRET
```

## Design System

- Dark theme default: bg `#090f1a`, surface `#0f1923`
- Accent green: `#4ade80` (golf/member), sky blue: `#38bdf8` (partner), purple: `#a855f7` (AI/admin), amber: `#fbbf24` (warnings)
- Typography: Geist for all headlines and UI, Nunito 900 for wordmark only (never for headlines), Geist Mono for code/numbers/IDs
- Mobile-first PWA — golfers book from parking lots
- Animations: Motion (tasteful — credit balance counters, booking confirmations)

## Do NOT

- Do not create separate repos or microservices
- Do not add Clerk — Supabase Auth is the auth layer
- Do not use `@vercel/postgres` or `@vercel/kv` — both sunset
- Do not call Stripe API on every request for subscription status
- Do not make uncached AI calls on page renders
- Do not update ledger rows — append only
- Do not skip RLS policies on any table
- Do not store credit balance as a column
