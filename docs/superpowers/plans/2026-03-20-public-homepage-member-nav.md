# Public Homepage + Member Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Nike/FREEGAME B&W editorial public homepage and persistent double-header member nav that wraps all existing member pages.

**Architecture:** Server Component public nav + static homepage in `app/(public)/`; Server Component member layout fetches user + credits from Supabase, passes as props to a `'use client'` `<MemberNav>` that uses `usePathname()` for active tab detection.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, Geist Sans/Mono (CSS vars `--font-geist-sans` / `--font-geist-mono`), `next/image`, Supabase Auth, `getCreditBalance` from `lib/credits/ledger.ts`

**Spec:** `docs/superpowers/specs/2026-03-20-public-homepage-member-nav-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/public-nav.tsx` | Server Component — fixed top nav for public pages |
| Modify | `app/(public)/layout.tsx` | Wrap children with `<PublicNav>` |
| **Delete** | `app/page.tsx` | Remove conflicting root route (must happen before homepage is created) |
| Create | `app/(public)/page.tsx` | Full-bleed B&W homepage (hero + how it works + pricing CTA + footer) |
| Create | `components/member-nav.tsx` | `'use client'` — sticky double-header nav for member area |
| Modify | `app/(member)/layout.tsx` | Fetch user + credits, render `<MemberNav>`, wrap children |

---

## Task 1: PublicNav Component

**Files:**
- Create: `components/public-nav.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from 'next/link'

export default function PublicNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      {/* Utility text — hidden on mobile */}
      <div
        className="hidden md:block"
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.6,
        }}
      >
        One membership.<br />Every course. ■
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        <Link
          href="#how-it-works"
          className="hidden md:block"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
          }}
        >
          How it works
        </Link>
        <Link
          href="/pricing"
          className="hidden md:block"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
          }}
        >
          Pricing
        </Link>
        <Link
          href="/login"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
          }}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            background: '#fff',
            color: '#000',
            padding: '8px 20px',
            textDecoration: 'none',
            borderRadius: 0,
          }}
        >
          Join
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /path/to/onegolf && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/public-nav.tsx
git commit -m "feat: add PublicNav server component"
```

---

## Task 2: Update Public Layout

**Files:**
- Modify: `app/(public)/layout.tsx`

- [ ] **Step 1: Read the current file**

Current content of `app/(public)/layout.tsx` is a passthrough that just renders `{children}`. Update it to include `<PublicNav>`:

```tsx
import PublicNav from '@/components/public-nav'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PublicNav />
      {children}
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/(public)/layout.tsx
git commit -m "feat: add PublicNav to public layout"
```

---

## Task 3: Remove Conflicting Root Route

**Files:**
- Delete: `app/page.tsx`

> **IMPORTANT:** This must happen BEFORE Task 4 creates `app/(public)/page.tsx`. Both files resolve to `/` — if both exist simultaneously, Next.js App Router will throw a build error for conflicting routes.

- [ ] **Step 1: Delete `app/page.tsx`**

```bash
rm app/page.tsx
```

- [ ] **Step 2: Verify no build error**

```bash
npx tsc --noEmit
```

Expected: no errors (the route simply 404s until Task 4 creates the homepage)

- [ ] **Step 3: Commit the deletion**

```bash
git add -A
git commit -m "chore: remove default Next.js starter page (homepage moving to (public) route group)"
```

---

## Task 4: Homepage

**Files:**
- Create: `app/(public)/page.tsx`

No data fetching required — fully static Server Component.

> **Hero image:** The spec calls for `/public/hero-golf.jpg`. Since sourcing a real image is a manual step, the implementation uses a CSS dark background (`background: #111`) as a fallback. To use a real image: download a B&W golf course photo (Unsplash free license), place it at `public/hero-golf.jpg`, then uncomment the `<Image>` block below.

- [ ] **Step 1: Create the homepage**

```tsx
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'OneGolf — One Membership. Every Course.',
  description: 'Monthly credit subscription for golf. Book tee times at top courses, no booking fees.',
}

// Set to true once public/hero-golf.jpg is placed (Unsplash free license, B&W golf course)
const HERO_IMAGE_READY = false

const steps = [
  {
    num: '01',
    title: 'Choose your membership',
    desc: 'Casual, Core, or Heavy. Credits renew monthly. Core and Heavy members roll over unused credits — up to 10% or 15% respectively.',
    stat: 'From\n$99/mo',
  },
  {
    num: '02',
    title: 'Browse partner courses',
    desc: 'Find courses near you. View live availability. Filter by date, time, and players — no phone calls, no waiting.',
    stat: 'Any\ncourse',
  },
  {
    num: '03',
    title: 'Book with credits',
    desc: 'Confirm in seconds. Show your QR code at the course. No surprise fees. Ever.',
    stat: 'Zero\nfees',
  },
]

export default function HomePage() {
  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          minHeight: 600,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: '#111',
        }}
      >
        {/* Background image — flip HERO_IMAGE_READY to true once public/hero-golf.jpg is placed */}
        {HERO_IMAGE_READY && (
          <Image
            src="/hero-golf.jpg"
            alt=""
            fill
            priority
            style={{
              objectFit: 'cover',
              objectPosition: 'center 40%',
              filter: 'grayscale(100%) brightness(0.4)',
            }}
          />
        )}

        {/* Headline */}
        <div
          style={{
            position: 'absolute',
            zIndex: 5,
            top: '50%',
            left: 0,
            right: 0,
            transform: 'translateY(-52%)',
            textAlign: 'center',
            padding: '0 20px',
          }}
        >
          {['ONE', 'GOLF'].map((word) => (
            <span
              key={word}
              style={{
                display: 'block',
                fontSize: 'clamp(80px, 16vw, 220px)',
                fontWeight: 900,
                letterSpacing: '-4px',
                lineHeight: 0.88,
                color: '#fff',
                textTransform: 'uppercase',
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Bottom strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '20px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.8,
              maxWidth: 360,
              margin: 0,
            }}
          >
            Monthly credits · Any partner course · No booking fees · Cancel anytime
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link
              href="/signup"
              style={{
                background: '#fff',
                color: '#000',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '12px 28px',
                textDecoration: 'none',
              }}
            >
              Get started
            </Link>
            <Link
              href="/pricing"
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                textDecoration: 'none',
              }}
            >
              See pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ borderTop: '1px solid #1a1a1a' }}>
        {/* Section label */}
        <div
          style={{
            padding: '14px 32px',
            borderBottom: '1px solid #1a1a1a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#444',
            }}
          >
            How it works
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#444',
            }}
          >
            03 steps
          </span>
        </div>

        {/* Steps */}
        {steps.map((step) => (
          <div
            key={step.num}
            style={{
              display: 'flex',
              borderBottom: '1px solid #111',
            }}
          >
            {/* Step number */}
            <div
              style={{
                width: 64,
                padding: '32px 0 32px 32px',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'var(--font-geist-mono)',
                color: '#333',
                letterSpacing: '1px',
                flexShrink: 0,
              }}
            >
              {step.num}
            </div>

            {/* Body */}
            <div style={{ flex: 1, padding: 32, borderLeft: '1px solid #111' }}>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  color: '#fff',
                  marginBottom: 8,
                  marginTop: 0,
                }}
              >
                {step.title}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: '#555',
                  lineHeight: 1.7,
                  maxWidth: 440,
                  margin: 0,
                }}
              >
                {step.desc}
              </p>
            </div>

            {/* Aside stat */}
            <div
              style={{
                width: 160,
                padding: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#222',
                  textAlign: 'right',
                  whiteSpace: 'pre-line',
                }}
              >
                {step.stat}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ── PRICING CTA ── */}
      <section
        style={{
          padding: '72px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #1a1a1a',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: '-2px',
              color: '#fff',
              lineHeight: 1.0,
              margin: 0,
            }}
          >
            Plans from<br />$99/mo
          </p>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#444',
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            Casual · Core · Heavy
          </p>
        </div>
        <Link
          href="/pricing"
          style={{
            border: '1px solid #fff',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            padding: '14px 32px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          View all plans
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          padding: '20px 32px',
          borderTop: '1px solid #111',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '4px',
            color: '#fff',
          }}
        >
          ONEGOLF
        </span>
        <span style={{ fontSize: 10, color: '#333' }}>© 2026 OneGolf</span>
      </footer>

    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Smoke test — start dev server and check `/`**

```bash
npm run dev
```

Visit `http://localhost:3000`. Expected:
- Full-black viewport with `ONE` / `GOLF` large type centered
- `PublicNav` visible at top (Log in + Join links)
- How it works section below the fold
- Pricing CTA below that
- Footer at bottom

- [ ] **Step 4: Commit**

```bash
git add app/(public)/page.tsx
git commit -m "feat: add B&W editorial homepage"
```

---

## Task 5: MemberNav Component

**Files:**
- Create: `components/member-nav.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MemberNavProps {
  credits: number
  firstName: string
}

const tabs = [
  { label: 'Book', href: '/book' },
  { label: 'Courses', href: '/courses' },
  { label: 'My Rounds', href: '/rounds' },
  { label: 'Credits', href: '/credits' },
] as const

export default function MemberNav({ credits, firstName }: MemberNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <div
      style={{ position: 'sticky', top: 0, zIndex: 40 }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 48,
          background: '#090f1a',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 16px',
        }}
      >
        <Link
          href="/dashboard"
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '4px',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          ONEGOLF
        </Link>

        <Link
          href="/credits"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
          }}
        >
          {credits} credits · {firstName}
        </Link>
      </div>

      {/* Tab strip */}
      <div
        style={{
          height: 44,
          background: '#090f1a',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          padding: '0 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                height: 44,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                borderBottom: active ? '2px solid #4ade80' : '2px solid transparent',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/member-nav.tsx
git commit -m "feat: add MemberNav client component with sticky double header"
```

---

## Task 6: Update Member Layout

**Files:**
- Modify: `app/(member)/layout.tsx`

- [ ] **Step 1: Rewrite the layout**

The current file only does an auth guard and renders `{children}`. Replace it with:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import MemberNav from '@/components/member-nav'

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let balance = 0
  try {
    balance = await getCreditBalance(user.id)
  } catch (err) {
    console.error('[member-layout] getCreditBalance failed', err)
  }

  const firstName =
    user.user_metadata?.full_name?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    'You'

  return (
    <div className="min-h-screen bg-[#090f1a] flex flex-col">
      <MemberNav credits={balance} firstName={firstName} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Smoke test — visit a member page**

```bash
npm run dev
```

Visit `http://localhost:3000/book` (as an authenticated user or observe the redirect to `/login` for unauthenticated). Expected when authenticated:
- Sticky double header visible: `ONEGOLF` logo left, `{N} credits · {name}` right
- Tab strip: Book · Courses · My Rounds · Credits, with the active tab highlighted green
- Navigating between tabs updates the active indicator

- [ ] **Step 4: Commit**

```bash
git add app/(member)/layout.tsx
git commit -m "feat: add MemberNav with credits to member layout"
```

---

## Verification Checklist

After all 6 tasks are complete, verify:

- [ ] `/` loads the B&W homepage (hero, how it works, pricing CTA, footer)
- [ ] `PublicNav` is visible on `/`, `/pricing`, `/login`, `/signup` (all public routes)
- [ ] `/login` and `/signup` links in nav work
- [ ] Scrolling past hero reveals how it works section
- [ ] `/pricing` link in hero bottom strip + pricing CTA works
- [ ] `/book` shows sticky double header with correct user name and credit balance
- [ ] Active tab has white text + green bottom border; others are dim
- [ ] Navigating Book → Courses → My Rounds → Credits updates active tab correctly
- [ ] Credits balance link goes to `/credits`
- [ ] ONEGOLF logo in member nav links to `/dashboard`
- [ ] On mobile: tab strip scrolls horizontally without showing a scrollbar
- [ ] On mobile: `PublicNav` shows only Log in + Join (utility text hidden)
- [ ] `npx tsc --noEmit` passes with zero errors
