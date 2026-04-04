# Admin Dashboard Design

**Date:** 2026-04-04
**Scope:** New `/admin` dashboard page replacing the redirect to `/admin/members`

---

## Overview

Create an admin overview dashboard at `/admin` that gives a complete operational snapshot of the business. Currently `/admin` redirects to `/admin/members` — this replaces that redirect with a proper dashboard.

---

## Layout

Dark theme matching existing admin pages. Three vertical zones within the admin layout's content area.

### Zone 1 — Greeting

`Good morning, Dutch.` — same time-of-day logic as member dashboard. Geist 900, ~28px, Linen `#F4EEE3`, tracking -0.03em. Understated — this is operational, not a hero moment.

### Zone 2 — Hero Stats Row

Single bordered container (1px `rgba(244,238,227,0.06)` border, Graphite `#1E1D1B` background) with 5 stat cells divided by 1px vertical lines.

| # | Label | Value example | Delta example | Color | Source |
|---|-------|--------------|---------------|-------|--------|
| 1 | MEMBERS | `247` | `+12 this month` | Linen | COUNT users where subscriptionStatus = 'active' |
| 2 | MRR | `$34.1k` | `+$2.4k vs last month` | Amber `#BF7B2E` | SUM of tier prices for active subscribers. Casual=$99, Core=$149, Heavy=$199. Current month vs prior month delta. |
| 3 | ROUNDS BOOKED | `1,284` | `+84 this month` | Linen | COUNT bookings this month (status IN CONFIRMED, BOOKED, COMPLETED) |
| 4 | CREDIT BREAKAGE | `17.4%` | `Credits expired unused` | Linen | Formula: SUM(amount) WHERE type='CREDIT_EXPIRY' (absolute value) / SUM(amount) WHERE type='SUBSCRIPTION_GRANT', rolling 3 months. This is the percentage of granted credits that expired unused. |
| 5 | ACTIVE COURSES | `23` | `2 pending review` | Linen | COUNT courses WHERE status='active'. Delta: COUNT courses WHERE status='pending'. |

**Typography per cell:**
- Label: Inter 600, 10px, uppercase, 0.1em tracking, Stone `#847C72`
- Value: Geist 900, 56px, -0.04em tracking
- Delta: Inter 400, 12px, Stone. Positive deltas get Amber color with `+` prefix.

### Zone 3 — Content Grid

Two-column layout: wide left (~65%) + narrow right (~35%).

**Left column — Recent Members table:**

Header: "RECENT MEMBERS" — Stone, 10px, uppercase, 0.1em tracking.

Table columns: Name, Tier, Credits, Rounds, Status, Joined.

- 7 most recent members, ordered by `createdAt` desc
- Name: Linen, 13px, 600 weight
- Tier: Amber for `core`, Linen for `heavy`, Stone for `casual`. 13px.
- Credits: `142 / 170` format (current balance / tier max). Linen 13px.
- Rounds: total booking count for that user (CONFIRMED+COMPLETED). Linen 13px.
- Status: small colored dot — Amber for active, red for past_due, Stone for cancelled
- Joined: Stone, 12px, `MMM DD` format

Table rows: no full borders. Just 1px bottom divider at `rgba(244,238,227,0.04)`. Row hover: `rgba(244,238,227,0.02)`.

Column headers: Stone, 10px, 600 weight, uppercase, 0.08em tracking.

**Right column — stacked:**

**Card 1: Pending Courses**
- Graphite bg, 1px border `rgba(244,238,227,0.06)`
- "PENDING" label: Stone, 10px, uppercase
- Big number: count of pending courses. Geist 900, 48px, Linen, -0.04em tracking
- "Review →" link: Amber, 11px, links to `/admin/courses`

**Card 2: Activity (Recent Bookings)**
- "ACTIVITY" label: Stone, 10px, uppercase
- 5 most recent bookings across all members
- Per entry: Amber dot + `[MemberFirstName] booked [CourseName] — [startTime]` in Linen 13px
- Relative timestamp below: Stone, 11px ("2 hours ago", "Yesterday", etc.)

### Zone 4 — Bottom 3-Column Section

Below the content grid. 3 equal columns, each in a bordered container (same as hero stats — 1px border, Graphite bg).

**Column 1: Members by Tier**
- "MEMBERS BY TIER" label
- 3 rows: Casual, Core, Heavy
- Left side: Tier name (13px, 600) + percentage + price on second line (Stone, 11px). Core gets Amber color.
- Right side: count, Geist 900, 36px, Linen, right-aligned

**Column 2: Credit Health**
- "CREDIT HEALTH" label
- 4 rows, each: label left (Linen, 13px) → value right (Geist 900, 28px, Linen)
  - Avg credits used: `(total credits debited this month / total credits granted this month) × 100` → percentage
  - Breakage rate: same as hero stat, shown again for context
  - Rollover live: SUM of amount WHERE type='ROLLOVER_GRANT' and expiresAt > now
  - Avg rounds / member: total bookings this month / count of active members

**Column 3: Top Partner Courses**
- "TOP PARTNER COURSES" label
- 5 courses ranked by total booking count (all time, CONFIRMED+COMPLETED)
- Per row: course name left (Linen, 13px) → booking count right (Geist 900, 20px, Linen)

---

## New Queries Needed

All added to `lib/admin/queries.ts` using `cache()` wrapper.

**`getAdminDashboardStats()`** — single function returning all hero stats:
- Active members count
- MRR (current month + prior month for delta)
- Rounds booked (current month + prior month for delta)
- Credit breakage (rolling 3 months)
- Active courses count + pending count

**`getRecentMembersWithStats(limit=7)`** — members with credit balance and round count:
- JOIN users → credit_ledger (SUM balance) → bookings (COUNT rounds)
- Ordered by createdAt desc, limit 7

**`getRecentBookings(limit=5)`** — for activity feed:
- JOIN bookings → users → teeTimeSlots → courses
- Select: memberFirstName, courseName, startTime, createdAt
- Ordered by bookings.createdAt desc, limit 5

**`getCreditHealthStats()`** — for credit health section:
- Avg credits used % (this month)
- Breakage rate % (rolling 3 months)
- Rollover live total
- Avg rounds per active member (this month)

**`getMembersByTier()`** — for tier breakdown:
- GROUP BY subscriptionTier WHERE subscriptionStatus='active'
- Returns: tier, count, percentage

**`getTopCourses(limit=5)`** — for top courses:
- GROUP BY courseId, JOIN courses for name
- COUNT bookings WHERE status IN (CONFIRMED, COMPLETED)
- ORDER BY count desc, limit 5

---

## File Changes

| File | Action |
|------|--------|
| `app/(admin)/admin/page.tsx` | Rewrite — dashboard instead of redirect |
| `lib/admin/queries.ts` | Add 6 new query functions |
| `components/admin-nav.tsx` | Add "Overview" as first nav tab pointing to `/admin` |

No new files, no schema changes.

---

## Admin Nav Update

Add "Overview" as the first tab in the admin nav, pointing to `/admin`. Current first tab is "Members" at `/admin/members`. The tab order becomes:

Overview → Members → Courses → Credits → Revenue → Payouts → Outreach

---

## Responsive

Not a priority for admin — this is a desktop-only internal tool. But basic stacking at <1200px:
- Hero stats: wrap to 3+2 or 2-column
- Content grid: stack (table above, sidebar below)
- Bottom 3-column: stack vertically
