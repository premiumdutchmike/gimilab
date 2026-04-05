# Partner Experience Audit

**Date:** 2026-04-05
**Owner:** Mike
**Method:** Code read-through of every partner route (apply → onboarding → portal), trace of the full onboarding state machine, Playwright screenshots of every partner route at 1280×900 (both logged-out to capture the unauthed redirect, and the public-facing landing pages).
**Scope:** Can a new course operator self-serve onto Gimmelab today without you holding their hand? Are the partner-portal pages functional after onboarding? Does the flow hold up end-to-end?

**TL;DR:** The partner side is ~80% built and surprisingly solid — the data layer exists (`lib/partner/queries.ts` has all 8 queries), the onboarding wizard has a real state machine (`lib/partner/get-onboarding-step.ts`), the analytics page and earnings calculator are polished. But there are **three P0 bugs that silently block partner acquisition and four more that threaten data integrity**. All fixable in a single work session.

---

## P0 — Blocking partner acquisition or corrupting data

### #1 — `/partners` lead-gen page is behind auth (runtime-verified)

**What:** `app/(public)/partners/page.tsx` is a 1049-line marketing landing page. It should be the top of the partner funnel — the URL an outreach email or LinkedIn post points to. But `proxy.ts:37` whitelists `/partner` and `/partner/apply` and misses `/partners` (plural). Hitting `/partners` logged-out redirects to `/login?redirectTo=/partners` — a consumer login form with no partner context.

**Impact:** Every cold link to your public partner marketing is broken. A golf course operator clicks from an outreach email, lands on the member sign-in screen, thinks this isn't for them, closes the tab. You are paying (in time, in outreach spend, in SEO) for traffic to a page no visitor can see.

**Fix:** Add `/partners` to the `publicPaths` list in `proxy.ts`. One line. **10-second fix.**

### #2 — `/partner/onboarding/live` writes + sends email on every GET

**What:** `app/(onboarding)/partner/onboarding/live/page.tsx:26` calls `await setPartnerLive()` unconditionally on every GET. Inside that action (`actions/partner/set-live.ts`), it:
  - Sets `partner.onboardingComplete = true`
  - Sends the "your course is live" email via Resend

There's no idempotency guard anywhere. Every refresh of the page re-runs the write and re-sends the email.

**Impact:** Three concrete bugs in one:
  1. **Email spam:** A partner who refreshes the page during excited testing gets 2-5 emails. In production this is embarrassing.
  2. **Next.js 16 anti-pattern:** Side effects in Server Component renders violate idempotency. Strict mode fires them twice in dev; revalidation fires them on future cache invalidations.
  3. **Guard bypass:** Any authenticated partner can navigate directly to `/partner/onboarding/live` and become `onboardingComplete = true` regardless of whether they've completed course/pricing/slots. The state machine in `get-onboarding-step.ts` gates the *next step* but doesn't gate *this page*.

**Fix:**
  1. Move `setPartnerLive()` out of the Server Component render. Either (a) call it from `actions/partner/create-slots.ts` as the final transition (cleanest — slots is the last real step), or (b) put a Server Action button on the live page that the partner clicks to confirm.
  2. Add an idempotency guard inside `setPartnerLive()`: `if (partner.onboardingComplete) return { alreadyLive: true }`.
  3. Add the guard chain used in the other onboarding pages (course → pricing → slots exist) before allowing `/live` to render.

### #3 — Partner dashboard stats are hardcoded zeros

**What:** `app/(partner)/partner/dashboard/page.tsx:18-23` has:

```ts
const stats = [
  { label: 'Total bookings', value: '0' },
  { label: 'This week', value: '0' },
  { label: 'Active slots', value: '0' },
  { label: 'Revenue', value: '$0' },
]
```

The page renders these literal values. No DB queries. Meanwhile `lib/partner/queries.ts` already exports `getPartnerAnalytics()`, `getPartnerBookings()`, `getUpcomingSlots()` — the data layer is *already there*.

**Impact:** A partner completes onboarding and lands on a dashboard that always shows four zeros. They can't tell if bookings are coming in, if any members have played their course, if revenue is accumulating. The dashboard is the central nervous system of the portal and it's flatlined. Also: this is the *first screen* a partner sees after the emotional high of completing onboarding. The product feels fake.

**Fix:** Replace the hardcoded array with real queries:

```ts
const analytics = await getPartnerAnalytics(partner.id)
const upcomingSlots = await getUpcomingSlots(course.id)
const stats = [
  { label: 'Total bookings', value: String(analytics.totals.bookingCount) },
  { label: 'This week', value: String(analytics.thisWeekBookingCount) },  // may need to add to getPartnerAnalytics
  { label: 'Active slots', value: String(upcomingSlots.length) },
  { label: 'Revenue', value: formatCents(analytics.totals.revenueCents) },
]
```

`getPartnerAnalytics()` already returns `totals.bookingCount` and `totals.revenueCents`. Only new work is a "this week" sub-query, which is trivial. **30-minute fix.**

---

## P1 — Visible quality / correctness issues

### #4 — Partner portal is on the old dark theme, not the current design system

**What:** `app/(partner)/layout.tsx:38` uses `bg-[#090f1a]`. `dashboard/page.tsx` uses `text-yellow-400`, `bg-[#090f1a]`, and Tailwind utility classes. These are the **pre-redesign** colors from the original CLAUDE.md ("bg #090f1a, surface #0f1923, accent green #4ade80, sky blue #38bdf8").

The rest of the product moved to the cream/midnight/amber palette months ago — `/courses`, the homepage, the booking flow, the guest booking confirmation emails, everything. The partner portal is stuck on the old theme.

**Impact:** A partner sees a completely different-looking product than their customers see. If they ever visit `/courses/<their-course>` they'll think it's a different company. Also hurts the brand-cohesion argument when you're pitching new partners.

**Fix:** Swap palette across `(partner)/**/*.tsx` and `components/partner-nav.tsx`. Midnight background, linen text, amber accents. Medium effort — probably 2-3 files of CSS-in-JS to rewrite.

### #5 — Two parallel partner landing pages that don't know about each other

**What:** `/partners` (1049 lines, in `(public)`) and `/partner/apply` (214 lines, in `(apply)`) are both partner-facing marketing pages. Both pitch the value prop. Neither links to the other. Neither is marked canonical. Both have their own nav, hero, CTA.

**Impact:** SEO confusion, content drift (updates to one won't propagate to the other), users who find one don't know about the other. Also — why does the `(apply)` version exist at all? Probably a legacy from an earlier iteration.

**Fix:** Decide one canonical. My recommendation: keep `/partners` as the top-of-funnel marketing page (SEO-friendly URL, fits the plural pattern of `/courses`), repoint its CTAs to `/partner/apply/signup`, and either delete `/partner/apply` or convert it to a shorter "apply now" form that comes after the `/partners` pitch. Related finding: fix #1 first so `/partners` is actually reachable.

### #6 — Unauthed partner routes redirect to `/login` instead of `/partner/apply/signup`

**What:** `proxy.ts:49` sends any unauthed partner-portal hit to `/login?redirectTo=<path>`. A course operator who clicks a link to `/partner/onboarding/course` (e.g. from an onboarding email you send them) lands on the **member** login page. There's no distinction between "this user is a golfer" and "this user is a course operator who is probably not yet registered."

**Impact:** Conversion leak. A partner clicks an email → lands on a page that looks like it's for the wrong audience → assumes they were sent the wrong link. Also a bad first impression because it's the consumer-facing login, not a partner-branded one.

**Fix:** In the proxy, detect `pathname.startsWith('/partner/')` (excluding `/partner/apply` which is already public) and redirect unauthed users to `/partner/apply/signup?redirectTo=<path>` instead of `/login`. Small logic branch in `proxy.ts:46-51`.

### #7 — `/partner/checkin` missing from the route whitelist

**What:** `proxy.ts:70-79` enumerates partner routes for role gating: `dashboard, inventory, bookings, pricing, payouts, analytics, profile, settings, course, onboarding`. Missing: `/partner/checkin`. So the role check at line 89 (`if (isPartnerRoute && role !== 'partner' && role !== 'admin')`) doesn't fire for it.

**Impact:** Defense-in-depth is broken. A member or someone with no role can hit `/partner/checkin` and only the page's own auth check (not the centralized role guard) stops them. Probably not catastrophic — the page is likely just a QR scanner — but a security audit will flag it.

**Fix:** Add `|| pathname.startsWith('/partner/checkin')` to the `isPartnerRoute` condition.

### #8 — `live/page.tsx` shows a partner-computed slug as "your public URL"

**What:** `app/(onboarding)/partner/onboarding/live/page.tsx:45` computes `slug = courseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(...)` locally and passes it to the `<LiveScreen>` component. But the actual `courses.slug` column in the DB may be different (manually edited, or set during a race condition where `save-course.ts` generated it from a different field).

**Impact:** The partner is shown a "your course is now live at gimmelab.com/courses/<slug>" link that may 404 or point to the wrong page. Small bug but embarrassing on a celebration screen.

**Fix:** Pass `course.slug` from the DB row through to `LiveScreen` instead of computing it client-side.

---

## P2 — Polish

### #9 — Stepper labels are correct; I initially flagged as mismatched
Documented in my notes for posterity: the stepper says `Course Profile → Rate Setup → Payout → Add Slots → Go Live` which is consistent with the actual flow (`/course → /pricing → /payout → /slots → /live`). "Rate Setup" = `/pricing` which sets `gimmelabRateCents`. **Not a bug, but worth renaming `/pricing` to `/rate` or the stepper label to "Pricing" so file paths match label for future devs.**

### #10 — `setPartnerLive()` fires emails with no try/catch
`set-live.ts:27-40` calls `sendEmail()` in a fire-and-forget pattern but without a try/catch. If Resend is down, the unhandled rejection crashes the Server Component render. Low probability, high consequence. Wrap in try/catch with a `console.error` fallback (matches the pattern in `actions/booking.ts`).

### #11 — Dashboard doesn't render the `pending` approval banner at all when no bookings exist
The banner on line 27-31 shows when `course.status === 'pending'`, which is correct. But if `course.status === 'active'` and there's no data, the page shows zero stats and no explanation. First-time partners deserve empty-state messaging: *"No bookings yet. You'll see activity here as members book your course."*

### #12 — No partner-facing "today's tee sheet" view
The `checkin` page exists but nothing surfaces "who's walking in today" on the dashboard. Per my earlier concern — if a partner can't see their incoming bookings at a glance, they'll hate the product. Low priority because the partner booking notification emails cover it, but worth adding a "Today's bookings" section to the dashboard once the hardcoded stats are fixed (finding #3).

---

## What's actually working well

Worth calling out so we don't over-pessimize:

- **Data layer is done.** `lib/partner/queries.ts` has 8 real cached queries covering every use case: partners, courses, blocks, bookings, payouts, analytics, upcoming slots.
- **State machine is clean.** `lib/partner/get-onboarding-step.ts` is ~40 lines, explicit comments, correctly handles Stripe-skippable. Reads like production code.
- **Analytics page is wired up** (ironically, more so than the dashboard). Real queries, monthly breakdown, formatted currency.
- **Earnings calculator on `/partner/apply`** is a polished interactive slider with live-updating payout math. Good sales tool.
- **Stripe Connect Pending banner** in the portal layout is a nice touch — partners who skip payout get a persistent reminder.
- **Onboarding guards cascade correctly** for the pages that have them (course → pricing → payout check `course.gimmelabRateCents`, slots checks `course` exists). Only `live` is missing its chain.
- **Partner server actions are in a dedicated folder** (`actions/partner/*.ts`), well-organized, one file per concern.

---

## Recommended execution plan

If you want to ship the P0s in one session:

1. **5 min** — Fix #1: add `/partners` to `publicPaths` in proxy. Immediate unblock.
2. **30 min** — Fix #3: wire the dashboard to real queries via `getPartnerAnalytics()` + new `thisWeek` sub-query. Test with a seeded partner if possible.
3. **45 min** — Fix #2 in three parts: (a) add idempotency guard to `setPartnerLive()`, (b) move the call out of the Server Component render into either `create-slots.ts` or a Server Action button on the live page, (c) add guard chain to `live/page.tsx` matching the pattern in `payout/page.tsx`.
4. **10 min** — Fix #6 and #7 in proxy.ts: redirect unauthed partner routes to `/partner/apply/signup` instead of `/login`, add `/partner/checkin` to the route whitelist.
5. **5 min** — Fix #8: pass `course.slug` through to `LiveScreen` instead of recomputing.

**Total: ~95 minutes of focused work for all 5 P0/P1 fixes except #4 (palette swap) and #5 (landing page dedup), which are bigger.**

The palette swap (#4) is the biggest remaining item and probably deserves its own session — it touches 10+ files and needs its own screenshot review to avoid regressions.

---

## Not in scope for this audit

- Partner-side responsive (the responsive round 1 explicitly scoped to the public funnel; partner portal will need its own round)
- Actually filling the `/partner/checkin` QR scanner page with real functionality (I only verified it's 7 lines — didn't open it)
- Admin routes (`/admin/*`) — separate audit
- The `verificationQueue` table and its flow (mentioned in CLAUDE.md for admin review of partner-submitted rates — haven't traced that path)
