# Booking Emails Design Spec

## Goal

Send transactional emails for bookings and cancellations: confirmation + day-before reminder to members, and notifications to partners. The booking flow must not be slowed by email sends.

## Architecture

### Send strategy

- **Immediate emails** (confirmation, cancellation, partner notifications): fired via Next.js `after()` inside `bookSlot` and `cancelSlot` server actions. `after()` runs after the response is committed — the booking is fast, emails are non-blocking.
- **Day-before reminder**: scheduled at booking time using Upstash QStash with a calculated delay. QStash calls back `/api/qstash/reminder` which sends the reminder. If the booking is cancelled before the reminder fires, the QStash message fires but the booking lookup fails gracefully (no email sent).

### Email style

Light/white background with green (`#16a34a`) accents. Renders reliably across all email clients including Outlook. OneGolf wordmark in green at the top, clean card layout, single CTA button.

### Resend integration

Single `lib/email/resend.ts` exports a Resend client singleton. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are already defined in `.env.local`. All send functions live in `lib/email/send.ts` and accept typed arguments — no raw FormData or DB queries inside templates.

## Emails

### 1. Booking confirmation (member)
**Trigger:** `bookSlot` → `after()`
**Content:** Course name, date, tee time, credits charged, remaining balance, "View My Rounds" CTA.

### 2. Day-before reminder (member)
**Trigger:** `bookSlot` → QStash (delay = tee time minus 24h minus current time, in seconds)
**Content:** "You're on tomorrow" heading, course name, tee time, "View My Rounds" CTA.
**Guard:** Route handler looks up the booking by ID before sending — if status is not `CONFIRMED`, silently skips.

### 3. Cancellation confirmation (member)
**Trigger:** `cancelSlot` → `after()`
**Content:** Course name, tee time that was cancelled, credits refunded, remaining balance, "Book another tee time" CTA.

### 4. New booking notification (partner)
**Trigger:** `bookSlot` → `after()`
**Content:** Member name (first name + last initial), course name, date, tee time, slot count. "View Bookings" CTA linking to `/partner/bookings`.
**Recipient:** Partner user email — looked up via `courses → partners → users` join.

### 5. Cancellation notification (partner)
**Trigger:** `cancelSlot` → `after()`
**Content:** Slot is now available again. Course name, date, tee time. "View Bookings" CTA.
**Recipient:** Same partner lookup as above.

## Files

### Created
- `lib/email/resend.ts` — Resend client singleton (`new Resend(process.env.RESEND_API_KEY)`)
- `lib/email/send.ts` — Five exported functions: `sendBookingConfirmation`, `sendBookingReminder`, `sendCancellationConfirmation`, `sendPartnerBookingNotification`, `sendPartnerCancellationNotification`, `scheduleBookingReminder`
- `lib/email/templates/booking-confirmation.tsx` — React Email template
- `lib/email/templates/booking-reminder.tsx` — React Email template
- `lib/email/templates/booking-cancellation.tsx` — React Email template
- `lib/email/templates/partner-booking-notification.tsx` — React Email template
- `lib/email/templates/partner-cancellation-notification.tsx` — React Email template
- `app/api/qstash/reminder/route.ts` — QStash callback: verifies signature, looks up booking, sends reminder

### Modified
- `actions/booking.ts` — add `after()` calls in `bookSlot` and `cancelSlot`, add `scheduleBookingReminder()` call in `bookSlot`

## Data flow

### bookSlot
```
bookSlot(slotId)
  → bookTeeTime(userId, slotId)          # atomic DB transaction
  → redirect('/rounds')                  # response committed
  → after(() => {
      sendBookingConfirmation(...)        # Resend API
      sendPartnerBookingNotification(...) # Resend API
      scheduleBookingReminder(...)        # QStash enqueue
    })
```

### cancelSlot
```
cancelSlot(bookingId)
  → cancelBooking(userId, bookingId)     # atomic DB transaction
  → revalidatePath('/rounds')
  → after(() => {
      sendCancellationConfirmation(...)        # Resend API
      sendPartnerCancellationNotification(...) # Resend API
    })
```

### QStash reminder callback
```
POST /api/qstash/reminder
  → verify QStash signature
  → look up booking by ID
  → if status !== 'CONFIRMED': return 200 (skip)
  → sendBookingReminder(...)
```

## QStash reminder payload
```ts
interface ReminderPayload {
  bookingId: string
  memberEmail: string
  memberName: string
  courseName: string
  teeTime: string   // ISO string
}
```

## Error handling

- All `after()` email sends are fire-and-forget — errors are logged (`console.error`) but do not surface to the user. A failed email never fails a booking.
- QStash reminder route returns `200` for all non-5xx cases (including booking not found, cancelled) to prevent QStash retries on expected no-ops. Returns `500` only on unexpected errors so QStash retries on transient failures.
- Partner lookup failure (partner has no email) is logged and skipped silently.

## Testing

- Unit tests for `send.ts` functions: mock Resend client and QStash client, assert correct arguments passed.
- Unit test for `/api/qstash/reminder` route: mock DB lookup, assert email sent for CONFIRMED, skipped for CANCELLED.
- No tests for React Email templates (visual-only, tested by React Email preview).

## Dependencies

- `resend` — already in stack (per CLAUDE.md)
- `@react-email/components` — React Email component library
- `@upstash/qstash` — already in stack (per CLAUDE.md)
