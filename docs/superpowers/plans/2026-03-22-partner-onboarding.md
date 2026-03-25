# Partner Onboarding — Build Plan

**Date:** 2026-03-22
**Project:** Gimmelab
**Sub-project:** Partner Onboarding Flow
**Status:** Approved for Build

---

## Context

There is currently no self-serve partner signup. The only way to create a partner account is to manually set `"role": "partner"` in Supabase Auth user metadata. This is not scalable and blocks partner acquisition.

This plan delivers a full self-serve partner onboarding flow — from landing page through course setup to going live — without requiring any admin intervention for standard partners.

---

## Route Map

```
/partner/apply                      — Landing + intro (pre-auth)
/partner/apply/signup               — Step 1: Account creation
/partner/onboarding/course          — Step 2: Course profile
/partner/onboarding/pricing         — Step 3: Credit rate setup
/partner/onboarding/payout          — Step 4: Stripe Connect
/partner/onboarding/slots           — Step 5: First inventory
/partner/onboarding/live            — Step 6: Confirmation + go live
/partner/dashboard                  — Existing partner portal
```

All `/partner/onboarding/*` routes require the user to be authenticated with `role: partner` (set at signup). Unauthenticated users hitting these routes redirect to `/partner/apply/signup`.

---

## Files to Create

| Action | File | Purpose |
|--------|------|---------|
| Create | `app/(partner)/apply/page.tsx` | Landing page (public — no auth) |
| Create | `app/(partner)/apply/signup/page.tsx` | Account creation form |
| Create | `app/(partner)/onboarding/layout.tsx` | Shared stepper shell |
| Create | `app/(partner)/onboarding/course/page.tsx` | Course profile form |
| Create | `app/(partner)/onboarding/pricing/page.tsx` | Credit rate setup |
| Create | `app/(partner)/onboarding/payout/page.tsx` | Stripe Connect flow |
| Create | `app/(partner)/onboarding/slots/page.tsx` | First slot entry |
| Create | `app/(partner)/onboarding/live/page.tsx` | Confirmation screen |
| Create | `components/partner/onboarding-stepper.tsx` | Step indicator component |
| Create | `components/partner/discount-rate-calculator.tsx` | Rack rate + Gimmelab rate inputs, live tier unlock UI |
| Create | `actions/partner/create-partner.ts` | Server Action: create partner record |
| Create | `actions/partner/connect-stripe.ts` | Server Action: initiate Stripe Connect |
| Create | `actions/partner/save-course.ts` | Server Action: upsert course profile |
| Create | `actions/partner/create-slots.ts` | Server Action: bulk-insert initial slots |
| Update | `proxy.ts` | Add `/partner/apply` to public routes |
| Update | `lib/db/schema.ts` | Add `onboarding_complete`, rename `green_fee_cents` → `rack_rate_cents`, add `gimmelab_rate_cents`, `payout_rate` snapshot, `verification_queue` table |

---

## Task 1: Apply Landing Page (`/partner/apply`)

Public route — no auth required. Purpose: convert a course operator who heard about Gimmelab into someone who clicks "Apply".

### What to build

- Hero section: headline + value prop + CTA
- "How it works" — 3 numbered steps (apply → set rate → get bookings)
- Earnings calculator: enter your rack rate → see estimated monthly revenue at different booking volumes
- CTA repeats at bottom: "Apply to list your course"
- Clicking CTA → `/partner/apply/signup`

### Copy

- Headline: **"Sell tee times. Get paid monthly."**
- Sub: "Gimmelab connects your open slots with 1,000+ golfers in your area. No commissions. A flat rate per booking you set yourself."
- CTA label: **"List Your Course"**

### No auth check needed. Route stays public in `proxy.ts`.

---

## Task 2: Partner Signup (`/partner/apply/signup`)

Account creation specifically for course operators. Sets `role: 'partner'` at creation.

### What to build

```tsx
// Behaviour — email/password path:
// 1. supabase.auth.signUp({ email, password, options: { data: { full_name, role: 'partner' } } })
// 2. Insert `users` row with role: 'partner'
// 3. Insert `partners` row: { user_id, contact_name, onboarding_complete: false }
// 4. Create Stripe Customer (for future Connect link)
// 5. Redirect → /partner/onboarding/course
```

### Form fields

- Full name (contact person at the course)
- Email address
- Password (min 8 chars)
- CTA: "Create Partner Account"
- Footer: "Already have a partner account? Sign in →" (links to /login?role=partner)

### Validation (Zod)

```ts
const partnerSignupSchema = z.object({
  fullName: z.string().min(2, 'Name required'),
  email:    z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters'),
})
```

### Server Action: `createPartnerAccount()`

```ts
// actions/partner/create-partner.ts
export async function createPartnerAccount(data: PartnerSignupInput) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { full_name: data.fullName, role: 'partner' } }
  })
  if (error) throw new Error(error.message)

  await db.insert(users).values({
    id: authData.user!.id,
    email: data.email,
    fullName: data.fullName,
    role: 'partner',
  })

  await db.insert(partners).values({
    userId: authData.user!.id,
    contactName: data.fullName,
    onboardingComplete: false,
  })

  redirect('/partner/onboarding/course')
}
```

---

## Task 3: Onboarding Layout + Stepper

A shared layout wrapping all `/partner/onboarding/*` routes. Shows the step indicator at the top and the current step content below.

### Stepper steps

```
1  Course Profile
2  Set Your Rate
3  Connect Payout
4  Add First Slots
5  Go Live
```

### Layout shell

```tsx
// app/(partner)/onboarding/layout.tsx
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C0C0B]">
      <OnboardingNav />           {/* gimilab wordmark + "Partner Setup" label */}
      <OnboardingStepper />       {/* step 1–5 indicator */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        {children}
      </main>
    </div>
  )
}
```

### Stepper component

```tsx
// components/partner/onboarding-stepper.tsx
// Props: currentStep (1–5)
// Renders: horizontal row of numbered steps
// Active step: amber circle + white label
// Completed step: filled amber circle + checkmark
// Upcoming step: stone circle + stone label
// Connecting line between steps: smoke color, filled amber up to current
```

---

## Task 4: Course Profile (`/partner/onboarding/course`)

Collects the course's public profile.

### Form fields

```
Course Name          — text input (required)
Course Type          — select: Municipal · Semi-Private · Private · Resort
Number of Holes      — select: 9 · 18 · 27 · 36
Par                  — number input (e.g. 72)
Address Line 1       — text
City                 — text
State                — select (US states)
ZIP                  — text
Phone Number         — text
Website              — url input (optional)
Course Description   — textarea, max 280 chars ("Describe your course in 2–3 sentences")
```

### Server Action: `saveCourseProfile()`

```ts
// actions/partner/save-course.ts
// Upserts the `courses` table row for this partner
// On success: redirect('/partner/onboarding/pricing')
```

---

## Task 5: Discount Rate Setup (`/partner/onboarding/pricing`)

This is the most important step — the partner sets both their standard walk-up rack rate and their Gimmelab rate. The discount between the two determines their commission tier.

**Mental model:** 1 credit = $1 of perceived value to the member. The partner sets their Gimmelab rate in dollars; the system converts 1:1 to credits. The commission Gimmelab retains is determined by the discount tier the partner unlocks — deeper discounts reward the partner with a higher payout percentage.

### Commission tier model

| Discount off rack rate | Gimmelab commission | Partner keeps |
|---|---|---|
| 10–19% | 15% | 85% |
| 20–29% | 13% | 87% |
| 30%+ | 10% | 90% |

Minimum required discount: 10%. Partners cannot proceed with a Gimmelab rate within 10% of their rack rate. This is enforced client-side (button disabled) and server-side (validation in the Server Action).

Maximum Gimmelab rate: **$150/slot**. If a partner enters a rate above $150, show an amber warning. Rates above this threshold are flagged for manual review before going live (see Rack Rate Verification below).

### Interactive calculator component

```tsx
// components/partner/discount-rate-calculator.tsx
// Inputs:
//   - rack_rate: partner's standard walk-up price
//   - gimmelab_rate: their Gimmelab price (must be ≥10% off rack)
// Computes live:
//   - discount_pct = ((rack - gimmelab) / rack) × 100
//   - commission_tier: 1 (85%), 2 (87%), or 3 (90%) based on discount_pct
//   - payout_per_booking = gimmelab_rate × keep_pct
//   - member_saves = rack - gimmelab (shown as "Member saves $X vs walk-up")
//   - Credits charged to member: gimmelab_rate (1:1)
//   - Who can book: rounds per tier (100/170/250 credits ÷ gimmelab_rate)
//   - Est. monthly revenue at 20/50/100 bookings using actual keep_pct
//
// UI: Three tier cards (Starter / Plus / Pro) that visually unlock
// as discount_pct increases. Locked tiers fade. Active tier has Amber border.
// Progress bar fills from 0→40% discount range.
```

### Fields

- **Your standard walk-up rate** — number input, $USD. What a walk-in pays at the course.
- **Your Gimmelab rate** — number input, $USD, must be ≥10% below rack rate, max $150
- Discount % badge on Gimmelab rate field updates live (green when valid, amber when not)
- Error state if discount < 10%: red banner, "Continue" button disabled
- "Preview" card updates live without submit

### Server Action: `saveRate(courseId, rackRateCents, gimmelabRateCents)`

```ts
// actions/partner/save-rate.ts
export async function saveRate(courseId: string, rackRateCents: number, gimmelabRateCents: number) {
  const discountPct = ((rackRateCents - gimmelabRateCents) / rackRateCents) * 100

  // Enforce minimum discount server-side
  if (discountPct < 10) {
    throw new Error('Gimmelab rate must be at least 10% below rack rate')
  }

  // Compute payout rate from discount tier
  const payoutRate = discountPct >= 30 ? 0.90 : discountPct >= 20 ? 0.87 : 0.85

  await db.update(courses)
    .set({
      rackRateCents,
      gimmelabRateCents,
      // payoutRate stored for reference — actual payout_rate is snapshotted per booking
    })
    .where(eq(courses.id, courseId))

  // Flag for rack rate verification if rate is high
  if (gimmelabRateCents > 15000) { // > $150
    await db.insert(verificationQueue).values({
      courseId,
      reason: 'gimmelab_rate_above_cap',
      createdAt: new Date(),
    })
  }

  redirect('/partner/onboarding/payout')
}
```

### Payout rate snapshot (bookings table)

The commission tier must be snapshotted at booking time, not read dynamically from the partner record. Add a `payout_rate` column to `tee_time_bookings`:

```ts
// On every booking created:
const discountPct = ((course.rackRateCents - course.gimmelabRateCents) / course.rackRateCents) * 100
const payoutRate = discountPct >= 30 ? 0.90 : discountPct >= 20 ? 0.87 : 0.85

await db.insert(teeTimeBookings).values({
  ...bookingData,
  payoutRate, // snapshotted — not recalculated retroactively
  partnerEarningsCents: Math.round(course.gimmelabRateCents * payoutRate),
})
```

This means if a partner changes their rate mid-month, only future bookings are affected. Prior bookings honour the rate in effect when they were made.

---

## Rack Rate Verification

Partners self-report their walk-up rack rate. Since the commission tier is derived from `(rack - gimmelab) / rack`, an inflated rack rate lets a partner claim a better tier without genuinely discounting.

### Verification approach

**Do not block onboarding.** Partners proceed normally. Verification runs in the background and queues suspicious discrepancies for manual review.

**Trigger scrape when:**
- A new partner saves their rack rate during onboarding
- A partner updates their rack rate from the dashboard
- The `tier_verified_at` timestamp is older than 90 days

**Flag for review when:**
- Scraped price differs from partner-entered rack rate by >20%
- Partner-entered rack rate is unusually low (< $30 — possible sandbagging to look like a big discounter)
- Gimmelab rate > $150

**Review queue:** Admin sees flagged partners in `/admin/verification`. Can approve (no action), correct the rack rate manually, or contact the partner. Partner is never automatically downgraded — a human makes the call.

```ts
// Schema additions for verification:
tierVerifiedAt:  timestamp('tier_verified_at'),                    // last scrape date
verificationStatus: text('verification_status').default('pending') // 'pending' | 'verified' | 'flagged'
```

---

## Task 6: Stripe Connect (`/partner/onboarding/payout`)

Partners must connect a bank account to receive payouts. Uses Stripe Connect (Express accounts).

### Flow

```
1. Partner clicks "Connect Bank Account"
2. Server Action calls stripe.accounts.create({ type: 'express', ... })
3. Server Action calls stripe.accountLinks.create({ account: id, refresh_url, return_url })
4. Redirect to Stripe-hosted onboarding URL
5. On return_url (/partner/onboarding/payout?status=connected):
   — Store stripeConnectAccountId on partners row
   — Show success state
   — CTA: "Continue to Inventory →"
```

### Server Action: `initiateStripeConnect()`

```ts
// actions/partner/connect-stripe.ts
export async function initiateStripeConnect(partnerId: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    metadata: { partnerId },
  })

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${APP_URL}/partner/onboarding/payout`,
    return_url:  `${APP_URL}/partner/onboarding/payout?status=connected`,
    type: 'account_onboarding',
  })

  await db.update(partners)
    .set({ stripeConnectAccountId: account.id })
    .where(eq(partners.id, partnerId))

  redirect(link.url)
}
```

### Skip option

"Set up payout later" link — lets partner continue but shows a banner in `/partner/dashboard` until Stripe Connect is complete. Payouts are held until connected.

---

## Task 7: First Slots (`/partner/onboarding/slots`)

Partners add their first available tee time slots to give the platform inventory immediately.

### Two entry modes (toggle)

**Mode A — Quick add (recommended for onboarding)**
- Day of week checkboxes (Mon–Sun)
- Start time + End time
- Interval (every 10 / 15 / 20 minutes)
- Date range: "Starting from" + "For the next X weeks" (default: next 4 weeks)
- Preview: "This will create 48 slots"
- CTA: "Generate Slots"

**Mode B — Manual add**
- Date picker + time input
- "Add another" → adds row
- Table preview of all entries
- CTA: "Save Slots"

### Server Action: `createInitialSlots()`

```ts
// actions/partner/create-slots.ts
// Materialises tee_time_slots rows from the quick-add parameters
// status: 'available', partnerId, courseId, creditsRequired = floor(rateInCents / 100)
// On success: redirect('/partner/onboarding/live')
```

### Skip option

"Skip for now — I'll add slots from my dashboard" → redirect directly to `/partner/onboarding/live`.

---

## Task 8: Go Live Confirmation (`/partner/onboarding/live`)

Final screen. Sets `partners.onboarding_complete = true`.

### What to show

- Large checkmark animation (Motion)
- "You're live on Gimmelab."
- Summary card: course name, rate per slot, number of slots added
- Stripe Connect status (connected or pending)
- CTA: "Open Your Dashboard →" → `/partner/dashboard`
- Secondary: "Share your listing" — copy link to course page

### Server Action on page load

```ts
await db.update(partners)
  .set({ onboardingComplete: true })
  .where(eq(partners.userId, userId))
```

---

## Proxy Updates

```ts
// proxy.ts — add to public routes (no auth required):
'/partner/apply',
'/partner/apply/signup',
```

All `/partner/onboarding/*` routes require `role: partner`. If user has `role: member`, redirect to `/dashboard`.

---

## Database Changes

```ts
// lib/db/schema.ts

// ── partners table additions ──────────────────────────────────────────────
onboardingComplete:     boolean('onboarding_complete').default(false).notNull(),
stripeConnectAccountId: text('stripe_connect_account_id'),
tierVerifiedAt:         timestamp('tier_verified_at'),
verificationStatus:     text('verification_status').default('pending'),
//                      'pending' | 'verified' | 'flagged'

// ── courses table: rename + add ───────────────────────────────────────────
// RENAME: green_fee_cents  →  rack_rate_cents  (partner-entered walk-up price)
rackRateCents:          integer('rack_rate_cents').notNull(),
gimmelabRateCents:      integer('gimmelab_rate_cents').notNull(),
//                      Must satisfy: (rack - gimmelab) / rack >= 0.10
//                      Max: 15000 (= $150). Above this → verification queue.

// ── tee_time_bookings table: add payout snapshot ──────────────────────────
payoutRate:             numeric('payout_rate').notNull(),
//                      Snapshotted at booking time: 0.85, 0.87, or 0.90
//                      Never recalculated retroactively.
partnerEarningsCents:   integer('partner_earnings_cents').notNull(),
//                      = gimmelabRateCents × payoutRate, stored for payout reports

// ── verification_queue table (new) ────────────────────────────────────────
export const verificationQueue = pgTable('verification_queue', {
  id:        uuid('id').defaultRandom().primaryKey(),
  courseId:  uuid('course_id').references(() => courses.id),
  reason:    text('reason'),  // 'gimmelab_rate_above_cap' | 'rack_rate_discrepancy' | 'low_rack_rate'
  status:    text('status').default('open'),  // 'open' | 'resolved'
  createdAt: timestamp('created_at').defaultNow(),
})
```

Run: `npx drizzle-kit push` after schema change.

---

## Build Order

1. Schema migration (`onboarding_complete`, `stripeConnectAccountId`, rename `green_fee_cents` → `rack_rate_cents`, add `gimmelab_rate_cents`, `payout_rate` on bookings, `verification_queue` table)
2. `proxy.ts` update (make `/partner/apply` public)
3. Onboarding layout + stepper component
4. Step 1: Apply landing page
5. Step 2: Partner signup action + form
6. Step 3: Course profile form + save action
7. Step 4: Discount rate calculator + `saveRate()` server action (rack + gimmelab rate, tier logic)
8. Step 5: Stripe Connect action
9. Step 6: Slot creation form + action
10. Step 7: Live confirmation screen
11. Background: rack rate verification queue (scraping job + admin `/admin/verification` view)

---

## Google Places Autocomplete (Course Name Field)

The course name input on Step 1 uses the **Google Maps Places API** to auto-fill the entire course profile when a partner starts typing.

### What it fills automatically
- Course name, street address, city, state, ZIP
- Phone number, website
- Up to 10 photos (first shown as a preview in the form)

### Setup required
1. Enable **Maps JavaScript API** + **Places API** in Google Cloud Console
2. Add API key to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
   ```
3. Load the script in the page:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places" async defer></script>
   ```
4. Initialize `google.maps.places.Autocomplete` on the input, filtering by `types: ['establishment']` and `componentRestrictions: { country: 'us' }`.
5. Request fields: `['name', 'formatted_address', 'address_components', 'formatted_phone_number', 'website', 'photos']`

### Cost note
Places API charges per autocomplete session (~$0.017 per session). At typical partner onboarding volume, this will be negligible. Set a billing cap in Google Cloud Console.

---

## What's Not Included (Phase 2)

- Admin approval gate before partner goes live (currently auto-approved)
- Partner agreement / T&C acceptance checkbox
- Photo upload for course profile images
- Custom availability rules (blackout dates, seasonal pricing)
- Automated email confirmation on signup
