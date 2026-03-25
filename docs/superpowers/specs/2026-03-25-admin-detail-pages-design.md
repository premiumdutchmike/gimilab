# Admin Detail Pages — Design Spec

**Date:** 2026-03-25
**Status:** Approved

## Overview

Add clickable course and member rows to the admin console, each opening a detail page with a sidebar-nav layout. Both pages expose full activity logs and admin actions in one place. No new schema required beyond one boolean column on `users`.

---

## Schema Change

Add `isSuspended: boolean` to the `users` table (default `false`). This is the only schema change. Suspend/activate toggles this flag independently of `subscriptionStatus`, which remains Stripe's source of truth.

Migration: `npx drizzle-kit push` after adding the column to `schema.ts`.

---

## Layout Pattern (both pages)

Sidebar-nav layout:

```
┌─────────────┬──────────────────────────────────┐
│  Sidebar    │  Main content area               │
│  Overview ← │  Stats + info + activity log     │
│  [Section]  │                                  │
│  [Section]  │                                  │
│  ...        │                                  │
│  ── ── ──   │                                  │
│  ⚠ Suspend  │                                  │
└─────────────┴──────────────────────────────────┘
```

- Sidebar persistent across all sections; active section highlighted in green
- Danger actions (Suspend/Activate) always visible at bottom of sidebar
- Back link to list page at top
- Both pages call `notFound()` from `next/navigation` if the record is not found

---

## Admin Auth Guard

All Server Actions in `actions/admin/` must begin with a `requireAdmin()` call:

```ts
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const meta = user?.user_metadata
  if (!meta || meta.role !== 'admin') throw new Error('Unauthorized')
}
```

This is in addition to the route-level guard in `proxy.ts`. Server Actions are POST-callable by any authenticated session, so the re-check is mandatory.

---

## Course Detail Page

**Route:** `/admin/courses/[id]`
**404:** Call `notFound()` if no course matches the `id` param.

### Sidebar sections

| Section | Content |
|---------|---------|
| Overview | Stats + course info + unified activity log |
| Bookings | All bookings table for this course |
| Payouts | Payout transfer history (partner-level) + pending amount |
| Settings | Edit course fields + payout rate |

### Overview tab

- **Stats row:** Total bookings count · Total partner earnings (`SUM(bookings.payoutAmountCents)` on CONFIRMED/COMPLETED) · Current payout %
- **Course info card:** Name, address, partner name, holes, status badge
- **Unified activity log** (newest first): bookings, cancellations, payout transfers, payout rate changes, status changes

Activity log sources:
- `bookings` joined to `users`: CONFIRMED, CANCELLED, COMPLETED, NO_SHOW (with member name + credits)
- `payoutTransfers` for the course's partner: PENDING / COMPLETED / FAILED transfers
- `courses.createdAt` → "Course created" event
- `courses.updatedAt` compared to `courses.approvedAt` → "Course approved" event (approximated)

> Note: there is no audit log table. Status and rate change history is not tracked for MVP — only current values are shown.

### Bookings tab

Table columns: member name/email · date · time · credits · booking status · payout status · check-in time
Sorted by `teeTimeSlots.date` desc. No pagination for MVP.

### Payouts tab

**Scope:** `payoutTransfers` are linked to `partnerId`, not `courseId`. A partner with multiple courses will have all transfers shown here. This is acknowledged — the Payouts tab is labelled "Partner Payouts" and shows the partner name clearly.

- Pending amount: `SUM(bookings.partnerEarningsCents)` where `payoutStatus = 'PENDING'` and `bookings.courseId = id`
- Transfer history from `payoutTransfers` where `partnerId = course.partnerId`: date · amount · booking count · status

### Settings tab

Editable fields: name, description, address, holes, baseCreditCost, payoutRate, status (active/suspended)

> `creditFloor` and `creditCeiling` are excluded — they exist in the schema but no runtime feature currently consumes them. Exposing them as editable would silently have no effect.

Payout rate and status changes use a Server Action that updates `courses` and calls `revalidatePath`.

### Admin actions

- **Suspend** — sets `courses.status = 'suspended'`
- **Activate** — sets `courses.status = 'active'`
- Both via `actions/admin/update-course.ts`

---

## Member Detail Page

**Route:** `/admin/members/[id]`
**404:** Call `notFound()` if no user matches the `id` param.

### Sidebar sections

| Section | Content |
|---------|---------|
| Overview | Profile + stats + unified activity log |
| Credits | Current balance + full ledger + manual adjustment |
| Bookings | All bookings table for this member |
| Subscription | Current plan + change tier + cancel |

### Overview tab

- **Stats row:** Current credit balance (via `getCreditBalance(userId)` from `lib/credits/ledger.ts`) · Plan tier · Total rounds played (count of CONFIRMED/COMPLETED bookings)
- **Profile card:** Name, email, join date, subscription status badge, suspended badge if `isSuspended = true`
- **Unified activity log** (newest first): all `creditLedger` rows merged with booking events

Activity log event colours:

| Type | Colour |
|------|--------|
| `BOOKING_DEBIT` | white |
| `BOOKING_REFUND` | sky blue |
| `SUBSCRIPTION_GRANT` | green |
| `ROLLOVER_GRANT` | green |
| `BONUS_GRANT` | green |
| `TOP_UP_PURCHASE` | green |
| `ADMIN_ADJUSTMENT` | amber |
| `CREDIT_EXPIRY` | grey |
| Booking CONFIRMED | white |
| Booking CANCELLED | grey |
| Booking NO_SHOW | red |

### Credits tab

- **Balance:** `getCreditBalance(userId)` — never read a balance column, always compute from ledger
- **Full ledger table:** date · type · amount · notes · expires at — from `creditLedger` ordered by `createdAt` desc
- **Manual adjustment form:** amount (positive or negative integer) + required notes → calls `actions/admin/adjust-member-credits.ts` which inserts an `ADMIN_ADJUSTMENT` row

### Bookings tab

Table columns: course name · date · time · credits · status · rating score (if exists)
Sorted by `bookings.createdAt` desc.

**Refund action:** Available on CONFIRMED bookings. Calls the existing `cancelBooking()` from `lib/booking/book-tee-time.ts` — this is already atomic (inserts `BOOKING_REFUND` ledger row, sets booking to CANCELLED, and resets `teeTimeSlots.status` back to `AVAILABLE`). Do not re-implement this logic.

### Subscription tab

- Current plan badge, Stripe subscription ID (display only)
- **Change tier** — calls Stripe API to update the subscription. The action calls Stripe only; `users.subscriptionTier` is synced via the existing `invoice.paid` / `customer.subscription.updated` webhook handlers. If the Stripe call fails, no DB write occurs. This keeps Stripe as the source of truth per CLAUDE.md.
- **Cancel subscription** — calls Stripe to cancel; DB sync happens via webhook.

### Admin actions

- **Suspend** — sets `users.isSuspended = true` via `actions/admin/suspend-member.ts`
- **Activate** — sets `users.isSuspended = false`
- Suspension is independent of subscription status. A suspended member's session is blocked at `proxy.ts` by checking `isSuspended`.

> Note: `proxy.ts` must be updated to check `users.isSuspended` and redirect suspended members to an error page.

---

## Navigation Changes

### Courses list (`/admin/courses/page.tsx`)
- Each course name becomes a link: `href="/admin/courses/[id]"`
- Inline payout rate editor removed from list (moved to Settings tab)
- Approve/reject buttons remain on pending courses in the list

### Members list (`/admin/members/page.tsx`)
- Each member row becomes a link: `href="/admin/members/[id]"`
- Existing stats header unchanged

---

## Data Fetching

All data fetched server-side. No new API routes.

**Course detail:**
```ts
// Course + partner + partner user
db.query.courses.findFirst({
  where: eq(courses.id, id),
  with: { partner: { with: { user: true } } }
})
// requires courses to be registered in the drizzle schema object

// Bookings with member info
db.select({ ...bookingFields, memberName: users.fullName, memberEmail: users.email, date: teeTimeSlots.date })
  .from(bookings)
  .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
  .innerJoin(users, eq(bookings.userId, users.id))
  .where(eq(bookings.courseId, id))
  .orderBy(desc(teeTimeSlots.date))

// Payout transfers for partner
db.select().from(payoutTransfers)
  .where(eq(payoutTransfers.partnerId, course.partnerId))
  .orderBy(desc(payoutTransfers.createdAt))
```

**Member detail:**
```ts
// User row
db.query.users.findFirst({ where: eq(users.id, id) })

// Credit ledger (full history)
db.select().from(creditLedger)
  .where(eq(creditLedger.userId, id))
  .orderBy(desc(creditLedger.createdAt))

// Bookings with course info
db.select({ ...bookingFields, courseName: courses.name, date: teeTimeSlots.date, startTime: teeTimeSlots.startTime })
  .from(bookings)
  .innerJoin(courses, eq(bookings.courseId, courses.id))
  .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
  .where(eq(bookings.userId, id))
  .orderBy(desc(bookings.createdAt))
```

---

## File Structure

```
lib/db/schema.ts                       ← add isSuspended: boolean to users
proxy.ts                               ← add isSuspended check for members

app/(admin)/admin/
  courses/
    page.tsx                           ← rows become links; remove inline payout editor
    [id]/
      page.tsx                         ← server component, fetches all data, calls notFound()
      course-sidebar.tsx               ← client component, manages active section state
      course-settings-form.tsx         ← client component, editable fields
  members/
    page.tsx                           ← rows become links
    [id]/
      page.tsx                         ← server component, fetches all data, calls notFound()
      member-sidebar.tsx               ← client component, manages active section state
      credit-adjustment-form.tsx       ← client component, manual credit form

actions/admin/
  update-course.ts                     ← edit fields, change status; calls requireAdmin()
  adjust-member-credits.ts             ← insert ADMIN_ADJUSTMENT; calls requireAdmin()
  suspend-member.ts                    ← toggle isSuspended; calls requireAdmin()
  change-subscription.ts              ← Stripe API only, no DB write; calls requireAdmin()
```

---

## Out of Scope (MVP)

- Audit log table for field-level change history
- Pagination on booking/ledger tables
- Bulk admin actions on list pages
- Email notifications to members/partners on admin actions
- Enforcing `creditFloor` / `creditCeiling` in slot generation
