# Partner Onboarding — Design Spec

**Date:** 2026-03-22
**Project:** Gimmelab
**Sub-project:** Partner Onboarding Flow
**Status:** Approved for Design + Build

---

## Design Principles for This Flow

This onboarding is B2B. The person completing it is a course manager or owner — not a golfer browsing. Design accordingly:

- **Confident, not salesy.** The landing page sells the value once, clearly. No repeated CTAs, no countdown timers.
- **Respect their time.** Every step has one job. No step asks for more than it needs.
- **Show the math.** Course operators think in dollars. Surface the earnings calculator early and often.
- **Light throughout.** The landing page and onboarding shell use Linen background with white cards — matching the main website aesthetic. The nav bar remains dark Midnight. Amber is the sole accent colour.
- **Progress is visible.** The stepper is always present. They should always know where they are and what's next.

---

## Brand References (apply everywhere)

| Token | Value |
|-------|-------|
| Page background | `#F4EEE3` (Linen) |
| Card / surface | `#FFFFFF` (White) |
| Input background | `#FFFFFF` |
| Smoke section bg | `#E5DDD3` (Smoke) — used for alternating sections |
| Off-white section bg | `#FDFAF6` (Off-White) — reviews, secondary sections |
| Border / divider | `#D8D1C6` — visible on light backgrounds |
| Nav background | `#0C0C0B` (Midnight) — nav always dark |
| Primary text | `#0C0C0B` (Midnight) |
| Secondary text | `#847C72` (Stone) |
| Accent | `#BF7B2E` (Amber) |
| Success / discount badge | `#2E6B38` (Green) — discount valid, member savings |
| Error | `rgba(180,50,50,…)` — red tint for invalid rate |
| Heading font | Geist 700, `-0.025em` tracking |
| Body font | Geist 400, `15–16px` |
| Label font | Geist 600, `11px`, `uppercase`, `0.1em` tracking |
| Button radius | `2px` max — sharp corners |
| No shadows | Use background contrast + 1px borders only |

---

## Screen 0 — Apply Landing (`/partner/apply`)

**Purpose:** Convert a course operator into a signup. One CTA. No noise.

---

### Layout

```
┌─────────────────────────────────────────────────────┐
│  NAV: gimilab wordmark (left) · "Already a partner? Sign in →" (right, Stone) │
├─────────────────────────────────────────────────────┤
│                                                     │
│  HERO BLOCK  (Midnight bg, full viewport height)   │
│                                                     │
│  LABEL:  PARTNER WITH GIMMELAB                      │
│          Geist 600, 11px, uppercase, Amber          │
│                                                     │
│  H1:  "Sell tee times.                              │
│        Get paid monthly."                           │
│        Geist 700, clamp(42px,5vw,64px), Linen       │
│                                                     │
│  BODY:  "Gimmelab connects your open slots with     │
│          golfers in your region. You set the rate.  │
│          We handle bookings, payments, and payouts."│
│          Geist 400, 16px, Stone                     │
│                                                     │
│  CTA:  [ List Your Course → ]                       │
│         Amber bg, Off-White text, Geist 700         │
│         11px, uppercase, 0.1em tracking             │
│         padding: 14px 28px, border-radius: 2px      │
│         links to /partner/apply/signup              │
│                                                     │
├─────────────────────────────────────────────────────┤
│  HOW IT WORKS  (3 columns, Graphite bg, 80px py)   │
│                                                     │
│  01 · Apply             02 · Set Your Rate          │
│  Create your course     You control the credit      │
│  profile in minutes.    price per slot.             │
│                                                     │
│  03 · Get Bookings                                  │
│  Members book.          04 · Get Paid               │
│  You play host.         Monthly via Stripe Connect. │
│                                                     │
│  (4 items in 2×2 grid on mobile, 4-col on desktop) │
│                                                     │
├─────────────────────────────────────────────────────┤
│  EARNINGS CALCULATOR  (Midnight bg, 80px py)        │
│                                                     │
│  H2:  "See what you could earn"                     │
│       Geist 700, 32px, Linen                        │
│                                                     │
│  Input:  "Your rate per tee time"  [$  ___  ]       │
│          Amber outline input, Linen text            │
│                                                     │
│  Slider:  "Monthly bookings"  ——●——  [30]           │
│           Amber thumb, Smoke track                  │
│                                                     │
│  Output card (Graphite, Amber top border):          │
│   Monthly gross  ·  $___                            │
│   Gimmelab payout to you (85%)  ·  $___             │
│   Per-booking rate  ·  $___                         │
│                                                     │
│  "Numbers are estimates based on 85% payout rate." │
│   Stone, 11px                                       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  BOTTOM CTA                                         │
│  "Ready to list your course?"                       │
│  [ List Your Course → ]  (same Amber CTA)           │
├─────────────────────────────────────────────────────┤
│  FOOTER: gimilab · gimmelab.com · © 2026            │
└─────────────────────────────────────────────────────┘
```

### Notes

- The earnings calculator is a Client Component (`'use client'`). Inputs update the output card in real time with no server call.
- Formula: `gross = rate × bookings`, `payout = gross × 0.85`
- Default values: rate = $38, bookings = 30

---

## Screen 1 — Partner Signup (`/partner/apply/signup`)

**Purpose:** Create the partner account. One form. No distractions.

---

### Layout

```
┌─────────────────────────────────────────────────────┐
│  NAV: gimilab (left, Linen) — no links              │
│       "Step 0 of 5" label hidden here (pre-steps)   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CARD (Graphite, max-w-md, centred, 48px padding)  │
│                                                     │
│  LABEL:  PARTNER ACCOUNT                           │
│          Amber, 11px, uppercase                     │
│                                                     │
│  H1:  "Create your account"                         │
│        Geist 700, 28px, Linen                       │
│                                                     │
│  BODY:  "You'll use this to manage your course,     │
│          view bookings, and receive payouts."        │
│          Stone, 14px                                │
│                                                     │
│  ─────────────────────────────────────────          │
│                                                     │
│  FORM:                                              │
│  [ Full name            ]  ← Geist 400, 15px, Linen│
│  [ Email address        ]                           │
│  [ Password             ] 👁                        │
│                                                     │
│  Validation errors: Amber text, 12px, below field  │
│                                                     │
│  [ Create Partner Account → ]                       │
│    Full-width Amber CTA button                      │
│                                                     │
│  ─────────────────────────────────────────          │
│                                                     │
│  "Already have a partner account?"                  │
│  "Sign in →"  (Amber link)  Stone, 13px             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Input field style

```css
/* All inputs in the onboarding flow */
background:   #1E1D1B;
border:       1px solid rgba(229, 221, 211, 0.2);  /* Smoke at 20% */
border-radius: 2px;
color:        #F4EEE3;
font:         Geist 400, 15px;
padding:      12px 14px;
outline-none;

/* Focus */
border-color: #BF7B2E;  /* Amber */

/* Error */
border-color: rgba(200, 60, 60, 0.6);
```

### Loading state

On submit: button label changes to "Creating account…" + Amber spinner. Disabled during submission. Error appears inline below the form if server returns an error.

---

## Onboarding Shell — Steps 1–5

### Persistent nav

```
┌─────────────────────────────────────────────────────┐
│  gimilab  (Nunito 900, Linen, 22px)                 │
│           "Partner Setup"  (Stone, 12px, uppercase) │
└─────────────────────────────────────────────────────┘
```

### Stepper (full-width, below nav)

```
  ●──────────●──────────○──────────○──────────○
  1          2          3          4          5
 Course    Rate      Payout     Slots     Go Live
  Profile   Setup    Connect
```

- `●` completed: solid Amber circle, white checkmark inside
- `●` active: solid Amber circle, white number
- `○` upcoming: Stone outline circle, Stone number
- Connecting line: Smoke, filled with Amber from left to current step
- Labels: Geist 600, 10px, uppercase, Stone (upcoming) / Linen (active) / Amber (complete)
- On mobile: show only current step label, collapse others to dots

### Page container

```
max-width: 680px
margin: 0 auto
padding: 0 24px
padding-top: 64px
padding-bottom: 80px
```

### Step card

Each step renders inside a Graphite card with 40px padding:

```css
background:   #1E1D1B;
border:       1px solid rgba(229, 221, 211, 0.1);
border-radius: 2px;
padding:      40px;
```

Step heading pattern (consistent across all steps):

```
LABEL:  STEP X OF 5  — 11px, Amber, uppercase, 0.1em tracking
H2:     "Step title"  — Geist 700, 26px, Linen
BODY:   One sentence explaining the purpose of this step.
        Geist 400, 14px, Stone
────────────────────────────────  (1px Smoke divider)
[form content]
```

---

## Screen 2 — Course Profile (`/partner/onboarding/course`)

**Purpose:** Capture the public-facing course information.

---

### Step header

```
LABEL:  STEP 1 OF 5
H2:     "Tell us about your course"
BODY:   "This is what members see when they browse available courses."
```

### Form layout

```
┌────────────────────────┐  ┌─────────────────────────┐
│  Course Name *         │  │  Course Type *          │
│  [ Torresdale Golf   ] │  │  [ Municipal ▾        ] │
└────────────────────────┘  └─────────────────────────┘

┌────────────────────────┐  ┌─────────────────────────┐
│  Number of Holes *     │  │  Par *                  │
│  [ 18           ▾    ] │  │  [ 72               ]   │
└────────────────────────┘  └─────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Street Address *                                    │
│  [ 8001 Torresdale Ave                            ]  │
└──────────────────────────────────────────────────────┘

┌───────────────┐  ┌──────────────┐  ┌────────────────┐
│  City *       │  │  State *     │  │  ZIP *         │
│  [ Phila.   ] │  │  [ PA ▾    ] │  │  [ 19136     ] │
└───────────────┘  └──────────────┘  └────────────────┘

┌────────────────────────┐  ┌─────────────────────────┐
│  Phone Number *        │  │  Website (optional)     │
│  [ (215) 685-0787    ] │  │  [ torresdalegc.com   ] │
└────────────────────────┘  └─────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Course Description *                                │
│  [ Describe your course in 2–3 sentences. What    ]  │
│  [ makes it worth visiting?                       ]  │
│                                                0/280  │
└──────────────────────────────────────────────────────┘
```

### Field details

- `Course Type` select options: Municipal · Semi-Private · Private · Resort
- `Number of Holes` select: 9 · 18 · 27 · 36
- `Par` — number, min 27, max 72
- `Description` — textarea, 280 char limit, live counter (Stone, right-aligned below field)
- All required fields marked with `*`

### Footer

```
[ ← Back ]  (ghost button, Stone, left)    [ Save & Continue → ] (Amber CTA, right)
```

---

## Screen 3 — Discount Rate Setup (`/partner/onboarding/pricing`)

**Purpose:** Partner sets their walk-up rack rate and their Gimmelab rate. The discount between the two determines their commission tier. Show the math — make the incentive obvious.

---

### Step header

```
LABEL:  STEP 2 OF 5
H2:     "Set your discount rate"
BODY:   "Your Gimmelab price must be below your standard walk-up rate.
         The deeper the discount, the better your commission tier."
```

### Layout

```
── COMMISSION TIER UNLOCK BAR ─────────────────────────

YOUR COMMISSION TIER  (Stone, 11px, uppercase label)

┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  STARTER     ✓  │  │  PLUS      🔒   │  │  PRO        🔒   │
│  10–19% off     │  │  20–29% off     │  │  30%+ off        │
│  rack           │  │  rack           │  │  rack            │
│                 │  │                 │  │                  │
│  Keep 85%       │  │  Keep 87%       │  │  Keep 90%        │
│  Gimmelab: 15%  │  │  Gimmelab: 13%  │  │  Gimmelab: 10%   │
└─────────────────┘  └─────────────────┘  └──────────────────┘
  Amber border,         Faded (opacity .4)   Faded (opacity .4)
  amber bg tint         until unlocked       until unlocked

▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░  (progress bar, Amber fill)
Status: "✓ Starter tier unlocked. Offer 20%+ off to unlock Plus (keep 87%)."
         Green, 12px

── TWO RATE INPUTS (side by side) ─────────────────────

┌───────────────────────────┐  ┌───────────────────────────┐
│  Your standard walk-up    │  │  Your Gimmelab rate        │
│  rate                     │  │          [29% off ✓]       │
│                           │  │  (badge: green, updates    │
│  $  [ 85              ]   │  │   live)                    │
│                           │  │                            │
│  "What a walk-in pays     │  │  $  [ 60              ]    │
│   at your course."        │  │                            │
│   Stone, 11px             │  │  "Minimum: $77 (10% off    │
│                           │  │   $85)"  Stone, 11px       │
└───────────────────────────┘  └───────────────────────────┘

If discount < 10%:
┌──────────────────────────────────────────────────────┐
│  ⚠  Your Gimmelab rate must be at least 10% below   │
│     your walk-up rate. Members need to see a real    │
│     saving.                                          │
│  (Red bg tint, red border, red text, 12px)           │
└──────────────────────────────────────────────────────┘

── LIVE PREVIEW CARD ───────────────────────────────────

┌────────────────────────────────────────────────────┐
│  PREVIEW CARD  (Linen bg, Amber top border 2px)    │
│                                                    │
│  Credits charged to member     You earn per booking│
│  60 credits  (Amber, 32px)     $51.00  (Midnight)  │
│  Member saves $25 vs walk-up   after 15% commission│
│  (Green, 11px)                 (Stone, 11px)       │
│                                                    │
│  ─────────────────────────────────────────         │
│                                                    │
│  WHO CAN BOOK                  ROUNDS / MONTH      │
│  Casual (100 credits/mo)       ~1 round            │
│  Core   (170 credits/mo)       ~2 rounds           │
│  Heavy  (250 credits/mo)       ~4 rounds           │
│                                                    │
│  ─────────────────────────────────────────         │
│                                                    │
│  EARNINGS ESTIMATE  @ 85% payout  (Amber, 11px)   │
│  At 20 bookings/mo     $1,020 / month              │
│  At 50 bookings/mo     $2,550 / month              │
│  At 100 bookings/mo    $5,100 / month              │
│  (Stone label, Midnight value)                     │
│                                                    │
└────────────────────────────────────────────────────┘

"You can update your rate anytime. Commission tier
 recalculates automatically."  Stone, 12px
```

### Tier card states

| State | Border | Background | Opacity | Lock icon |
|---|---|---|---|---|
| Active (current tier) | Amber | Amber at 5% | 100% | ✓ |
| Unlocked (below current) | Green at 40% | White | 100% | ✓ |
| Locked | `--border` | White | 40% | 🔒 |

All tier cards animate with `transition: all 0.25s` as the discount changes.

### Interaction

- Both inputs update the preview card and tier bar **live on every keystroke**
- Debounced 150ms to avoid flicker
- Discount % badge on Gimmelab rate field: amber when < 10%, green when ≥ 10%
- If either input is empty: preview shows dashes, tier bar stays inactive
- If discount < 10%: red error banner appears, "Lock In Rate" button is disabled
- Max Gimmelab rate: $150. If above: amber warning "Rate above $150 will be reviewed before going live" — does not block progression
- Progress bar fills proportionally from 0–40% discount (capped visually at 40%)
- Status text under progress bar updates in real time with next tier nudge

### Footer

```
[ ← Back ]    [ Lock In Rate → ] (Amber CTA, disabled if discount < 10%)
```

---

## Screen 4 — Stripe Connect (`/partner/onboarding/payout`)

**Purpose:** Connect a bank account to receive payouts.

---

### Step header

```
LABEL:  STEP 3 OF 5
H2:     "Connect your payout account"
BODY:   "You'll receive monthly payouts directly to your bank. Powered by Stripe."
```

### Layout — default (not yet connected)

```
┌──────────────────────────────────────────────────────┐
│  ICON AREA (centered)                                │
│  [  Stripe logo mark  ]  (white/linen, 48px)         │
│                                                      │
│  H3:  "Secure bank connection via Stripe"            │
│        Geist 600, 18px, Linen, centered              │
│                                                      │
│  BODY: "Gimmelab uses Stripe Connect to send         │
│          payouts directly to your bank account.      │
│          Setup takes 2–3 minutes."                   │
│          Stone, 14px, centered                       │
│                                                      │
│  CHECKLIST (Linen text, Amber bullet):               │
│   ✓  No setup fees                                   │
│   ✓  Monthly automatic transfers                     │
│   ✓  Supports US bank accounts                       │
│                                                      │
│  [ Connect Bank Account → ]  (Full-width Amber CTA) │
│                                                      │
│  ─────────────────────────────────────────           │
│                                                      │
│  "Skip for now — I'll connect later"                 │
│   Stone, 13px, underline on hover, centered          │
│   (Clicking this: sets a flag + redirects to /slots) │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Layout — connected (return from Stripe)

```
┌──────────────────────────────────────────────────────┐
│  SUCCESS STATE                                       │
│                                                      │
│  [  ✓ checkmark  ]  Amber circle, white check, 48px │
│                                                      │
│  H3:  "Bank account connected"                       │
│        Geist 700, 20px, Linen, centered              │
│                                                      │
│  BODY: "You're all set to receive payouts. We'll     │
│          settle monthly, net 30."                    │
│          Stone, 14px, centered                       │
│                                                      │
│  [ Continue to Inventory → ]  (Amber CTA)           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Skipped banner (shown in `/partner/dashboard`)

```
Amber background banner at top of partner dashboard:
"Payouts on hold — connect your bank account to start receiving payments."
[ Connect Now → ]
```

---

## Screen 5 — Add First Slots (`/partner/onboarding/slots`)

**Purpose:** Add initial tee time inventory so the course is live immediately.

---

### Step header

```
LABEL:  STEP 4 OF 5
H2:     "Add your first tee times"
BODY:   "Give members something to book. You can add more anytime from your dashboard."
```

### Two-mode toggle

```
┌───────────────────────────┬──────────────────────────┐
│  ● Quick Add              │  ○ Manual Entry           │
│    Set a recurring        │    Add specific dates     │
│    schedule               │    and times              │
└───────────────────────────┴──────────────────────────┘
(Active mode: Amber bottom border on tab. Inactive: Stone text)
```

### Mode A — Quick Add (default)

```
AVAILABLE DAYS
[ Mon ] [ Tue ] [ Wed ] [ Thu ] [ Fri ] [ Sat ] [ Sun ]
  ○       ○       ○       ●       ●       ●       ○
(Toggle chips — Amber fill + Midnight text when active, Graphite + Stone when inactive)

START TIME          END TIME
[ 07:00 AM  ▾  ]    [ 04:00 PM  ▾  ]

INTERVAL BETWEEN SLOTS
( ) 10 min    (●) 15 min    ( ) 20 min
(Amber radio buttons)

DATE RANGE
Starting   [ 03/23/2026 📅 ]
Duration   [ 4 weeks   ▾  ]

──────────────────────────────────────────────────────
PREVIEW (live, updates on any change)
┌────────────────────────────────────────────────────┐
│  This will create  48  tee time slots              │
│  Thu–Sat · 07:00–16:00 · every 15 min              │
│  03/23/2026 – 04/19/2026                           │
│  (Amber number, Stone supporting text)             │
└────────────────────────────────────────────────────┘
```

### Mode B — Manual Entry

```
┌──────────────────────────────────────────────────────┐
│  DATE                TIME                           │
│  [ 03/24/2026 📅 ]   [ 08:30 AM ▾ ]   [ × Remove ] │
│  [ 03/24/2026 📅 ]   [ 09:00 AM ▾ ]   [ × Remove ] │
│  [ 03/25/2026 📅 ]   [ 10:30 AM ▾ ]   [ × Remove ] │
│                                                      │
│  [ + Add another time ]  (Amber text link)          │
└──────────────────────────────────────────────────────┘
```

### Footer

```
[ ← Back ]   [ Skip for now ]   [ Generate Slots → ]
              Stone, 13px           Amber CTA
```

---

## Screen 6 — Go Live (`/partner/onboarding/live`)

**Purpose:** Celebrate completion. Give them a clear next step.

---

### Layout

```
┌──────────────────────────────────────────────────────┐
│  (No step indicator — this is the completion screen) │
│                                                      │
│  ANIMATION: Amber checkmark circle, scale in + fade  │
│  Size: 80px, centered                               │
│                                                      │
│  H1:  "You're live."                                 │
│        Geist 700, 40px, Linen, centered              │
│                                                      │
│  BODY: "Your course is now listed on Gimmelab.       │
│          Members in your area can book available     │
│          slots immediately."                         │
│          Stone, 15px, centered, max-w-md             │
│                                                      │
│  ─────────────────────────────────────────           │
│                                                      │
│  SUMMARY CARD (Graphite, Amber top border)          │
│  ┌──────────────────────────────────────────┐       │
│  │  Torresdale Golf Course                  │       │
│  │  Municipal · 18 holes · Philadelphia, PA │       │
│  │                                          │       │
│  │  Rate per slot     38 credits ($38)      │       │
│  │  Slots added       48                   │       │
│  │  Payout account    ✓ Connected           │       │
│  │                    ⚠ Pending (if skipped)│       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  [ Open Dashboard → ]  (Full-width Amber CTA)       │
│                                                      │
│  "Share your listing"                               │
│  [ gimmelab.com/courses/torresdale  📋 copy ]       │
│  (Stone, Amber copy icon — copies to clipboard)     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Animation spec

- On page mount: checkmark circle scales from `0.5` to `1` over `400ms` with `ease-out`
- Simultaneously: H1 and body fade in, `200ms` delay, `300ms` duration
- Summary card slides up 16px + fades in, `400ms` delay, `350ms` duration
- Use Motion (`motion/react`) for all — consistent with the rest of the app

---

## Responsive Behaviour

| Breakpoint | Changes |
|---|---|
| < 640px (mobile) | Single column forms. Stepper shows current step only (dot indicators for others). Earnings preview collapses below input. |
| 640–1024px (tablet) | Two-column form grids become single column for comfort. |
| > 1024px (desktop) | Full layout as designed. Max-width 680px card centred. |

---

## Error States

| Error | Display |
|---|---|
| Form validation | Amber text below the offending field, 12px, appears on blur |
| Server error (signup fails) | Amber error bar at top of card: "Something went wrong. Try again." |
| Stripe Connect declined | Stone text: "Couldn't connect account. Try again or skip for now." |
| Slot generation fails | Toast notification: "Slots couldn't be created. You can add them from your dashboard." |

---

## Empty State — Partner Dashboard (onboarding incomplete)

If a partner lands on `/partner/dashboard` without completing onboarding (e.g. signed up then left):

```
AMBER CALLOUT BANNER (below nav, full-width):
"Complete your setup to go live — you're X steps away."
[ Continue Setup → ]  links to the first incomplete onboarding step
```

Determine the first incomplete step by checking:
1. `courses` row exists for this partner? If not → `/partner/onboarding/course`
2. `courses.gimmelab_rate_cents` set? If not → `/partner/onboarding/pricing`
3. `partners.stripeConnectAccountId` set? If not → `/partner/onboarding/payout`
4. Any slots in `tee_time_slots` for this partner? If not → `/partner/onboarding/slots`
5. `partners.onboarding_complete = true`? If not → `/partner/onboarding/live`

---

## Copy Reference

| Element | Copy |
|---|---|
| Apply landing H1 | "Sell tee times. Get paid monthly." |
| Apply landing sub | "Gimmelab connects your open slots with golfers in your region. You set the rate. We handle bookings, payments, and payouts." |
| Apply CTA | "List Your Course" |
| Signup H1 | "Create your account" |
| Signup sub | "You'll use this to manage your course, view bookings, and receive payouts." |
| Course profile H2 | "Tell us about your course" |
| Course profile sub | "This is what members see when they browse available courses." |
| Rate setup H2 | "Set your discount rate" |
| Rate setup sub | "Your Gimmelab price must be below your standard walk-up rate. The deeper the discount, the better your commission tier." |
| Payout H2 | "Connect your payout account" |
| Payout sub | "You'll receive monthly payouts directly to your bank. Powered by Stripe." |
| Slots H2 | "Add your first tee times" |
| Slots sub | "Give members something to book. You can add more anytime from your dashboard." |
| Live H1 | "You're live." |
| Live sub | "Your course is now listed on Gimmelab. Members in your area can book available slots immediately." |

---

## Components to Build

| Component | File | Notes |
|---|---|---|
| `<OnboardingStepper />` | `components/partner/onboarding-stepper.tsx` | Receives `currentStep: 1–5` |
| `<OnboardingNav />` | `components/partner/onboarding-nav.tsx` | gimilab wordmark + "Partner Setup" |
| `<DiscountRateCalculator />` | `components/partner/discount-rate-calculator.tsx` | Client component — rack rate + Gimmelab rate inputs, live tier unlock UI, earnings preview |
| `<EarningsCalculator />` | `components/partner/earnings-calculator.tsx` | Used on landing page (baseline 85% payout) |
| `<SlotQuickAdd />` | `components/partner/slot-quick-add.tsx` | Day toggles + time range + interval |
| `<SlotManualEntry />` | `components/partner/slot-manual-entry.tsx` | Date/time rows with add/remove |
| `<OnboardingCard />` | `components/partner/onboarding-card.tsx` | Step card shell (label + h2 + divider) |
| `<AmberCallout />` | `components/ui/amber-callout.tsx` | Amber left-border info box |

---

*gimilab · 2026 · Internal Design Reference*
