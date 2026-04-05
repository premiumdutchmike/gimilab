# Courses Experience — Gap Analysis & Backlog

**Date:** 2026-04-04
**Owner:** Mike
**Context:** After shipping the `/book` route, guest booking, and auth redirect fixes, we audited the course discovery flow end-to-end. These are the gaps between what we have and what the "Courses near you" homepage promise is actually delivering. Ordered by impact.

---

## Shipped 2026-04-04

- [x] **#1 — Rebuilt `/courses`** with cream hybrid cards matching the homepage redesign
- [x] **#2 — Credit → dollar hint** (`lib/credits/pricing.ts` + `components/credit-dollar-hint.tsx`) surfaced on: homepage hero booking card, course detail hero + stats box, dashboard booking confirm bar, and every `/courses` card
- [x] **#3 — Real location filter** on `/courses`: zip input + 10/25/50 mi radius, uses Haversine + `api.zippopotam.us` for zip→coords (new `lib/geo/distance.ts`). Pre-fills the user's `homeZip` when logged in. "Nearest first" sort option unlocks once a zip is resolved.
- [x] **#5 — Tee-times preview extended from 7 → 14 days** on course detail (cron already generates 14 days of slots)
- [x] **#8 — `slot=<id>` plumbed through** the logged-out per-slot "Sign in to Book" redirect. Returning members land on `/book?course=<id>&date=<ymd>&slot=<slotId>` with the exact slot pre-selected.
- [x] **#9 — "Affordable" signal** on course cards. Non-affordable courses get muted + a "Locked" status + "Not enough credits" tag. "X courses in reach" counter in the hero balance card.
- [x] **#10 — Cancellation preview** in the booking confirm bar ("Free cancellation until Fri 8:30am"), derived from the 24h rule in `cancelBooking`.

---

## Shipped 2026-04-04 (round 2)

- [x] **#4 — Quick-book chip row** on every `/courses` card. Batch query `getNextSlotsForCourses(courseIds, limit=3)` in `actions/slots.ts` fetches the next 3 available slots per course in a single round trip. Each chip links straight to `/book?course=<id>&date=<ymd>&slot=<slotId>` (or wraps that in a login redirect for logged-out users).
- [x] **#6 — Favorites**. New `user_favorite_courses` table (`(userId, courseId)` unique index, cascade deletes). New `actions/favorites.ts` with `toggleFavorite()` + `getUserFavorites()`. New `components/favorite-button.tsx` — optimistic toggle heart in the top-right of each card, `onToggle` callback keeps the shared favorites set in sync. "Favorites" filter button in the toolbar shows only favorited courses.
- [x] **#7 — Host experience section** on course detail pages. 3-step editorial strip between "About this course" and the tee-times calendar: Browse & book → Show your QR → Tee off. Course-specific heading ("How Gimmelab works at {course.name}.").

All 10 gaps from the original audit are now shipped. No further deferred work.

---

## Execution notes (2026-04-04)

Parallelized across background agents and main session:
- **Main session:** #1 rebuild, #3 location filter, #9 affordable indicator
- **Agent A:** #2 credit→dollar display across all surfaces + #10 cancellation preview
- **Agent B:** #5 tee-times 14-day extension + #8 slot= redirect plumbing

All three streams touch disjoint file sets — no merge conflicts expected.
