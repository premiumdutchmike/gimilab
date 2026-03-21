# Homepage Redesign v2 — Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Phase:** Public marketing

---

## 1. Scope

Rewrite `app/(public)/page.tsx` with a new section structure inspired by the Tenista and Hole design references. Replaces the existing all-black editorial homepage with a lighter, more dynamic design that has a bold, Nike-influenced, young golf energy.

**In scope:**
- `app/(public)/page.tsx` — full rewrite
- `components/public-nav.tsx` — update to sticky frosted glass

**Out of scope:** Pricing page, login/signup (already redesigned), member portal.

---

## 2. Design Language

- **Backgrounds:** Warm cream `#faf9f6` for light sections, `#ffffff` for white sections, `#0d0d0d` for dark sections
- **Accent green:** `#1a5c38` (deep golf green) — used for CTAs, labels, stat strip, badges
- **Highlight green:** `#4ade80` — used for review stars, live pill, callout labels
- **Pale green:** `#f0fdf4` — tinted backgrounds, credit badges
- **Typography:** Geist Sans (already in layout) — 900 weight for all headlines, uppercase, tight letter-spacing
- **Cards:** `border-radius: 12–14px`, subtle box-shadow `0 2px 16px rgba(0,0,0,0.06)`
- **No sharp borders as decoration** — use background color changes and shadows instead
- **Photography:** Full color (no grayscale filter), warm-toned golf imagery via `next/image`

---

## 3. Navigation

Replace current static nav with a sticky frosted glass bar:

```
position: fixed, top: 0, z-index: 100
height: 64px, padding: 0 40px
background: rgba(255,255,255,0.85), backdrop-filter: blur(12px)
border-bottom: 1px solid rgba(0,0,0,0.06)
```

**Left:** `ONEGOLF` wordmark — 13px, weight 900, letter-spacing 3px
**Right:** HOW IT WORKS · COURSES · PRICING · LOG IN · [JOIN NOW] (green filled button, border-radius 6px)

Nav top must be offset in hero (`padding-top: 64px` or just let nav float over).

---

## 4. Sections (top to bottom)

### 4.1 Hero

Full-viewport photo section. Photo: a wide golf course landscape shot (`/public/hero-golf.jpg` or Unsplash placeholder until asset is placed).

- Photo: `brightness(0.55)`, full bleed, `object-position: center 35%`
- Entry animation: subtle zoom-out `scale(1.04 → 1.0)` over 8s on load
- Gradient overlay: `linear-gradient(to bottom, rgba(0,0,0,.2), rgba(0,0,0,.1) 50%, rgba(0,0,0,.65))`
- **Live pill** above headline: frosted glass pill, green pulsing dot, "Now live in your area"
- **Headline:** "ONE" / "GOLF" — `clamp(90px, 16vw, 220px)`, weight 900, centered
- **Bottom strip:** tagline left, GET STARTED (white filled) + SEE PRICING → (ghost) right

### 4.2 Marquee

Thin scrolling ticker, white background:
- Items: MONTHLY CREDITS · ✦ ANY COURSE · ZERO BOOKING FEES · ✦ CANCEL ANYTIME · FROM $99 / MO · ✦ 03 TIERS
- Green `✦` dividers are accent colored, text items are `#c4c4c0`
- `border-bottom: 1px solid #e5e7eb`

### 4.3 Editorial (Tenista-inspired)

Warm cream background. Two-column grid:

**Left column — copy:**
- Green label: "ONE MEMBERSHIP"
- Headline: `clamp(40px, 5vw, 64px)` weight 900 uppercase — "GOLF, ON YOUR TERMS."
- Body text: 14px, `#6b7280`
- **3 step rows** below copy, each: number (green) + title + → arrow. Hover slides right by 8px.

**Right column — floating cards (Tenista-style):**
- 3 photo cards, absolutely positioned, slightly rotated (-3°, +2.5°, -1.5°), `border-radius: 12px`
- Card A: 230×300px, rotate -3deg, top-left
- Card B: 200×270px, rotate +2.5deg, center
- Card C: 180×240px, rotate -1.5deg, right
- Each has a gradient overlay label at bottom
- Hover on any card: lifts 6px, rotation returns to 0°
- **2 floating badges** (white card, shadow, `border-radius: 12px`): "$0 / Booking Fees" and "3× / Tier options". Subtle float animation (translateY 0 → -6px, 3s loop).
- Ghosted background text "PLAY" — `color: rgba(0,0,0,0.04)`, oversized, behind everything

### 4.4 Stats Strip

Full-width, 4-column grid. Background: `#1a5c38` (green).

| Stat | Label |
|------|-------|
| 03 | Membership Tiers |
| $99 | Starting per month |
| 0 | Booking Fees. Ever. |
| ∞ | Partner courses |

Each block: `padding: 40px 36px`, `border-right: 1px solid rgba(255,255,255,0.1)`.
Stat number: 52px weight 900, white. Label: 10px uppercase, `rgba(255,255,255,0.45)`.

### 4.5 Savings

White background. Shows the financial case for OneGolf.

**Headline:** "PLAY MORE. SPEND LESS." — large, with "SPEND LESS." in green
**Sub:** brief copy about $85 avg green fee

**Side-by-side comparison** (`border-radius: 16px` container, 2px gap):
- Left (cream): "Without OneGolf" — 36 rounds × $85 = $3,240/yr
- Right (green `#1a5c38`): "With OneGolf Core" — $149 × 12 = $1,788/yr

**Callout strip** below (black): "YOU SAVE · $1,452 / year · That's a new driver. New irons. Both." + green CTA button.

### 4.6 Top Courses

Cream background. Horizontal scroll of course cards.

**Header:** "TOP COURSES" left, "View all courses →" right

**Course card** (`width: 270px`, `border-radius: 14px`, white bg, shadow):
- Photo top (190px, zoom on hover)
- Featured badge (green filled) or category badge (white)
- Course name (15px weight 800)
- Location left, credits badge right (green pale bg)

Cards are **draggable** — mousedown/move to scroll.

> Note: In production, courses are fetched from DB. For MVP, render top 5 partner courses. If no courses, show a minimal "Coming soon" placeholder rather than hiding the section.

### 4.7 Reviews

Dark background `#0d0d0d`. Carousel of 5 reviews, 3 visible at a time.

**Header:** green label "MEMBER REVIEWS", white headline "GOLFERS LOVE IT." + prev/next buttons (circle, 40px)

**Review card** (dark frosted, `border-radius: 16px`):
- Green stars `★ ★ ★ ★ ★`
- Quote with key phrases in white/bold
- Avatar + name + tier + duration
- Hover: lifts 4px, border tints green `rgba(74,222,128,.3)`

**Navigation:** prev/next buttons + dot indicators. Auto-advances every 5s.

**Green glows:** 2 radial gradients (top-right and bottom-left) for depth.

### 4.8 Dark CTA

Two-column grid, min-height 520px:
- **Left:** full-bleed golfer photo (warm, color)
- **Right** (black bg): green label + "READY TO PLAY?" headline + body copy + GET STARTED (green) + View pricing → (outline)

### 4.9 Footer

Black background:
- Top bar: ONEGOLF wordmark + nav links + © 2026
- Giant "ONEGOLF" text at bottom — `clamp(70px, 14vw, 190px)`, color `#111` (barely visible, typographic texture)

---

## 5. Interactivity

| Feature | Implementation |
|---------|---------------|
| Review carousel | JS: translate track by card width × index, auto-advance 5s |
| Draggable course scroll | JS: mousedown/move on scroll container |
| Floating badge animation | CSS: `@keyframes float`, 3s loop, alternating delays |
| Hero zoom | CSS: `@keyframes heroZoom`, scale 1.04→1 over 8s |
| Marquee | CSS: `@keyframes marquee`, infinite |
| Step row hover | CSS: `padding-left` transition |
| Card hover | CSS: `transform: translateY(-6px)`, shadow increase |
| Nav scroll blur | Already handled by `position:fixed` + `backdrop-filter` |

---

## 6. Images

The hero and editorial cards require real photography. Until `/public/hero-golf.jpg` is placed, use:
```tsx
const HERO_IMAGE_READY = false // flip to true when image is placed
```
When false, render a `#111` background as fallback. The rest of the page renders normally.

Course photos come from `course.photos[0]` (DB field). Use `next/image` with `fill` and appropriate `sizes`.

For editorial floating cards — use 3 stock golf photos (Unsplash, free license). Store in `/public/editorial-1.jpg`, `/editorial-2.jpg`, `/editorial-3.jpg`.

---

## 7. File Changes

| File | Action |
|------|--------|
| `app/(public)/page.tsx` | Full rewrite |
| `components/public-nav.tsx` | Update: sticky + frosted glass |

No new component files needed — page is self-contained.

---

## 8. Verification

```
npm run dev → localhost:3002
```

- [ ] Nav is sticky and frosted on scroll
- [ ] Hero photo loads, zoom animation plays once
- [ ] Marquee scrolls continuously
- [ ] Floating cards tilt correctly, hover lifts + straightens
- [ ] Green stats strip shows all 4 stats
- [ ] Savings comparison renders 2 columns + callout
- [ ] Courses scroll is draggable
- [ ] Reviews auto-advance every 5s, prev/next + dots work
- [ ] Dark CTA photo loads
- [ ] Footer giant text renders
- [ ] GET STARTED links to `/signup`, PRICING links to `/pricing`, LOG IN to `/login`
