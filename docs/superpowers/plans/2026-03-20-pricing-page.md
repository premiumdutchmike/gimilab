# Pricing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/pricing` from the old dark rounded-card style to the B&W editorial aesthetic — sharp-bordered tier blocks, large mono credit counts, feature comparison grid.

**Architecture:** Three new/modified files. `PricingTierCard` (Server Component, replaces `PricingTierRow`) renders one tier block. `PricingComparison` (Server Component) renders the static feature grid. The page fetches tiers from DB, sorts them, and passes only the needed fields to each component. `PricingTierRow` is deleted after confirming it has no other consumers.

**Tech Stack:** Next.js 16 App Router, Server Components, Tailwind v4, Drizzle ORM, Vitest

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/pricing-tier-card.tsx` | Single tier block — header, credit count, price, CTA link |
| Create | `components/pricing-comparison.tsx` | Feature comparison grid (static + DB credits) |
| Create | `components/__tests__/pricing-tier-card.test.ts` | Unit test for `formatPrice` utility |
| Modify | `app/(public)/pricing/page.tsx` | Fetch, sort, render new components |
| Modify | `package.json` | Add `"test"` script |
| Delete | `components/pricing-tier-row.tsx` | Replaced — remove after confirming no other consumers |

---

## Task 1: Add test script and write failing test for `formatPrice`

**Files:**
- Modify: `package.json`
- Create: `components/__tests__/pricing-tier-card.test.ts`

The one piece of logic in this feature is price formatting: `monthlyPriceCents` (e.g. `9900`) → `"$99 / MO"` (integer, no decimals). We test the pure function before writing the implementation.

- [ ] **Step 1: Add test script to `package.json`**

Open `package.json`. In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Result:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "seed:demo": "npx tsx scripts/seed-demo.ts",
  "test": "vitest run",
  "test:watch": "vitest"
},
```

- [ ] **Step 2: Create the test directory and write a failing test**

Create `components/__tests__/pricing-tier-card.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatPrice } from '@/components/pricing-tier-card'

describe('formatPrice', () => {
  it('formats 9900 cents as "$99 / MO"', () => {
    expect(formatPrice(9900)).toBe('$99 / MO')
  })

  it('formats 14900 cents as "$149 / MO"', () => {
    expect(formatPrice(14900)).toBe('$149 / MO')
  })

  it('strips decimals — 9999 cents renders as "$99 / MO" not "$99.99"', () => {
    expect(formatPrice(9999)).toBe('$99 / MO')
  })

  it('formats 19900 cents as "$199 / MO"', () => {
    expect(formatPrice(19900)).toBe('$199 / MO')
  })
})
```

- [ ] **Step 3: Run the test — confirm it fails with "Cannot find module"**

```bash
cd "/Users/dutchmike/Desktop/Claude Agents/OneGolf/V1/onegolf"
npm test
```

Expected output: FAIL — `Cannot find module '@/components/pricing-tier-card'`

- [ ] **Step 4: Commit the test file and package.json change**

```bash
git add package.json components/__tests__/pricing-tier-card.test.ts
git commit -m "test: add formatPrice unit test for pricing-tier-card"
```

---

## Task 2: Create `PricingTierCard` component

**Files:**
- Create: `components/pricing-tier-card.tsx`

Server Component. No `'use client'` — uses `<Link>` instead of `useRouter`. Exports `formatPrice` as a named export so the test can import it.

**Design reminders:**
- `#000` background (page sets this; the card itself has no background — it inherits)
- No border-radius anywhere
- `border: 1px solid #222` inactive, `border: 1px solid #fff` featured (Core)
- Font: Tailwind `font-mono` class maps to Geist Mono (configured in `app/globals.css` via `--font-mono`)
- `font-black` = `font-weight: 900` in Tailwind

- [ ] **Step 1: Create the component**

Create `components/pricing-tier-card.tsx`:

```tsx
import Link from 'next/link'

interface PricingTierCardProps {
  id: string               // 'casual' | 'core' | 'heavy'
  name: string
  monthlyPriceCents: number
  monthlyCredits: number
  featured?: boolean       // hard-coded as `tier.id === 'core'` in the page — no DB column
}

/** Exported for unit testing. Converts cents to integer dollar display. */
export function formatPrice(cents: number): string {
  return `$${Math.floor(cents / 100)} / MO`
}

export function PricingTierCard({
  id,
  name,
  monthlyPriceCents,
  monthlyCredits,
  featured,
}: PricingTierCardProps) {
  return (
    <div
      className={
        featured
          ? 'border border-white'
          : 'border border-[#222] -mt-px first:mt-0'
      }
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
          {name}
        </span>
        {featured && (
          <span className="text-[10px] font-semibold tracking-[2px] uppercase text-white">
            RECOMMENDED
          </span>
        )}
      </div>

      {/* Body row */}
      <div className="flex items-center justify-between px-6 py-6">
        <div>
          <div className="font-mono text-[64px] font-normal text-white leading-none">
            {monthlyCredits}
          </div>
          <div className="text-[11px] text-[#444] uppercase tracking-[2px] mt-1">
            credits / month
          </div>
        </div>
        <div className="text-[36px] font-black text-white">
          {formatPrice(monthlyPriceCents)}
        </div>
      </div>

      {/* CTA row */}
      <div className="flex justify-end px-6 py-4 border-t border-[#222]">
        <Link
          href={`/signup?plan=${id}`}
          className={
            featured
              ? 'bg-white text-black text-[11px] font-semibold tracking-[2px] uppercase px-7 py-2.5 transition-colors hover:bg-[#e5e5e5]'
              : 'border border-[#444] text-white text-[11px] font-semibold tracking-[2px] uppercase px-7 py-2.5 transition-colors hover:border-white'
          }
        >
          JOIN {name.toUpperCase()} →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests — confirm they pass**

```bash
npm test
```

Expected output:
```
 ✓ components/__tests__/pricing-tier-card.test.ts (4)
   ✓ formatPrice > formats 9900 cents as "$99 / MO"
   ✓ formatPrice > formats 14900 cents as "$149 / MO"
   ✓ formatPrice > strips decimals — 9999 cents renders as "$99 / MO" not "$99.99"
   ✓ formatPrice > formats 19900 cents as "$199 / MO"

 Test Files  1 passed (1)
 Tests       4 passed (4)
```

- [ ] **Step 3: Commit**

```bash
git add components/pricing-tier-card.tsx
git commit -m "feat: add PricingTierCard component (B&W editorial style)"
```

---

## Task 3: Create `PricingComparison` component

**Files:**
- Create: `components/pricing-comparison.tsx`

Server Component. Pure static except for monthly credits which come from DB data via props. The comparison grid scrolls horizontally on mobile via `overflow-x-auto`. No unit tests needed — zero business logic.

- [ ] **Step 1: Create the component**

Create `components/pricing-comparison.tsx`:

```tsx
interface PricingComparisonProps {
  tiers: Array<{ id: string; monthlyCredits: number }>
}

// Column display order is guaranteed by the page (sorted to casual/core/heavy)
const TIER_LABELS: Record<string, string> = {
  casual: 'CASUAL',
  core: 'CORE',
  heavy: 'HEAVY',
}

export function PricingComparison({ tiers }: PricingComparisonProps) {
  return (
    <div>
      {/* Section label bar */}
      <div className="flex items-center justify-between py-3 border-t border-b border-[#1a1a1a]">
        <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
          PLAN COMPARISON
        </span>
        <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
          03 FEATURES
        </span>
      </div>

      {/* Scrollable table — overflow-x-auto for mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] py-3 border-b border-[#111]">
            <div />
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`text-center text-[10px] font-semibold tracking-[2px] uppercase ${
                  tier.id === 'core' ? 'text-white' : 'text-[#555]'
                }`}
              >
                {TIER_LABELS[tier.id] ?? tier.id.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Monthly Credits row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center py-4 border-b border-[#111]">
            <div className="text-[12px] text-[#444] uppercase tracking-[1px]">
              Monthly Credits
            </div>
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="text-center font-mono text-[14px] text-white"
              >
                {tier.monthlyCredits}
              </div>
            ))}
          </div>

          {/* Booking Fee row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center py-4 border-b border-[#111]">
            <div className="text-[12px] text-[#444] uppercase tracking-[1px]">
              Booking Fee
            </div>
            {tiers.map((tier) => (
              <div key={tier.id} className="text-center font-mono text-[14px] text-white">
                —
              </div>
            ))}
          </div>

          {/* Courses row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center py-4 border-b border-[#111]">
            <div className="text-[12px] text-[#444] uppercase tracking-[1px]">
              Courses
            </div>
            {tiers.map((tier) => (
              <div key={tier.id} className="text-center font-mono text-[14px] text-white">
                All
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/pricing-comparison.tsx
git commit -m "feat: add PricingComparison static feature grid"
```

---

## Task 4: Rewrite `app/(public)/pricing/page.tsx`

**Files:**
- Modify: `app/(public)/pricing/page.tsx`

Fetch tiers from DB, sort to `['casual', 'core', 'heavy']` order, pass `rolloverPct` to components (Casual: 0, Core: 0.10, Heavy: 0.15), discard `stripePriceId` and other unused DB fields. Render new components. Empty state if DB returns nothing.

**Note:** The public layout (`app/(public)/layout.tsx`) already renders `<PublicNav>` — no nav needed in this page.

- [ ] **Step 1: Rewrite the page**

Replace the full contents of `app/(public)/pricing/page.tsx`:

```tsx
import Link from 'next/link'
import { db } from '@/lib/db'
import { subscriptionTiers } from '@/lib/db/schema'
import { PricingTierCard } from '@/components/pricing-tier-card'
import { PricingComparison } from '@/components/pricing-comparison'

export const metadata = {
  title: 'Plans — OneGolf',
}

const TIER_ORDER = ['casual', 'core', 'heavy']

export default async function PricingPage() {
  const rawTiers = await db.select().from(subscriptionTiers)

  // Sort to canonical order; pass rolloverPct, discard unused DB fields
  const tiers = rawTiers
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.id) - TIER_ORDER.indexOf(b.id)
    )
    .map(({ id, name, monthlyPriceCents, monthlyCredits, rolloverPct }) => ({
      id,
      name,
      monthlyPriceCents,
      monthlyCredits,
      rolloverPct, // 0 = Casual (no rollover), 0.10 = Core, 0.15 = Heavy
    }))

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-[860px] mx-auto px-6">

        {/* Section label bar */}
        <div className="flex items-center justify-between py-3 border-t border-b border-[#1a1a1a]">
          <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
            MEMBERSHIP PLANS
          </span>
          <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
            03 TIERS
          </span>
        </div>

        {/* Page headline */}
        <div className="pt-12 pb-8">
          <h1
            className="font-black uppercase leading-none text-white"
            style={{
              fontSize: 'clamp(56px, 10vw, 96px)',
              letterSpacing: '-2px',
            }}
          >
            CHOOSE
            <br />
            YOUR PLAN
          </h1>
          <p className="text-[11px] text-[#444] uppercase tracking-[2px] mt-3">
            Credits refresh monthly · Any partner course · Zero booking fees
          </p>
        </div>

        {/* Tier blocks */}
        {tiers.length === 0 ? (
          <p className="text-[13px] text-[#444] text-center py-12">
            Plans unavailable. Please try again later.
          </p>
        ) : (
          <div>
            {tiers.map((tier) => (
              <PricingTierCard
                key={tier.id}
                id={tier.id}
                name={tier.name}
                monthlyPriceCents={tier.monthlyPriceCents}
                monthlyCredits={tier.monthlyCredits}
                featured={tier.id === 'core'}
              />
            ))}
          </div>
        )}

        {/* Feature comparison — only renders when tiers exist */}
        {tiers.length > 0 && (
          <div className="mt-12">
            <PricingComparison
              tiers={tiers.map(({ id, monthlyCredits }) => ({
                id,
                monthlyCredits,
              }))}
            />
          </div>
        )}

        {/* Footer reassurance */}
        <div className="flex items-center justify-between py-8 border-t border-[#1a1a1a]">
          <span className="text-[11px] text-[#333] uppercase tracking-[1px]">
            Cancel anytime · No contracts · Credits refresh monthly
          </span>
          <Link
            href="/"
            className="text-[11px] text-[#444] uppercase tracking-[1px] transition-colors hover:text-white"
          >
            ← BACK TO HOME
          </Link>
        </div>

      </div>
    </main>
  )
}
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
cd "/Users/dutchmike/Desktop/Claude Agents/OneGolf/V1/onegolf"
npx tsc --noEmit
```

Expected: no errors. If type errors appear, check that the import paths and prop types match exactly.

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/pricing/page.tsx
git commit -m "feat: rewrite pricing page with B&W editorial layout"
```

---

## Task 5: Remove old `PricingTierRow` component

**Files:**
- Delete: `components/pricing-tier-row.tsx`

- [ ] **Step 1: Confirm no other files import `PricingTierRow`**

```bash
cd "/Users/dutchmike/Desktop/Claude Agents/OneGolf/V1/onegolf"
grep -r "pricing-tier-row\|PricingTierRow" --include="*.tsx" --include="*.ts" .
```

Expected: zero results (the old pricing page was the only consumer). If results appear, update those files before deleting.

- [ ] **Step 2: Delete the file**

```bash
rm components/pricing-tier-row.tsx
```

- [ ] **Step 3: Confirm TypeScript still compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git rm components/pricing-tier-row.tsx
git commit -m "chore: remove deprecated PricingTierRow component"
```

---

## Task 6: Visual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open `http://localhost:3000/pricing` and verify**

Checklist:
- [ ] Black background (`#000`), no rounded corners anywhere
- [ ] Section label bar shows `MEMBERSHIP PLANS` / `03 TIERS` in small caps
- [ ] Headline reads `CHOOSE YOUR PLAN` in large bold type
- [ ] Three tier blocks visible: Casual ($99), Core ($149), Heavy ($199)
- [ ] Core block has white border (`border: 1px solid #fff`), others have `#222`
- [ ] Core block shows `RECOMMENDED` label in header row
- [ ] Credit counts in large mono type: 100 / 150 / 210
- [ ] Core CTA button is filled white with black text; Casual and Heavy are outlined
- [ ] Button labels read `JOIN CASUAL →`, `JOIN CORE →`, `JOIN HEAVY →`
- [ ] Clicking any CTA navigates to `/signup?plan=[id]`
- [ ] Feature comparison renders below tiers with 3 rows (Monthly Credits, Booking Fee, Courses)
- [ ] Core column header is white; Casual and Heavy column headers are `#555`
- [ ] Booking Fee row shows `—` in all columns
- [ ] Footer shows reassurance text and `← BACK TO HOME` link
- [ ] `← BACK TO HOME` navigates to `/`
- [ ] Resize to 375px width: tier blocks stay readable, comparison grid scrolls horizontally

- [ ] **Step 3: Final commit if any cosmetic fixes were needed**

```bash
git add -A
git commit -m "fix: pricing page visual polish"
```
