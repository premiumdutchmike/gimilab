# Pricing Page Redesign — Design Spec

**Date:** 2026-03-20
**Status:** Draft
**Phase:** 3

---

## 1. Scope

Redesign `app/(public)/pricing/page.tsx` from the old dark card style (`#090f1a` bg, rounded cards) to the B&W editorial aesthetic established in the public homepage spec.

**In scope:**
- `app/(public)/pricing/page.tsx` — page layout rewrite
- `components/pricing-tier-card.tsx` — new component (replaces `pricing-tier-row.tsx`)
- `components/pricing-comparison.tsx` — new static feature comparison grid

**Out of scope:** DB schema, subscription logic, Stripe integration, rollover (not used).

---

## 2. Design Language

This page uses the **B&W editorial design system** — not the legacy dark theme defined in `CLAUDE.md` (which applies to member/partner/admin portals only). Public marketing pages use the editorial system established in `docs/superpowers/specs/2026-03-20-public-homepage-member-nav-design.md`.

- Background: `#000`, foreground: `#fff`
- No border-radius anywhere
- `1px solid #1a1a1a` for dividers; `1px solid #222` for inactive card borders; `1px solid #fff` for featured card border
- Typography: **Geist Sans** (not Inter), uppercase, tight letter-spacing, weight contrast (900 headlines vs 10px small-caps labels)
- Mono values: **`var(--font-geist-mono)`** (not JetBrains Mono) for credits numbers
- No icons, no gradients, no shadows

---

## 3. Page Layout

**Route:** `app/(public)/pricing/page.tsx`
**Type:** Server Component — fetches tiers from DB via `db.select().from(subscriptionTiers)`
**Max content width:** `860px`, centered, `padding: 0 24px`
**Background:** `#000`, `min-h-screen`

**DB field mapping:** The page destructures only the needed fields before passing to components — discarding `rolloverMax`, `stripePriceId`, and any other DB columns not in the component props:
```ts
const tiers = await db.select().from(subscriptionTiers)
// Pass only what components need:
tiers.map(({ id, name, monthlyPriceCents, monthlyCredits }) => ...)
```

**Empty state:** If `tiers` is an empty array (e.g. DB not seeded), render a minimal fallback in place of the tier blocks:
```
<p style={{ color: '#444', fontSize: '13px', textAlign: 'center', padding: '48px 0' }}>
  Plans unavailable. Please try again later.
</p>
```

Sections top to bottom:

1. Section label bar
2. Page headline
3. Three tier blocks
4. Feature comparison
5. Footer reassurance

---

## 4. Section Label Bar

Reuses the pattern from the homepage "How It Works" section:

```
border-top: 1px solid #1a1a1a
border-bottom: 1px solid #1a1a1a
padding: 12px 0
flex row, space-between
Left:  "MEMBERSHIP PLANS"
Right: "03 TIERS"   ← intentionally hard-coded string; tier count is fixed by product design
Both:  font-size: 10px, font-weight: 600, letter-spacing: 2px, text-transform: uppercase, color: #444
```

---

## 5. Page Headline

`padding: 48px 0 32px`

```
CHOOSE         ← font-size: clamp(56px, 10vw, 96px), font-weight: 900, uppercase, color: #fff, letter-spacing: -2px
YOUR PLAN      ← same, second line
```

Sub-label below headline:
```
"Credits refresh monthly · Any partner course · Zero booking fees"
font-size: 11px, color: #444, letter-spacing: 2px, text-transform: uppercase
margin-top: 12px
```

---

## 6. Tier Blocks — `components/pricing-tier-card.tsx`

Three blocks stacked vertically, `gap: 0` (adjacent borders collapse to 1px). No border-radius anywhere.

**Props:**
```ts
interface PricingTierCardProps {
  id: string               // 'casual' | 'core' | 'heavy'
  name: string
  monthlyPriceCents: number
  monthlyCredits: number
  featured?: boolean       // hard-coded as `tier.id === 'core'` in the page — no DB column
}
```

**Block structure (per tier):**

### Header row
```
border-bottom: 1px solid #222
padding: 16px 24px
flex row, space-between, align-center

Left:  tier name — 10px, font-weight: 600, letter-spacing: 2px, uppercase, color: #444
Right: "RECOMMENDED" label (featured only) — 10px, font-weight: 600, letter-spacing: 2px, uppercase, color: #fff
```

### Body row
```
padding: 24px 24px
flex row, align-center, space-between

Left block:
  - Credit count: e.g. "100" — font-size: 64px, font-family: var(--font-geist-mono), font-weight: 400, color: #fff, line-height: 1
  - "credits / month" label — font-size: 11px, color: #444, uppercase, letter-spacing: 2px, margin-top: 4px

Right block:
  - Price: e.g. "$99 / MO" — font-size: 36px, font-weight: 900, color: #fff
```

### CTA row
```
border-top: 1px solid #222
padding: 16px 24px
flex row, justify-end

Button label: "JOIN {NAME} →" — e.g. "JOIN CASUAL →", "JOIN CORE →", "JOIN HEAVY →"
  All uppercase, letter-spacing: 2px

Button — links to /signup?plan={id}
  Inactive (Casual, Heavy):
    border: 1px solid #444, color: #fff, background: transparent
    font-size: 11px, font-weight: 600, letter-spacing: 2px, uppercase, padding: 10px 28px
    no border-radius
    hover: border-color: #fff (brightens border on hover)
  Featured (Core):
    background: #fff, color: #000
    same sizing
    hover: background: #e5e5e5
```

**Price display format:** Divide `monthlyPriceCents` by 100, strip `.00`, render as integer — e.g. `9900 → "$99 / MO"`. Use `Math.floor(monthlyPriceCents / 100)` — no `.toFixed(2)`.

**Block border:**
- Inactive: `border: 1px solid #222`
- Featured (Core): `border: 1px solid #fff`

---

## 7. Feature Comparison — `components/pricing-comparison.tsx`

**Type:** Client Component not needed — pure static, Server Component.

### Section label bar
```
border-top: 1px solid #1a1a1a
border-bottom: 1px solid #1a1a1a
padding: 12px 0
flex row, space-between
Left:  "PLAN COMPARISON"
Right: "03 FEATURES"
10px, font-weight: 600, letter-spacing: 2px, uppercase, color: #444
```

### Column headers row
```
display: grid
grid-template-columns: 2fr 1fr 1fr 1fr
padding: 12px 0
border-bottom: 1px solid #111

Col 1: empty
Col 2: "CASUAL"
Col 3: "CORE"     ← color: #fff (others: #555)
Col 4: "HEAVY"
All: 10px, font-weight: 600, letter-spacing: 2px, uppercase, text-align: center
```

### Data rows
Three rows, each `border-bottom: 1px solid #111`, `padding: 16px 0`:

```
grid-template-columns: 2fr 1fr 1fr 1fr

Row 1: "MONTHLY CREDITS"    100    150    210
Row 2: "BOOKING FEE"        —      —      —
Row 3: "COURSES"            All    All    All
```

Feature label (col 1): `12px`, `color: #444`, uppercase, `letter-spacing: 1px`
Values (cols 2–4): `14px`, `font-family: var(--font-geist-mono)`, `color: #fff`, `text-align: center`
Core column values: `color: #fff` (same as others — the border on the tier block already signals recommended)

**Props:**
```ts
interface PricingComparisonProps {
  tiers: Array<{ id: string; monthlyCredits: number }>
}
```
Values for booking fee and courses are static (`—` and `All`). Monthly credits come from DB data passed down from the page.

**Mobile (below 640px):** The comparison grid adds `overflow-x: auto` on its wrapper so the 4-column grid scrolls horizontally rather than overflowing the viewport. Tier blocks stack cleanly — the body flex row (credit count left, price right) stays as a row at all widths since both values are short.

---

## 8. Footer Reassurance

```
border-top: 1px solid #1a1a1a
padding: 32px 0
margin-top: 0
flex row, space-between, align-center

Left:  "Cancel anytime · No contracts · Credits refresh monthly"
       font-size: 11px, color: #333, uppercase, letter-spacing: 1px

Right: "← BACK TO HOME" — Next.js Link to /
       font-size: 11px, color: #444, uppercase, letter-spacing: 1px
       hover: color: #fff
```

---

## 9. Removed / Replaced

| Old | New |
|-----|-----|
| `components/pricing-tier-row.tsx` | Replaced by `components/pricing-tier-card.tsx` |
| `bg: #090f1a` | `bg: #000` |
| Rounded card style | Sharp bordered blocks |
| Rollover references | Removed entirely — not implemented |

---

## 10. File Order

1. Create `components/pricing-tier-card.tsx`
2. Create `components/pricing-comparison.tsx`
3. Rewrite `app/(public)/pricing/page.tsx`
4. (Optional) Delete `components/pricing-tier-row.tsx` if no longer referenced elsewhere

---

## 11. Verification

```
npm run dev
```

Navigate to `http://localhost:3000/pricing`:
- Black background, no rounded corners anywhere
- Three tier blocks visible: Casual ($99), Core ($149, white border, RECOMMENDED label), Heavy ($199)
- Credit counts in large mono type (100 / 150 / 210)
- Core CTA button is filled white/black; others are outlined
- Feature comparison renders with 3 rows, Core column header is white
- Clicking `[JOIN CASUAL →]` navigates to `/signup?plan=casual` (same for core, heavy)
- Footer shows reassurance text and back link
- Mobile: content stacks cleanly within padding, no overflow
