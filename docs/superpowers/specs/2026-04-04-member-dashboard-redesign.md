# Member Dashboard Redesign — "The Lab Report"

**Date:** 2026-04-04
**Phase:** 1 of 4 (Dashboard > Booking email > Rounds page > Sign-up flow)
**Approach:** Dark, typographic, data-as-art — inspired by Gimmelab moodboard

---

## Overview

Redesign the member dashboard from a light, card-based portal layout to a dark, editorial, data-forward "lab report" interface. Numbers become the visual hero. Chrome is stripped to the minimum. The page reads like a cockpit — you walk in and see your data.

**Reference material:**
- `/Marketing/Briefs/GIMMELAB_MOODBOARD.html` — curated Pinterest board analysis
- Brand guidelines at `/branding_examples/brand_kit_FINAL/Gimilab_Design_Brief.md`
- Pinterest board: pinterest.com/mikemelchiot/gimmelab-ui-clean

**Key design principles (from moodboard):**
- Numbers are the anchor — big, readable, with intention
- Type carries the brand — no filler, no decoration
- Remove everything that doesn't need to be there
- Data should feel calm and editorial, not clinical
- No green, no pure white, no pure black — brand palette only

---

## Color Palette (exact, no substitutions)

| Token | Hex | Usage on dashboard |
|-------|-----|--------------------|
| Midnight | `#0C0C0B` | Page background, topbar bg, input text |
| Graphite | `#1E1D1B` | Activity card bg, input bg, hint chip bg |
| Amber | `#BF7B2E` | Credit balance, next tee time, CTA button, positive amounts |
| Linen | `#F4EEE3` | Primary text (greeting, stat numbers, activity titles) |
| Stone | `#847C72` | Labels, subtitles, dates, secondary text, negative amounts |
| Smoke | `#E5DDD3` | Dividers at 6% opacity only |
| Off-White | `#FDFAF6` | Not used on dashboard (reserved for light pages) |

---

## Typography

| Element | Font | Weight | Size | Tracking | Color |
|---------|------|--------|------|----------|-------|
| Greeting | Nunito | 900 | 48px (32px mobile) | -0.025em | Linen |
| Date label | Inter | 700 | 11px | 0.12em | Stone |
| Stat numbers | Nunito | 900 | 64px (48px mobile) | -0.03em | Linen or Amber |
| Stat labels | Inter | 700 | 10px | 0.12em | Stone |
| Stat sub-text | Inter | 400 | 12px | normal | Stone |
| Section headers | Inter | 700 | 10px | 0.12em | Stone |
| Activity title | Inter | 600 | 13px | normal | Linen |
| Activity subtitle | Inter | 400 | 11px | normal | Stone |
| Credit amounts | Geist Mono | 700 | 13px | normal | Amber (positive) / Stone (negative) |
| Activity date | Inter | 400 | 11px | normal | Stone |
| Wordmark | Nunito | 900 | 20px | -0.03em | Linen |
| CTA button | Inter | 700 | 11px | 0.08em | Midnight on Amber bg |

All stat labels and section headers are uppercase.

---

## Layout Sections (top to bottom)

### 1. Sticky Topbar

- Background: Midnight
- Border-bottom: 1px `Linen` at 6% opacity
- Height: ~56px
- Sticky at top, z-index 50

**Left:** `gimmelab` wordmark (Nunito 900, 20px, Linen, lowercase, -0.03em tracking)

**Right:**
- Credit chip: Amber number + "CREDITS" Stone label, inline — no card/border
- "BOOK TEE TIME" button: Amber bg, Midnight text, Inter 700, 11px, uppercase, 0.08em tracking, 2px border-radius max (brand rule: no pill buttons)

**Mobile:** Wordmark hides (present in nav), credit chip + CTA remain.

### 2. Hero Zone — Greeting

- Background: Midnight (continuous with topbar)
- Padding: 80px top, 48px bottom (40px/32px mobile)
- Left-aligned, same horizontal padding as content (36px desktop, 24px mobile)

**Structure:**
1. Date: `FRIDAY, APRIL 4, 2026` — Stone, Inter 700, 11px, uppercase, 0.12em tracking
2. Greeting: `Good evening, Mike.` — Linen, Nunito 900, 48px (32px mobile), -0.025em tracking

Date sits above greeting. Period at the end of greeting, no exclamation mark, no emoji. Greeting function uses time-of-day logic (morning/afternoon/evening) — already exists in codebase.

### 3. Stats Strip

- Background: Midnight (continuous, no visual break from greeting)
- 4-column grid, evenly spaced
- Padding-bottom: 48px, then 1px divider (Smoke at 6% opacity)

**Columns:**

| # | Label | Value | Sub-text | Value color |
|---|-------|-------|----------|-------------|
| 1 | CREDITS | `127` | `/ 170` + `resets May 1` | Amber |
| 2 | ROUNDS | `4` | `this month` | Linen |
| 3 | COURSES | `3` | `visited` | Linen |
| 4 | NEXT TEE TIME | `2d 14h` | `Sat 8:20 AM` + `Torrey Pines` | Amber |

**Per column structure:**
- Label: Stone, Inter 700, 10px, uppercase, 0.12em tracking — top
- Value: Nunito 900, 64px (48px mobile), -0.03em tracking — middle, dominant
- Sub-text: Stone, Inter 400, 12px — bottom

**Credits column specifics:**
- Value is just the number (`127`) in Amber
- Sub-text line 1: `/ 170` where `170` comes from tier max (casual=100, core=170, heavy=250). The `/` and denominator are Stone, lighter weight
- Sub-text line 2: `resets May 1` in Stone

**Next Tee Time specifics:**
- Value is a countdown: `2d 14h` in Amber. Server-rendered on page load (no client-side timer — CLAUDE.md says default to Server Components, and a live countdown adds complexity for minimal value)
- Sub-text line 1: `Sat 8:20 AM` — the actual date/time
- Sub-text line 2: course name in Stone
- If no upcoming booking: value is `--`, sub-text is `No rounds booked`

**Mobile:** 2x2 grid, numbers drop to 48px.

**New data queries needed:**
- Courses visited: `SELECT COUNT(DISTINCT "courseId") FROM bookings WHERE "userId" = ? AND status IN ('CONFIRMED','BOOKED','COMPLETED') AND created_at > first_of_month`
- Next tee time: `SELECT bookings.*, tee_time_slots.date, tee_time_slots.start_time, courses.name FROM bookings JOIN tee_time_slots ... JOIN courses ... WHERE userId = ? AND status IN ('CONFIRMED','BOOKED') AND date >= today ORDER BY date, start_time LIMIT 1`

### 4. Activity Feed

- Background: Midnight
- Starts below the 1px Smoke divider from stats strip

**Header row:**
- Left: `RECENT ACTIVITY` — Stone, Inter 700, 10px, uppercase, 0.12em tracking
- Right: `View all -->` — Stone 11px, hover color Amber, links to `/rounds`
- Margin-bottom: 12px

**Activity card:**
- Single Graphite (`#1E1D1B`) container with 1px border (`Linen` at 6% opacity)
- Contains up to 5 rows
- Rows separated by 1px dividers (`Linen` at 6% opacity) — internal, not between cards
- Row padding: 14px vertical, 18px horizontal
- Row hover: background shifts to `Linen` at 3% opacity

**Per row:**
- Left block: Title (Linen, Inter 600, 13px) + Subtitle (Stone, Inter 400, 11px)
- Right-center: Amount in Geist Mono 700, 13px. Positive = Amber (`+170 cr.`), negative = Stone (`-12 cr.`)
- Far right: Date in Stone, Inter 400, 11px, right-aligned, fixed 56px width

**No dots, no icons.** Text only. The moodboard says remove what doesn't need to be there.

**Empty state:** `No activity yet.` — Stone, 13px, centered inside the Graphite card, 20px padding.

**Data source:** Same `recentLedger` query (5 most recent credit_ledger entries). No changes needed.

### 5. AI Search

- Background: Midnight
- Below activity feed, 28px gap

**Header:**
- Left: `FIND A TEE TIME` — Stone, Inter 700, 10px, uppercase
- Right: `Beta` badge — Amber text, Amber/10% bg, 1px Amber/18% border, 9px, uppercase

**Input row:**
- Input: Graphite bg, 1px Smoke at 6% border, Linen text, Stone placeholder, Inter 13px, 12px 16px padding
- Submit button: Amber bg, Midnight text, Inter 700, 11px, uppercase, 0.08em tracking. Contains search icon + "SEARCH"
- 2px border-radius on both

**Hint chips below input:**
- `Tomorrow, 8am` / `Within 20 miles` / `2 players`
- Graphite bg, 1px Linen at 8% border, Stone text, Inter 10px
- 2px border-radius, 1px 6px padding
- 8px gap between chips, 8px margin-top

**No outer container** — input row sits directly on Midnight.

---

## Removed Elements

| Element | Reason |
|---------|--------|
| Quick Actions grid (4 cards) | Redundant with nav + topbar CTA. Moodboard: "remove everything that doesn't need to be there" |
| Credit progress bar | Replaced by the `/170` fraction in stats strip — more editorial, less clinical |
| White backgrounds | Entire dashboard is now Midnight + Graphite |
| Activity dots | Unnecessary visual noise — amounts already indicate credit/debit |
| Stat cards with borders | Stats are free-standing numbers on Midnight, no containers |
| Member Since stat | Replaced by Courses Visited (more interesting/actionable) |

---

## Responsive Behavior

| Breakpoint | Changes |
|------------|---------|
| Desktop (>900px) | 4-column stats, full topbar with wordmark |
| Tablet (641-900px) | 2x2 stats grid, topbar wordmark hides |
| Mobile (<640px) | 2x2 stats grid, stat numbers 48px, greeting 32px, activity amounts stack below title on very narrow screens |

---

## Animations (Motion)

- **Credit balance**: Counter animation on mount (0 -> actual value, 600ms ease-out) — already exists conceptually, apply to the big 64px number
- **Stats strip**: Staggered fade-in on mount — each column fades in 100ms apart (left to right)
- **Activity rows**: Subtle fade-in on mount, 50ms stagger
- **No parallax, no heavy effects** — brand rule

---

## Data Changes Summary

| Query | Status | Notes |
|-------|--------|-------|
| `getCreditBalance(userId)` | Existing | No change |
| Upcoming bookings count | Existing | No change (used for stat) |
| Monthly rounds count | Existing | No change |
| Recent ledger (5 entries) | Existing | No change |
| User record (name, tier, createdAt) | Existing | No change |
| Courses visited this month | **New** | `COUNT(DISTINCT courseId)` from bookings |
| Next tee time details | **New** | First upcoming booking with slot + course join |

Both new queries are simple index-friendly joins on existing tables. No schema changes needed.

---

## File Changes

| File | Action |
|------|--------|
| `app/(member)/dashboard/page.tsx` | Rewrite — new layout, styles, 2 new queries |
| `app/globals.css` | May need Nunito 900 font-face if not already loaded for member pages |
| `app/layout.tsx` | Verify Nunito is loaded (it is — confirmed in exploration) |

No new files. No new components. The dashboard is a single Server Component page with inline styles (matching the existing pattern).
