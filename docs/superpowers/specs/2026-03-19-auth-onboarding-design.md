# Auth + Subscription Onboarding — Design Spec

**Date:** 2026-03-19
**Project:** OneGolf
**Sub-project:** Phase 1 — Auth + Onboarding
**Status:** Approved

---

## Context

This is the first sub-project in the OneGolf build sequence. Nothing else works without auth — no booking, no credits, no partner portal. The goal is a complete sign-up-to-dashboard flow where a new golfer can discover their plan, create an account, pay, and land in the app with credits ready to spend.

---

## Subscription Tiers (source of truth: `lib/stripe/client.ts`)

| Tier | Price | Credits/mo | Rollover |
|------|-------|-----------|----------|
| Casual | $99/mo | 100 | None — credits expire on billing date |
| Core | $149/mo | 150 | 10% of unused credits roll over (1 month cap) |
| Heavy | $199/mo | 210 | 15% of unused credits roll over (1 month cap) |

**Rollover is tier-based.** Casual credits expire on billing date — never imply otherwise. Core and Heavy members roll over a percentage of unused credits for one additional month; after that they expire. Surface rollover as a benefit on Core/Heavy tier displays only.

---

## Flow Overview

```
/pricing  →  /signup?plan=<tier>  →  Stripe Checkout  →  /welcome  →  /dashboard
                ↓ (Google OAuth)
          /auth/callback  →  Stripe Checkout  →  /welcome  →  /dashboard
                                ↑
                         /login (returning users)
```

---

## Screen-by-Screen Design

### Screen 1 — Pricing Page (`/pricing`)

**Purpose:** Sell the subscription. User picks a tier before creating an account.

**Layout:** Stacked vertical rows — one row per tier. Each row shows:
- Tier name (Casual / Core / Heavy)
- Monthly price ($99 / $149 / $199)
- Credits per month (100 / 150 / 210)
- "Most Popular" badge on Core

**Interaction:** Clicking any row navigates to `/signup?plan=<tier>` with the chosen tier in the query param.

**Design:** Dark theme (`#090f1a` bg), accent green (`#4ade80`). Core row highlighted with green border.

---

### Screen 2 — Signup (`/signup?plan=<tier>`)

**Purpose:** Create a Supabase account. Plan is pre-selected from query param.

**Layout:**
- Header: "You chose [Tier] — $X/mo" reminder chip at top
- Primary CTA: "Continue with Google" button (Supabase OAuth)
- Divider: "— or —"
- Form fields: Full Name, Email, Password
- Submit button: "Create Account"
- Footer link: "Already have an account? Sign in →"

**Behaviour — email/password path:**
1. Call `supabase.auth.signUp({ email, password, options: { data: { full_name, role: 'member' } } })` — sets `user_metadata.role = 'member'` at creation time so proxy.ts never sends the user into a redirect loop.
2. Server Action inserts `users` row: `{ id: authUser.id, email, fullName }`.
3. Server Action creates Stripe Customer: `stripe.customers.create({ email, name: fullName, metadata: { userId } })`.
4. Server Action updates `users` row with `stripeCustomerId`.
5. Server Action creates Stripe Checkout Session (see Screen 3 config).
6. Redirect to Stripe Checkout URL.

**Behaviour — Google OAuth path:**
1. Before initiating OAuth, store the chosen `plan` in a short-lived cookie (`onegolf-pending-plan`, 1hr TTL).
2. Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`.
3. Google redirects back to `/auth/callback` — see `/auth/callback` below.

**Error states:** Email already in use → "An account with this email exists. Sign in →". Weak password → inline validation.

---

### Auth Callback Route (`/auth/callback`)

**Purpose:** Complete the Supabase PKCE exchange for Google OAuth. Create DB row, Stripe customer, and checkout session.

**Route:** `app/(public)/auth/callback/route.ts` — a Route Handler (not a page).

**Behaviour:**
1. Exchange the `code` param for a session: `supabase.auth.exchangeCodeForSession(code)`.
2. Set `user_metadata.role = 'member'` via `supabase.auth.admin.updateUserById(userId, { user_metadata: { role: 'member' } })` using the service role client.
3. Upsert `users` row (idempotent — may already exist from a previous attempt).
4. Read the `onegolf-pending-plan` cookie to get the chosen tier. If missing, default to `'core'`.
5. Create Stripe Customer (if `stripeCustomerId` not already set).
6. Create Stripe Checkout Session.
7. Delete the `onegolf-pending-plan` cookie.
8. Redirect to Stripe Checkout URL.

---

### Screen 3 — Stripe Checkout (Stripe-hosted)

**Purpose:** Collect payment. Stripe-hosted page, no custom code needed here.

**Checkout Session configuration:**
```ts
stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: stripeCustomerId,
  line_items: [{ price: STRIPE_PRICE_IDS[tier], quantity: 1 }],
  metadata: { userId },           // used as fallback lookup in webhook
  success_url: `${APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${APP_URL}/signup?plan=${tier}`,
})
```

**Webhook tier resolution:** `handleInvoicePaid` resolves the tier by matching the invoice's `price.id` against `STRIPE_CASUAL_PRICE_ID` / `STRIPE_CORE_PRICE_ID` / `STRIPE_HEAVY_PRICE_ID` env vars — not from `metadata.tier`. This is the existing behaviour in `lib/stripe/client.ts` and `app/api/webhooks/stripe/route.ts` and should not be changed.

**Webhook user lookup:** Both `handleCheckoutCompleted` and `handleInvoicePaid` look up the user by `stripeCustomerId`. This is reliable because the `stripeCustomerId` is written to the `users` row before the Checkout Session is created. As an additional safety net, `handleInvoicePaid` should also accept `metadata.userId` as a fallback lookup if `stripeCustomerId` lookup returns nothing.

**On success:** Stripe fires `checkout.session.completed` then `invoice.paid`. Both are already handled by the existing webhook route.

---

### Webhook Idempotency (`handleInvoicePaid`)

**Problem:** Stripe retries webhooks on non-2xx responses. A duplicate `invoice.paid` delivery would insert a second `SUBSCRIPTION_GRANT` row, doubling the user's credits.

**Fix:** Before inserting, check for an existing ledger row with the same invoice ID. Store the Stripe invoice ID in the `notes` field or use a `referenceId`-based check. Since `referenceId` is currently `uuid` type but Stripe invoice IDs are strings (e.g. `in_xxx`), change `referenceId` column type to `text` in `lib/db/schema.ts`.

**Guard logic:**
```ts
const existing = await tx.select().from(creditLedger)
  .where(and(eq(creditLedger.userId, user.id), eq(creditLedger.referenceId, invoice.id)))
  .limit(1)
if (existing.length > 0) return  // already processed
```

**Schema change required:** `referenceId: text('reference_id')` in `credit_ledger` table. Run `npx drizzle-kit push` after updating schema.

---

### Screen 4 — Welcome (`/welcome`)

**Purpose:** Confirm success, explain credits, send user to the app feeling informed.

**Layout:**
- Large golf emoji + "You're in, [First Name]!"
- Credit balance: "X credits are in your wallet" (amount varies by tier)
- One-paragraph explainer: how credits work, what a typical round costs, that credits reset at each billing date
- Single CTA: "Start Booking →" → `/dashboard`

**Behaviour:**
- This is a **Client Component** that polls the credit balance endpoint every 2s for up to 10s (webhook may be slightly delayed). Shows spinner if balance is 0, updates automatically when credits arrive.
- **Subscription-check redirect:** Implemented inside the page component (not proxy.ts, since `/welcome` is a public route). On load, if the user already has `subscription_status = 'active'` AND has visited `/welcome` before (checked via a `onegolf-welcomed` cookie set on first load), redirect to `/dashboard`. This prevents re-showing welcome on back-navigation without blocking the first genuine visit.

---

### Screen 5 — Dashboard (`/dashboard`)

**Purpose:** Home base for the member portal. Out of scope for this spec.

**Minimum for this phase:** Page exists and renders. Full dashboard spec is separate.

---

### Login Page (`/login`)

**Purpose:** Returning user entry point.

**Layout:**
- "Continue with Google" button
- Divider
- Email + Password fields
- "Sign in" button
- Footer: "Don't have an account? Get started →" → `/pricing`
- Forgot password link → Supabase password reset flow (`supabase.auth.resetPasswordForEmail`)

**Behaviour:** On successful login, redirect to `/dashboard`. proxy.ts guards member routes and redirects unauthenticated users here.

---

## Architecture

### Route Groups & Files

```
app/
├── (public)/
│   ├── pricing/page.tsx           → Screen 1
│   ├── signup/page.tsx            → Screen 2
│   ├── auth/
│   │   └── callback/route.ts      → OAuth callback handler
│   ├── login/page.tsx             → Login
│   └── welcome/page.tsx           → Screen 4
├── (member)/
│   └── dashboard/page.tsx         → Screen 5 (stub)
```

### Server Actions (`actions/auth.ts`)

- `signUpWithEmail(formData)` — signUp with `user_metadata.role: 'member'`, insert users row, create Stripe customer, create checkout session, return checkout URL
- `signInWithEmail(formData)` — signInWithPassword, return redirect to /dashboard
- `signInWithGoogle(plan)` — set `onegolf-pending-plan` cookie, initiate Supabase OAuth
- `createCheckoutSession(userId, stripeCustomerId, tier)` — create Stripe Checkout Session, return URL

### Schema Change

In `lib/db/schema.ts`, change `creditLedger.referenceId` from `uuid` to `text`:
```ts
referenceId: text('reference_id'),
```
Run `npx drizzle-kit push` after the change.

---

## Data Flow

### Email/Password Path
```
User fills signup form
  → signUpWithEmail() Server Action
  → supabase.auth.signUp({ user_metadata: { role: 'member', full_name } })
  → db.insert(users, { id, email, fullName })
  → stripe.customers.create({ email, metadata: { userId } })
  → db.update(users, { stripeCustomerId })
  → stripe.checkout.sessions.create({ customer, metadata: { userId }, ... })
  → redirect to Stripe Checkout URL

User pays on Stripe
  → Stripe fires checkout.session.completed
  → handleCheckoutCompleted(): links stripeSubscriptionId on user row
  → Stripe fires invoice.paid
  → handleInvoicePaid(): idempotency check → inserts SUBSCRIPTION_GRANT ledger row

User redirected to /welcome
  → polls getCreditBalance(userId) every 2s
  → sets onegolf-welcomed cookie
  → user clicks Start Booking → /dashboard
```

### Google OAuth Path
```
User clicks "Continue with Google"
  → Set onegolf-pending-plan cookie
  → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
  → Google OAuth flow

Google redirects to /auth/callback
  → exchangeCodeForSession(code)
  → supabase.auth.admin.updateUserById(userId, { user_metadata: { role: 'member' } })
  → db.upsert(users, { id, email, fullName })
  → Read onegolf-pending-plan cookie for tier
  → stripe.customers.create(...) [skip if already exists]
  → db.update(users, { stripeCustomerId })
  → stripe.checkout.sessions.create(...)
  → Delete onegolf-pending-plan cookie
  → redirect to Stripe Checkout URL
  (same webhook flow as email path)
```

---

## Components Needed

| Component | Type | Description |
|-----------|------|-------------|
| `PricingTierRow` | Client Component | Single row in stacked pricing list, selectable |
| `PricingPage` | Server Component | Reads tiers from DB, renders 3 PricingTierRows |
| `SignupForm` | Client Component | react-hook-form + Zod, Google OAuth button, calls signUpWithEmail |
| `LoginForm` | Client Component | Same pattern, calls signInWithEmail |
| `WelcomePage` | Client Component | Polls credit balance, animated counter, sets welcomed cookie |

All use shadcn/ui primitives (Button, Input, Label, Card).

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Stripe checkout abandoned | User lands on `/signup?plan=<tier>` (cancel_url). Supabase account + Stripe customer exist but no subscription — safe, they can retry. |
| Webhook delayed | Welcome page polls every 2s for up to 10s, then shows "Taking a moment..." with manual refresh. |
| Duplicate invoice.paid webhook | Idempotency guard checks for existing ledger row with same invoice ID. Second delivery is a no-op. |
| Duplicate signup email | Supabase returns error, shown inline: "An account with this email exists. Sign in →" |
| Google OAuth: plan cookie missing | Default to `'core'`. User can change plan after signup. |
| Google OAuth error | Redirect back to `/signup`, show error message. |
| user_metadata.role not set | proxy.ts redirects to `/signup` — prevented by setting role at creation time and in OAuth callback. |

---

## Verification

1. Run `npm run dev`
2. Navigate to `/pricing` — see 3 stacked tier rows with correct credits (100 / 150 / 210)
3. Click "Core" → lands on `/signup?plan=core`
4. Sign up with email → redirected to Stripe Checkout (test mode)
5. Use Stripe test card `4242 4242 4242 4242` → completes checkout
6. Redirected to `/welcome` — shows 150 credits (Core tier)
7. Click "Start Booking" → lands on `/dashboard`
8. Navigate back to `/welcome` → immediately redirected to `/dashboard` (welcomed cookie set)
9. Sign out, navigate to `/login`, sign in → lands on `/dashboard`
10. Test Google OAuth: click "Continue with Google" on `/signup?plan=casual`, complete OAuth, verify Stripe checkout opens for Casual ($99), complete payment, verify 100 credits on welcome screen
11. Supabase Table Editor: `users` row has `stripe_customer_id`, `subscription_tier: 'core'`, `subscription_status: 'active'`
12. Supabase Table Editor: `credit_ledger` has exactly one `SUBSCRIPTION_GRANT` row (idempotency verified by re-replaying webhook and confirming no duplicate)
13. Supabase Auth: user has `user_metadata.role: 'member'`
