# Responsive Audit — Round 1 Punch List

**Date:** 2026-04-04
**Scope:** Public marketing + booking funnel (home, /courses, /courses/[slug], /pricing, /login, /signup)
**Method:** Playwright headless chromium, 3 viewports (375, 414, 768), initial-viewport screenshots at `/tmp/gimmelab-responsive-audit/round1-initial/`

## Routes that are FINE

- **`/login`** mobile-sm/lg/tablet — clean, no issues
- **`/signup`** mobile-sm/lg/tablet — clean, no issues
- **`/pricing`** mobile-sm/lg/tablet — clean (minor: "Already a member? Log in →" wraps to 2 lines on mobile-sm but not broken)
- **Homepage hero** mobile-sm/lg — solid, hero text scales well, booking card stacks below on narrow

## P0 — Broken / unusable

### `/courses` filter row — squished at every breakpoint
- Search input truncates to 3 characters wide at 768px ("Sear")
- Zip field also ~3 chars wide at 768px
- Distance pills row wraps and touches the search on narrow widths
- Filter row uses `flex-wrap: wrap` but the children use `flex: 1; min-width: 240px` which breaks when 4+ items compete for space
- **Fix:** Two-row grid layout on mobile-sm/lg/tablet — search on row 1 full-width, zip+find on row 2, distance pills + sort on row 3. Desktop stays inline.

### `/courses` tablet grid density — only 1 card per row at 768px
- `.cb-grid` breakpoint: `@media (max-width: 1080px)` drops to 2 columns, `@media (max-width: 768px)` drops to 1 column
- At 768px (iPad portrait) we're landing on 1 column when 2 would fit comfortably
- **Fix:** Move the 1-column breakpoint to `max-width: 640px`

### Public-nav on `/courses` and `/courses/[slug]` — no mobile nav
- These pages use the "light nav" (`.light-nav-inner`) which hides `.light-nav-links` at `max-width: 768px` but never shows a hamburger fallback
- Navigation is effectively dead on mobile for these pages
- **Fix:** Add a hamburger menu button on the light nav that opens the same full-screen overlay the homepage dark nav uses

## P1 — Clipping / layout bugs

### Course detail hero address text clipping (mobile-sm, mobile-lg)
- Address line "7400 Lansdowne Ave, Philadelphia, PA 19151" overlaps the course title at 375/414
- The hero content stacks but there's no padding guarding the address label behind the title
- **Fix:** Increase `.cd-hero-title` `margin-top` when viewport is narrow, or reduce hero eyebrow absolute positioning

### Course detail stats grid — "Type: Public" clipped at mobile-sm
- Bottom-left stat box "Type: Public" has "blic" showing — the 4-box stats grid isn't collapsing cleanly to 1 column at 375px
- Currently `.cd-stats-row` is `grid-template-columns: repeat(4, 1fr)` with no media query override
- **Fix:** Add `@media (max-width: 640px) { .cd-stats-row { grid-template-columns: repeat(2, 1fr); } }`

### Animated hero buttons on homepage mobile-sm — icon ring overlaps text
- `.ab` pill button has `padding: 4px 56px 4px 24px` to make room for the 40px icon, but on narrow screens "Get started" + "See plans" side-by-side crams the icon rings into the text
- **Fix:** Stack buttons vertically below 480px, or shrink icon ring to 32px

### Home hero booking card on tablet (768px) — cramped text
- When the hero stacks to 1 column, the booking card becomes full-width but inherits the narrow typography from its desktop sidebar treatment
- Tampa Bay · Sat 8:30am · 4 spots line is very small relative to the card width
- **Fix:** Increase meta/credit font sizes in the booking card at tablet+ breakpoint

## P2 — Nice-to-have polish

- Ticker bar text slightly cramped at 375px (could reduce letter-spacing or font-size below 480px)
- Transparent nav wordmark has low contrast over light hero areas (golf course grass) — consider adding a subtle text-shadow on mobile
- Default Next.js 404 page is unbranded (discovered when `/courses/walnut-lane-golf-club` 404'd during audit) — not in scope for this round but noted

## Execution plan

Parallel work streams:
- **Main session:** `/courses` filter row rebuild + tablet grid breakpoint (biggest change, touches both the JSX grid and the CSS)
- **Agent A:** Public-nav hamburger for light nav + fix course detail stats grid + hero address clipping
- **Agent B:** Homepage animated button stacking + booking card tablet typography

After: re-shoot screenshots, diff against round 1, commit.
