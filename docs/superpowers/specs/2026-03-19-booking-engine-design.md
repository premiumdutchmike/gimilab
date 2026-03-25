# Booking Engine — Design Spec

**Date:** 2026-03-19
**Project:** OneGolf
**Sub-project:** Phase 2 — Member Booking Engine
**Status:** Approved

---

## Context

Phase 1 delivered auth + subscription onboarding. The core booking business logic already exists (`bookTeeTime`, `cancelBooking`, slot generation, credit ledger). Phase 2 builds the member-facing UI on top of that logic, giving members the ability to browse tee times, book slots, view their bookings, and check their credit history.

The partner portal does not exist yet. Demo courses and tee time blocks will be seeded directly in Supabase at the end of the phase to populate test slots before manual verification.

---

## Scope

**In scope:**
- `/book` — tee time search + booking flow
- `/courses` — course discovery
- `/rounds` — booking history + cancellation
- `/credits` — credit balance + ledger history (read-only, no top-up)
- AI search API route (`/api/ai/search`) with Redis caching
- Server Actions for booking + cancellation
- Demo data seed SQL

**Out of scope:**
- Credit top-up purchase (Phase 3)
- Partner portal / course management (Phase 3)
- Admin console (Phase 4)
- Post-round ratings UI (Phase 3)
- Payout calculations (Phase 3)

---

## Flow Overview

```
/courses  →  /book?course=slug
               ↑
/book  →  filter by date/course/timeOfDay  →  slot cards  →  booking dialog  →  confirm  →  /rounds
           ↑
           AI search bar  →  /api/ai/search  →  redirect to /book with URL params
```

---

## Screen-by-Screen Design

### Screen 1 — Tee Time Search (`/book`)

**Purpose:** Primary booking entry point. Find an available slot and book it.

**Layout:**
- AI search bar at top: "Describe what you're looking for…" — submitting hits `/api/ai/search`, which returns structured intent and redirects to `/book` with URL params pre-filled
- Filter row below: date picker (default tomorrow), course dropdown (all active courses + "Any course"), time-of-day select (Morning 6am–12pm / Afternoon 12pm–5pm / Evening 5pm–8pm / Any), max credits slider (optional)
- Slot results below filters: cards sorted by date/time ascending
- Empty state: "No tee times found — try adjusting your filters"
- Loading state: skeleton cards during slot fetch

**Slot Card:**
- Course name + holes (e.g., "Pebble Beach · 18 holes")
- Date + start time (e.g., "Saturday Mar 22 · 8:30am")
- Credit cost (green badge, e.g., "85 credits")
- Click → opens BookingDialog

**BookingDialog (shadcn Dialog):**
- Slot details: course, date/time, holes
- Credit cost prominently displayed
- User's current balance shown ("Your balance: 170 credits → 65 after booking")
- "Confirm Booking" button — calls `bookSlot(slotId)` Server Action
- Error states: "Not enough credits" / "Slot no longer available" (shown inline)
- On success: dialog closes, redirect to `/rounds`

**Architecture:** Server Component shell. Filters are Client Component (`BookFilters`) that updates URL params on change. Slot list re-renders on URL param change (Next.js route refresh). Booking dialog is Client Component.

**URL param schema:**
- `date` — YYYY-MM-DD
- `course` — course slug or omitted for all
- `timeOfDay` — morning | afternoon | evening | any
- `maxCredits` — integer or omitted

---

### Screen 2 — Course Discovery (`/courses`)

**Purpose:** Browse available partner courses. Entry point into `/book` filtered by course.

**Layout:**
- Grid of course cards (2 columns on desktop, 1 on mobile)
- Each card: course name, address, holes, credit cost range (floor–ceiling), avg rating (stars), amenities chips
- "Book a tee time →" button → `/book?course=slug`

**Architecture:** Pure Server Component. Reads `courses` table where `status = 'active'`.

---

### Screen 3 — My Rounds (`/rounds`)

**Purpose:** Booking history with cancellation for upcoming rounds.

**Layout:**
- Two tabs: **Upcoming** / **Past**
- Each booking row (RoundCard):
  - Course name, date/time, holes
  - Credit cost
  - Status badge: CONFIRMED (green) / CANCELLED (gray) / COMPLETED (blue)
  - Upcoming only: QR code (expandable) + "Cancel" button

**Cancel Flow:**
- "Cancel" button → opens CancelDialog
- CancelDialog shows:
  - ">24 hours until tee time: Full refund of X credits"
  - "<24 hours until tee time: No refund — credits will not be returned"
- "Confirm Cancellation" → calls `cancelSlot(bookingId, reason?)` Server Action
- On success: booking moves to Past tab with CANCELLED status

**Architecture:** Server Component with Client Component tabs. RoundCard is Client Component (handles cancel dialog state). QR code rendered as text/image from `booking.qrCode` field (`text` column, exists in `bookings` table — populated by `bookTeeTime()` at booking creation time).

---

### Screen 4 — Credits (`/credits`)

**Purpose:** Show credit balance and full transaction history.

**Layout:**
- Large balance display at top (same green style as dashboard)
- Subscription tier + next renewal note
- `LedgerTable`: paginated list of credit transactions
  - Columns: Type badge, Amount (green +N / red −N), Date, Notes
  - Type badges: SUBSCRIPTION_GRANT (blue) / BOOKING_DEBIT (red) / BOOKING_REFUND (green) / ADMIN_ADJUSTMENT (amber) / CREDIT_EXPIRY (gray) / BONUS_GRANT (purple) / TOP_UP_PURCHASE (teal)
  - Default: 20 rows, "Load more" pagination

**Architecture:** Server Component. Calls `getLedgerHistory(userId, 20)` from `lib/credits/ledger.ts`.

---

## Architecture

### Route Groups & Files

```
app/
├── (member)/
│   ├── book/page.tsx              → Screen 1 (Server Component shell)
│   ├── courses/page.tsx           → Screen 2
│   ├── rounds/page.tsx            → Screen 3
│   └── credits/page.tsx           → Screen 4
│
app/api/
│   └── ai/
│       └── search/route.ts        → AI intent extraction (POST)
│
components/
│   ├── book-filters.tsx           → Client Component (date/course/time filters + AI bar)
│   ├── slot-card.tsx              → Client Component (opens booking dialog)
│   ├── booking-dialog.tsx         → Client Component (confirm booking)
│   ├── course-card.tsx            → Server Component
│   ├── round-card.tsx             → Client Component (QR + cancel button)
│   ├── cancel-dialog.tsx          → Client Component
│   └── ledger-table.tsx           → Server Component
│
actions/
│   └── booking.ts                 → bookSlot(), cancelSlot()
```

### proxy.ts updates

Add member routes to route guards (already covered by `isMemberRoute` check — `/book`, `/rounds`, `/credits`, `/courses` all start with recognized member prefixes). No proxy changes needed.

Wait — `/courses` starts with `/courses` which IS already in `isMemberRoute`. `/book` is already there. `/rounds` and `/credits` are already there. ✓ No proxy.ts changes needed.

---

## Server Actions (`actions/booking.ts`)

```ts
// bookSlot(slotId: string) → { error?: string } | never (redirects on success)
// 1. Get authenticated user (createClient from supabase/server)
// 2. Call bookTeeTime(userId, slotId) from lib/booking/book-tee-time.ts
//    — wrap in try/catch; catch thrown errors (SLOT_NOT_AVAILABLE, INSUFFICIENT_CREDITS)
//      and return { error: message } without redirecting
// 3. On success: redirect('/rounds')

// cancelSlot(bookingId: string, reason?: string) → { error?: string } (updates in-place, no redirect)
// 1. Get authenticated user (userId needed for cancelBooking ownership check)
// 2. Call cancelBooking(bookingId, userId, reason) from lib/booking/book-tee-time.ts
//    — cancelBooking signature: cancelBooking(bookingId, userId, reason?)
//    — userId must be pulled from the session and passed as second arg
// 3. On BOOKING_NOT_FOUND / UNAUTHORIZED / BOOKING_NOT_CANCELLABLE: return { error: message }
// 4. On success: revalidatePath('/rounds') — page refreshes in-place, dialog closes,
//    cancelled booking moves from Upcoming to Past tab without a full navigation redirect
```

---

## AI Search Route (`app/api/ai/search/route.ts`)

**POST `/api/ai/search`**

Request: `{ query: string }` — validated with `aiSearchInputSchema` (Zod, max 500 chars)

Processing:
1. Hash query for cache key: `ai:search:${sha256(query.toLowerCase().trim())}`
2. Check Upstash Redis — return cached result if hit (5-min TTL)
3. On miss: call Claude via AI SDK with structured output using `aiSearchIntentSchema`:
   ```ts
   { dateRange: { start, end }, timeOfDay, maxCredits, holes, maxDistanceMiles, amenities[] }
   ```
4. Store result in Redis with 5-min TTL
5. Return structured intent

Client side: receives intent → maps to supported URL params → `router.push('/book?date=...&timeOfDay=...')`

**Field mapping to URL params (Phase 2):**
- `dateRange.start` → `date` param (use start date; ignore end date in Phase 2)
- `timeOfDay` → `timeOfDay` param
- `maxCredits` → `maxCredits` param
- `holes` → ignored in Phase 2 (no holes filter on `/book`)
- `maxDistanceMiles` → ignored in Phase 2 (no geo filter on `/book`)
- `amenities[]` → ignored in Phase 2 (no amenities filter on `/book`)

The `aiSearchIntentSchema` Zod type already exists in `lib/validations/index.ts` — do not redefine it.

**Model:** `'anthropic/claude-sonnet-4-6'` via AI SDK (matches CLAUDE.md spec)

**Auth:** Requires authenticated user (checked via Supabase server client). Rate limited: 10 requests/minute per user via Upstash Ratelimit.

---

## Demo Data Seed

Run in Supabase SQL Editor after implementation is complete.

**Step 1: Insert a partner + 3 courses**
```sql
-- Insert demo partner user (use the actual Supabase Auth user ID from your test account)
INSERT INTO partners (id, user_id, business_name, status, approved_at)
VALUES (gen_random_uuid(), '<YOUR_USER_ID>', 'Demo Golf Co', 'approved', now());

-- Insert 3 courses (partner_id from above)
INSERT INTO courses (id, partner_id, name, slug, description, address, holes, base_credit_cost, credit_floor, credit_ceiling, status, payout_rate)
VALUES
  (gen_random_uuid(), '<PARTNER_ID>', 'Pebble Creek Golf Club', 'pebble-creek', '18-hole championship course', '123 Golf Lane, San Francisco, CA', 18, 80, 60, 120, 'active', 0.65),
  (gen_random_uuid(), '<PARTNER_ID>', 'Sunrise Links', 'sunrise-links', 'Classic 18-hole parkland course', '456 Fairway Blvd, Oakland, CA', 18, 60, 40, 90, 'active', 0.65),
  (gen_random_uuid(), '<PARTNER_ID>', 'The Short Course', 'short-course', 'Fun 9-hole executive course', '789 Birdie Way, San Jose, CA', 9, 35, 25, 55, 'active', 0.65);
```

**Step 2: Insert tee time blocks for each course**
```sql
-- Pebble Creek: weekday mornings
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<PEBBLE_CREEK_ID>', ARRAY[1,2,3,4,5], '07:00', '12:00', 1, CURRENT_DATE, true);

-- Pebble Creek: weekend all-day
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<PEBBLE_CREEK_ID>', ARRAY[0,6], '06:00', '17:00', 1, CURRENT_DATE, true);

-- Sunrise Links: daily mornings
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<SUNRISE_LINKS_ID>', ARRAY[0,1,2,3,4,5,6], '07:00', '13:00', 1, CURRENT_DATE, true);

-- Sunrise Links: weekend afternoons
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<SUNRISE_LINKS_ID>', ARRAY[0,6], '13:00', '17:00', 1, CURRENT_DATE, true);

-- The Short Course: daily all-day (9-hole, shorter window)
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<SHORT_COURSE_ID>', ARRAY[0,1,2,3,4,5,6], '08:00', '16:00', 1, CURRENT_DATE, true);
```

**Step 3: Generate slots**
Hit `GET /api/cron/generate-slots` with the `Authorization: Bearer <CRON_SECRET>` header. Use curl or a REST client:
```
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3001/api/cron/generate-slots
```

Note: `generateSlotsForDays()` uses a hardcoded 10-minute interval — no `interval_minutes` column on `tee_time_blocks`. Each block produces one slot per 10-minute window within its `start_time`/`end_time` range.

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Slot taken between view and confirm | `bookTeeTime` throws `SLOT_NOT_AVAILABLE` → show "Slot just got booked — try another" in dialog |
| Insufficient credits | `bookTeeTime` throws `INSUFFICIENT_CREDITS` → show "Not enough credits" with link to `/credits` |
| Cancel <24h before tee time | `cancelBooking` returns `refunded: 0` → dialog warned user, proceeds |
| Cancel already cancelled booking | `cancelBooking` throws `BOOKING_NOT_CANCELLABLE` → show error toast |
| AI search rate limit exceeded | Return 429, client shows "Too many searches — try again in a minute" |
| AI search cache miss + Anthropic down | Return 500, client falls back to empty filters (no crash) |
| No slots match filters | Empty state: "No tee times found — try adjusting your filters" |

---

## Verification Steps

1. Seed demo data (partner, 3 courses, blocks)
2. Hit `/api/cron/generate-slots` — verify slots appear in `tee_time_slots` table
3. Navigate to `/courses` — see 3 course cards
4. Click "Book a tee time →" — lands on `/book?course=pebble-creek`
5. Adjust date/time filters — slot cards update
6. Type "Saturday morning 18 holes" in AI search → filters pre-fill, results update
7. Click a slot → BookingDialog opens with correct credit math
8. Confirm booking → redirected to `/rounds`
9. `/rounds` shows booking in Upcoming tab with QR code
10. Cancel booking >24h out → dialog shows full refund, confirm → booking moves to Past, credits refunded
11. `/credits` shows correct ledger: SUBSCRIPTION_GRANT (+170), BOOKING_DEBIT (−X), BOOKING_REFUND (+X)
12. Dashboard credit balance updates after booking + cancellation
