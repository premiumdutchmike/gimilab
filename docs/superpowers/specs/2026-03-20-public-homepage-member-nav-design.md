# Public Homepage + Member Navigation — Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Phase:** 3

---

## 1. Scope

Build the public-facing homepage and persistent member navigation. No new data models. No auth changes.

**In scope:**
- `app/page.tsx` — converted to redirect (homepage moves into route group)
- `app/(public)/page.tsx` — homepage (new)
- `app/(public)/layout.tsx` — updated to render `<PublicNav>`
- `components/public-nav.tsx` — public top nav (new)
- `app/(member)/layout.tsx` — updated: fetches user + credits, renders `<MemberNav>`
- `components/member-nav.tsx` — persistent double-header member nav (new)

**Out of scope:** auth page restyling, pricing page redesign, onboarding flow.

---

## 2. Design Language

Public pages use a **B&W editorial / Nike style**:
- Background: `#000`, foreground: `#fff`
- Typography: uppercase, tight letter-spacing, high-contrast weight contrast (900 headlines vs. 10px small-caps labels)
- No border radius. Borders instead of shadows. `1px solid #1a1a1a` for dividers.
- No icons. No rounded corners. No gradients.
- Font: Geist Sans (already installed), weights 600 and 900.

Member pages retain the existing dark theme (`#090f1a` background, accent green `#4ade80`) but the member nav follows the same no-radius, high-contrast editorial quality.

---

## 3. Routing

`app/page.tsx` currently exists as a Next.js default starter. It conflicts with `app/(public)/page.tsx` since route groups don't add URL segments — both resolve to `/`. Resolution: convert `app/page.tsx` to a permanent redirect to `/` inside the `(public)` group (or simply delete it and place homepage at `app/(public)/page.tsx`).

**Chosen approach:** Delete `app/page.tsx`, create `app/(public)/page.tsx` as the homepage. The `(public)` layout wraps it automatically.

---

## 4. Public Navigation — `components/public-nav.tsx`

**Type:** Server Component (no interactivity needed)

> Note: `PublicNav` has no active-link state. If active highlighting is added later, this component must become a Client Component (or extract links into a `'use client'` child) to use `usePathname()`. Do not use Tailwind `dark:` variants on public nav or any public component — the root layout applies `dark` globally; use explicit hex values only.

**Layout (desktop):**
```
One membership. Every course. ■    [How it works]  [Pricing]  [Log in]  [JOIN ▶]
```

**Layout (mobile):** utility text hidden, links collapse to: `[Log in]` + `[JOIN]` only.

**Spec:**
- Fixed position, `z-50`, transparent background over hero, blends with black.
- Utility text: `10px`, `font-weight: 600`, `letter-spacing: 2px`, `text-transform: uppercase`, `color: rgba(255,255,255,0.4)`.
- Nav links: same size/weight, `color: rgba(255,255,255,0.6)`, no underline, hover → `color: #fff`.
- JOIN button: `background: #fff`, `color: #000`, `font-size: 10px`, `font-weight: 800`, `letter-spacing: 2px`, `padding: 8px 20px`, no border-radius.
- "Log in" links to `/login`. JOIN links to `/signup`.

---

## 5. Homepage — `app/(public)/page.tsx`

**Type:** Server Component (static, no data fetching required)

### 5a. Hero

Full-viewport (`100vh`), black background, B&W golf course photo behind large type.

- **Background photo:** `next/image` with `fill`, `object-fit: cover`, `grayscale(100%)`, `brightness(0.4)`. Use `/public/hero-golf.jpg` (implementer sources from Unsplash free license or uses a CSS gradient placeholder if unavailable).
- **Headline:** Two lines — `ONE` / `GOLF` — in `clamp(80px, 16vw, 220px)`, `font-weight: 900`, uppercase, white. Centered. The type sits over the photo.
- **Bottom strip:** `position: absolute; bottom: 0; left: 0; right: 0`. `border-top: 1px solid rgba(255,255,255,0.1)`. Flex row, space-between.
  - Left: `10px` uppercase tagline — `Monthly credits · Any partner course · No booking fees · Cancel anytime`
  - Right: two elements — `[GET STARTED]` white button (links to `/signup`) + `[See pricing →]` ghost text (links to `/pricing`)

### 5b. How It Works

Three rows, each `border-bottom: 1px solid #111`. No card wrappers. Flex row per step.

| Column | Content |
|--------|---------|
| Step number | `01` / `02` / `03` in `10px`, `font-family: var(--font-geist-mono)`, `color: #333` |
| Body (flex 1) | **Title** (`22px`, `font-weight: 800`) + description (`13px`, `color: #555`, max 440px) |
| Aside (`160px`) | Stat label in `10px` uppercase, `color: #222` |

Steps:
1. **Choose your membership** — "Casual, Core, or Heavy. Credits renew monthly. Unused credits roll over — up to half your monthly allowance." / Aside: `From $99/mo`
2. **Browse partner courses** — "Find courses near you. View live availability. Filter by date, time, and players — no phone calls, no waiting." / Aside: `Any course`
3. **Book with credits** — "Confirm in seconds. Show your QR code at the course. No surprise fees. Ever." / Aside: `Zero fees`

Section label bar above the steps: `border-top: 1px solid #1a1a1a`, `border-bottom: 1px solid #1a1a1a`, flex row — left `HOW IT WORKS` / right `03 STEPS` — both `10px` uppercase, `color: #444`.

### 5c. Pricing CTA

`padding: 72px 32px`. `border-top: 1px solid #1a1a1a`. Flex row, space-between, align-center.

- Left: headline `Plans from $99/mo` in `48px`, `font-weight: 900`, `letter-spacing: -2px`. Sub-label below: `CASUAL · CORE · HEAVY` in `11px` uppercase.
- Right: outlined button `[VIEW ALL PLANS]` → `/pricing`. `border: 1px solid #fff`, `color: #fff`, `padding: 14px 32px`, no border-radius.

### 5d. Footer

`padding: 20px 32px`. `border-top: 1px solid #111`. Flex row, space-between.

- Left: `ONEGOLF` in `12px`, `font-weight: 900`, `letter-spacing: 4px`.
- Right: `© 2026 OneGolf` in `10px`, `color: #333`.

---

## 6. Member Layout — `app/(member)/layout.tsx`

**Type:** Server Component (async, fetches user + credits)

**Responsibilities:**
1. Auth guard — if no user, `redirect('/login')` (already present, keep)
2. Fetch credit balance with error guard:
```ts
let balance = 0
try {
  balance = await getCreditBalance(user.id)
} catch (err) {
  console.error('[member-layout] getCreditBalance failed', err)
}
```
3. Extract display name: `user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'You'`
4. Render `<MemberNav credits={balance} firstName={name} />` above `{children}`

**Layout structure:**
```tsx
<div className="min-h-screen bg-[#090f1a] flex flex-col">
  <MemberNav credits={balance} firstName={name} />
  <main className="flex-1">{children}</main>
</div>
```

---

## 7. Member Nav — `components/member-nav.tsx`

**Type:** `'use client'` (needs `usePathname()`)

**Props:**
```ts
interface MemberNavProps {
  credits: number
  firstName: string
}
```

**Structure:** Two horizontal bars, `position: sticky; top: 0; z-index: 40`.

### Top bar
`height: 48px`. `background: #090f1a`. `border-bottom: 1px solid #1a1a1a`. Flex row, space-between, padding `0 16px`.

- Left: `ONEGOLF` in `12px`, `font-weight: 900`, `letter-spacing: 4px`, `color: #fff`. Links to `/dashboard`.
- Right: `<Link href="/credits">` — `{credits} credits · {firstName}` in `11px`, `font-weight: 600`, uppercase, `color: rgba(255,255,255,0.5)`. Hover → `color: #fff`.

### Tab strip
`height: 44px`. `background: #090f1a`. `border-bottom: 1px solid #1a1a1a`. Flex row, `padding: 0 16px`, `gap: 0`, overflow-x auto (mobile scroll).

Tabs: `Book` → `/book` | `Courses` → `/courses` | `My Rounds` → `/rounds` | `Credits` → `/credits`

Each tab:
- `height: 44px`, `padding: 0 16px`, `font-size: 12px`, `font-weight: 600`, `letter-spacing: 1px`, `text-transform: uppercase`
- Inactive: `color: rgba(255,255,255,0.4)`
- Active: `color: #fff` + `border-bottom: 2px solid #4ade80` (accent green, matches existing design system)
- Active detection: `pathname === href || pathname.startsWith(href + '/')`

**Mobile:** Both bars stay sticky. Tab strip scrolls horizontally without scrollbar (`scrollbar-width: none`). No hamburger menu.

---

## 8. Data Flow

```
app/(member)/layout.tsx (Server)
  → supabase.auth.getUser()          — Supabase Auth
  → getCreditBalance(user.id)        — lib/credits/ledger.ts (DB query)
  → <MemberNav credits firstName />  — passes props down
      → usePathname()                — Next.js navigation (client only)
```

No SWR, no API calls from the client. Credits are fetched server-side on every navigation (layout re-renders on route change in App Router).

---

## 9. Error States

- **getCreditBalance throws:** Catch, default `credits` to `0`. Log error server-side. Don't crash the layout.
- **No user name:** Fall back to first part of email. Never show `undefined`.
- **Hero image missing:** CSS `background: #111` fallback so layout is intact.

---

## 10. Testing

Unit tests are **not required** for this phase — these are pure presentational components with no business logic. Visual verification via `npm run dev` is sufficient.

If tests are written, test:
- `member-nav.tsx`: active tab detection logic (mock `usePathname`)
- `member-layout.tsx`: redirect when no user; credit fallback when `getCreditBalance` throws

---

## 11. Implementation Order

1. `components/public-nav.tsx`
2. `app/(public)/layout.tsx` (add `<PublicNav>`)
3. `app/page.tsx` → **delete first** (routing conflict: both `app/page.tsx` and `app/(public)/page.tsx` resolve to `/` — deleting first prevents a build error)
4. `app/(public)/page.tsx` (homepage — create after step 3)
5. `components/member-nav.tsx`
6. `app/(member)/layout.tsx` (add credits fetch + `<MemberNav>`)
