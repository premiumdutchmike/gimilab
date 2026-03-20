# Booking Emails Design Spec

## Goal

Send transactional emails for bookings and cancellations: confirmation + day-before reminder to members, and notifications to partners. The booking flow must not be slowed by email sends.

## Architecture

### Send strategy

- **Immediate emails** (confirmation, cancellation, partner notifications): fired via Next.js `after()` inside `bookSlot` and `cancelSlot` server actions. `after()` runs after the response is committed — the booking is fast, emails are non-blocking.
- **`after()` ordering constraint:** `after()` must be called *before* `redirect()` in the same function scope. `redirect()` throws internally and unwinds the call stack immediately — any code after it is unreachable. The data flow diagrams below reflect this: `after()` is registered first, then `redirect()` fires.
- **Day-before reminder**: scheduled at booking time using Upstash QStash with a calculated delay. QStash calls back `/api/qstash/reminder` which sends the reminder. If the booking is cancelled before the reminder fires, the QStash message fires but the booking status check skips the send gracefully.
- **Reminder skip when < 24h away**: if the computed delay is ≤ 0 (tee time is less than 24h from now), `scheduleBookingReminder` skips the QStash enqueue silently — no reminder is sent.

### Email style

Light/white background with green (`#16a34a`) accents. Renders reliably across all email clients including Outlook. OneGolf wordmark in green at the top, clean card layout, single CTA button. All CTA links use `NEXT_PUBLIC_APP_URL` as the base (e.g., `${process.env.NEXT_PUBLIC_APP_URL}/rounds`).

### Resend integration

Single `lib/email/resend.ts` exports a Resend client singleton. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are already defined in `.env.local`. All send functions live in `lib/email/send.ts` and accept typed arguments — no raw FormData or DB queries inside templates.

### Timezone handling

Slot `date` (date-only) and `startTime` (time-only) must be combined with an explicit `Z` suffix: `new Date(`${slot.date}T${slot.startTime}Z`)`. This treats the slot time as UTC. Vercel deploys on UTC so the delay calculation will be correct in production. Note: the existing `cancelBooking` in `lib/booking/book-tee-time.ts` constructs the same datetime *without* `Z` (a pre-existing bug that happens to work on Vercel but is not portable). The email implementation must use the `Z` suffix explicitly. The system does not support per-course timezones at this stage.

## Emails

### 1. Booking confirmation (member)
**Trigger:** `bookSlot` → `after()`
**Content:** Course name, date, tee time, credits charged, remaining balance, "View My Rounds" CTA.

### 2. Day-before reminder (member)
**Trigger:** `bookSlot` → QStash (delay = tee time UTC minus 24h minus `Date.now()`, in seconds; skip if ≤ 0)
**Content:** "You're on tomorrow" heading, course name, tee time, "View My Rounds" CTA.
**Guard:** Route handler looks up the booking by ID before sending — if status is not `CONFIRMED`, silently returns 200 without sending.

### 3. Cancellation confirmation (member)
**Trigger:** `cancelSlot` → `after()`
**Content:** Course name, tee time that was cancelled, credits refunded, remaining balance, "Book another tee time" CTA.

### 4. New booking notification (partner)
**Trigger:** `bookSlot` → `after()`
**Content:** Member name (first name + last initial), course name, date, tee time. "View Bookings" CTA linking to `/partner/bookings`.
**Recipient:** Partner user email — queried inside the `after()` callback via `courses → partners → users` join. All partners receive notifications regardless of partner status (suspended partners still get emails — status filtering is out of scope).

### 5. Cancellation notification (partner)
**Trigger:** `cancelSlot` → `after()`
**Content:** Slot is now available again. Course name, date, tee time. "View Bookings" CTA.
**Recipient:** Same partner lookup as above.

## Files

### Created
- `lib/email/resend.ts` — Resend client singleton (`new Resend(process.env.RESEND_API_KEY)`)
- `lib/email/send.ts` — Six exported functions: `sendBookingConfirmation`, `sendCancellationConfirmation`, `sendPartnerBookingNotification`, `sendPartnerCancellationNotification`, `sendBookingReminder`, `scheduleBookingReminder`
- `lib/email/templates/booking-confirmation.tsx` — React Email template
- `lib/email/templates/booking-reminder.tsx` — React Email template
- `lib/email/templates/booking-cancellation.tsx` — React Email template
- `lib/email/templates/partner-booking-notification.tsx` — React Email template
- `lib/email/templates/partner-cancellation-notification.tsx` — React Email template
- `app/api/qstash/reminder/route.ts` — QStash callback: verifies signature, looks up booking, sends reminder

### Modified
- `actions/booking.ts` — register `after()` callbacks before `redirect()` in both `bookSlot` and `cancelSlot`

## Data flow

### bookSlot
```
bookSlot(slotId)
  → bookTeeTime(userId, slotId)              # atomic DB transaction
  → after(() => {                            # registered BEFORE redirect()
      sendBookingConfirmation(...)           # Resend API
      sendPartnerBookingNotification(...)    # Resend API (queries partner email inside)
      scheduleBookingReminder(...)           # QStash enqueue (skips if delay ≤ 0)
    })
  → redirect('/rounds')                     # response committed; after() fires after this
```

### cancelSlot
```
cancelSlot(bookingId)
  → cancelBooking(userId, bookingId)         # atomic DB transaction
  → after(() => {                            # registered before revalidatePath (ordering here is for clarity; revalidatePath does not throw unlike redirect)
      sendCancellationConfirmation(...)           # Resend API
      sendPartnerCancellationNotification(...)    # Resend API (queries partner email inside)
    })
  → revalidatePath('/rounds')
```

### QStash reminder callback
```
POST /api/qstash/reminder
  → verify QStash signature (QSTASH_CURRENT_SIGNING_KEY + QSTASH_NEXT_SIGNING_KEY)
  → look up booking by ID
  → if status !== 'CONFIRMED': return 200 (skip, no retry)
  → sendBookingReminder(...)
  → return 200
```

## QStash reminder payload
```ts
interface ReminderPayload {
  bookingId: string
  memberEmail: string
  memberName: string
  courseName: string
  teeTime: string   // ISO string (UTC)
}
```

## Error handling

- All `after()` email sends are fire-and-forget — errors are logged (`console.error`) but do not surface to the user. A failed email never fails a booking.
- QStash reminder route returns `200` for all expected no-ops (booking not found, not CONFIRMED) to prevent retries. Returns `500` only on unexpected errors so QStash retries on transient failures.
- Partner lookup failure is logged and skipped silently.
- `scheduleBookingReminder` skips silently (no QStash call) if computed delay ≤ 0.

## Testing

- Unit tests for `send.ts` functions: mock Resend client and QStash client, assert correct arguments passed.
- Unit test for `/api/qstash/reminder` route: mock DB lookup, assert email sent for CONFIRMED, skipped for CANCELLED/not-found.
- Test `scheduleBookingReminder` skips when delay ≤ 0.
- No tests for React Email templates (visual-only, tested by React Email preview).

## Dependencies

- `resend` — already in stack (per CLAUDE.md)
- `@react-email/components` — React Email component library
- `@upstash/qstash` — already in stack (per CLAUDE.md)

## Environment variables

Already in `.env.local`:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `QSTASH_URL`
- `QSTASH_TOKEN`
- `NEXT_PUBLIC_APP_URL` — used as base for all email CTA links; must be set to the production domain in Vercel env vars

Must be added to `.env.local` and Vercel environment:
- `QSTASH_CURRENT_SIGNING_KEY` — required for QStash signature verification in `/api/qstash/reminder`
- `QSTASH_NEXT_SIGNING_KEY` — required for key rotation support
