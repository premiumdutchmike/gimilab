# Homepage Redesign v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the public homepage with a lighter, Nike-inspired design featuring green accents, floating editorial cards, a savings comparison, draggable course scroll, and an auto-advancing review carousel.

**Architecture:** The page is a Server Component that fetches the top 5 active courses from the DB and passes them to a Client Component (`CourseScroll`). Interactive sections (carousel, draggable scroll) are isolated as small `'use client'` components to keep the page Server-rendered by default. All CSS animations are pure CSS — no animation library needed.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Tailwind v4 (inline styles used for precision), Geist Sans/Mono (already in layout)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `components/public-nav.tsx` | Modify | Sticky frosted glass nav with ONEGOLF wordmark + green JOIN button |
| `components/homepage/review-carousel.tsx` | Create | `'use client'` — auto-advancing carousel with prev/next + dot nav |
| `components/homepage/course-scroll.tsx` | Create | `'use client'` — draggable horizontal course card scroll |
| `app/(public)/page.tsx` | Rewrite | Server Component — fetches courses, renders all sections |

---

## Task 1: Update PublicNav to frosted glass

**Files:**
- Modify: `components/public-nav.tsx`

- [ ] **Step 1: Read the current file**

Open `components/public-nav.tsx` and note the existing structure.

- [ ] **Step 2: Rewrite the nav**

Replace the entire file content with:

```tsx
import Link from 'next/link'

export default function PublicNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: '3px',
          color: '#0d0d0d',
          textDecoration: 'none',
          textTransform: 'uppercase',
        }}
      >
        ONEGOLF
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <Link href="#how-it-works" className="hidden md:block" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7280', textDecoration: 'none' }}>
          How It Works
        </Link>
        <Link href="#courses" className="hidden md:block" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7280', textDecoration: 'none' }}>
          Courses
        </Link>
        <Link href="/pricing" className="hidden md:block" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7280', textDecoration: 'none' }}>
          Pricing
        </Link>
        <Link href="/login" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#6b7280', textDecoration: 'none' }}>
          Log In
        </Link>
        <Link
          href="/signup"
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
            background: '#1a5c38', color: '#fff',
            padding: '10px 22px', textDecoration: 'none', borderRadius: 6,
          }}
        >
          JOIN NOW
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Verify nav renders**

Run `npm run dev` and open `http://localhost:3002`. Nav should appear as a frosted white bar with ONEGOLF on the left and green JOIN NOW button on the right.

- [ ] **Step 4: Commit**

```bash
git add components/public-nav.tsx
git commit -m "feat: update public nav to frosted glass with green CTA"
```

---

## Task 2: Create ReviewCarousel component

**Files:**
- Create: `components/homepage/review-carousel.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p components/homepage
```

- [ ] **Step 2: Write the component**

Create `components/homepage/review-carousel.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface Review {
  id: number
  quote: string          // plain text — bold phrases wrapped in <em> in JSX below
  author: string
  meta: string
  avatarUrl: string
}

const REVIEWS: Review[] = [
  {
    id: 1,
    quote: 'I used to spend $300 a month on green fees alone. Now I pay $149 and play just as much. The savings basically paid for a new putter.',
    author: 'James T.',
    meta: 'Core Member · 8 months',
    avatarUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    quote: 'Booking used to mean calling the pro shop and hoping they had a spot. Now I open the app, pick a time, done. I\'ve played six new courses this year.',
    author: 'Marcus W.',
    meta: 'Heavy Member · 1 year',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    quote: 'I bought the Casual plan to try it. Upgraded to Core after two weeks. The QR check-in is seamless — show your phone and you\'re on the tee.',
    author: 'Daniel R.',
    meta: 'Core Member · 5 months',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    quote: 'As someone who plays 3–4 times a month, the Heavy plan just makes sense. Up to 15% of my unused credits carry to next month — I\'ve never wasted a single one.',
    author: 'Sarah K.',
    meta: 'Heavy Member · 6 months',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 5,
    quote: 'Tried it for one month out of curiosity. Haven\'t gone back to booking the old way. Every partner course accepts the QR without any issues.',
    author: 'Ryan M.',
    meta: 'Casual Member · 3 months',
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80',
  },
]

const VISIBLE = 3
const MAX_IDX = REVIEWS.length - VISIBLE  // 2

export function ReviewCarousel() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = (idx: number) => setCurrent(Math.max(0, Math.min(idx, MAX_IDX)))

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev < MAX_IDX ? prev + 1 : 0))
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Reset timer on manual nav
  const navigate = (idx: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    goTo(idx)
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev < MAX_IDX ? prev + 1 : 0))
    }, 5000)
  }

  return (
    <section style={{ background: '#0d0d0d', padding: '100px 60px', position: 'relative', overflow: 'hidden' }}>
      {/* Green glows */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(26,92,56,.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(26,92,56,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 56, position: 'relative', zIndex: 1 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#4ade80', marginBottom: 10 }}>
            Member reviews
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-2px', color: '#fff', textTransform: 'uppercase' }}>
            Golfers love it.
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(current - 1)}
            disabled={current === 0}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, cursor: current === 0 ? 'default' : 'pointer', opacity: current === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ←
          </button>
          <button
            onClick={() => navigate(current + 1)}
            disabled={current === MAX_IDX}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, cursor: current === MAX_IDX ? 'default' : 'pointer', opacity: current === MAX_IDX ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            →
          </button>
        </div>
      </div>

      {/* Track */}
      <div style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            gap: 20,
            transition: 'transform 0.4s cubic-bezier(.25,.46,.45,.94)',
            transform: `translateX(calc(-${current} * (33.333% + 7px)))`,
          }}
        >
          {REVIEWS.map(r => (
            <div
              key={r.id}
              style={{
                flexShrink: 0,
                width: 'calc(33.333% - 14px)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: 36,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.transform = 'translateY(-4px)'
                el.style.borderColor = 'rgba(74,222,128,.3)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.transform = ''
                el.style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              <div style={{ fontSize: 13, color: '#4ade80', letterSpacing: 3, marginBottom: 20 }}>★ ★ ★ ★ ★</div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, flex: 1 }}>{r.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.avatarUrl} alt={r.author} width={42} height={42} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{r.author}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{r.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 32, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        {Array.from({ length: MAX_IDX + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => navigate(i)}
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === current ? '#4ade80' : 'rgba(255,255,255,0.15)',
              border: 'none',
              cursor: 'pointer',
              transition: 'width 0.2s, background 0.2s',
              padding: 0,
            }}
          />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `components/homepage/review-carousel.tsx`.

- [ ] **Step 4: Commit**

```bash
git add components/homepage/review-carousel.tsx
git commit -m "feat: add ReviewCarousel client component"
```

---

## Task 3: Create CourseScroll component

**Files:**
- Create: `components/homepage/course-scroll.tsx`

- [ ] **Step 1: Write the component**

Create `components/homepage/course-scroll.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import Image from 'next/image'

interface Course {
  id: string
  name: string
  address: string
  holes: number | null
  baseCreditCost: number
  photos: string[] | null
}

interface CourseScrollProps {
  courses: Course[]
}

export function CourseScroll({ courses }: CourseScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0)
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing'
  }
  const onMouseLeave = () => {
    dragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }
  const onMouseUp = () => {
    dragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.5
  }

  if (courses.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
        Partner courses coming soon.
      </p>
    )
  }

  return (
    <div
      ref={scrollRef}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      style={{
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        paddingRight: 60,
        scrollbarWidth: 'none',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {courses.map((course, i) => (
        <div
          key={course.id}
          style={{
            flexShrink: 0,
            width: 270,
            background: '#fff',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            transition: 'transform 0.25s, box-shadow 0.25s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.transform = 'translateY(-6px)'
            el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.12)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.transform = ''
            el.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
            {course.photos?.[0] ? (
              <Image
                src={course.photos[0]}
                alt={course.name}
                fill
                sizes="270px"
                style={{ objectFit: 'cover', transition: 'transform 0.4s' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#e5e7eb' }} />
            )}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: i === 0 ? '#1a5c38' : 'rgba(255,255,255,0.95)',
              color: i === 0 ? '#fff' : '#0d0d0d',
              fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 100,
            }}>
              {i === 0 ? '★ Featured' : `${course.holes ?? 18} holes`}
            </div>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.3px' }}>
              {course.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{course.address.split(',').slice(-2).join(',').trim()}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1a5c38', background: '#f0fdf4', padding: '3px 8px', borderRadius: 4 }}>
                {course.baseCreditCost} credits
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/homepage/course-scroll.tsx
git commit -m "feat: add CourseScroll client component"
```

---

## Task 4: Rewrite the homepage

**Files:**
- Rewrite: `app/(public)/page.tsx`

- [ ] **Step 1: Write the new page**

Replace the entire content of `app/(public)/page.tsx` with:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { ReviewCarousel } from '@/components/homepage/review-carousel'
import { CourseScroll } from '@/components/homepage/course-scroll'

export const metadata = {
  title: 'OneGolf — One Membership. Every Course.',
  description: 'Monthly credit subscription for golf. Book tee times at top courses, no booking fees.',
}

// Flip to true once /public/hero-golf.jpg is placed
const HERO_IMAGE_READY = false
// Flip to true once /public/editorial-1.jpg, editorial-2.jpg, editorial-3.jpg are placed
const EDITORIAL_IMAGES_READY = false

const EDITORIAL_CARDS = [
  { src: '/editorial-1.jpg', label: 'Choose a plan', rotate: '-3deg', width: 230, height: 300, top: 0, left: 20 },
  { src: '/editorial-2.jpg', label: 'Browse courses', rotate: '2.5deg', width: 200, height: 270, top: 80, left: 220 },
  { src: '/editorial-3.jpg', label: 'Book & play', rotate: '-1.5deg', width: 180, height: 240, top: 10, left: 395 },
]

export default async function HomePage() {
  const topCourses = await db
    .select({
      id: courses.id,
      name: courses.name,
      address: courses.address,
      holes: courses.holes,
      baseCreditCost: courses.baseCreditCost,
      photos: courses.photos,
    })
    .from(courses)
    .where(eq(courses.status, 'active'))
    .limit(5)

  return (
    <main style={{ background: '#faf9f6', color: '#0d0d0d' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 640, overflow: 'hidden' }}>
        {/* Background */}
        {HERO_IMAGE_READY ? (
          <Image
            src="/hero-golf.jpg"
            alt=""
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center 35%', filter: 'brightness(0.55)' }}
            className="hero-bg-img"
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#111' }} />
        )}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.2), rgba(0,0,0,.1) 50%, rgba(0,0,0,.65))' }} />

        {/* Headline */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -54%)', textAlign: 'center', width: '100%', zIndex: 5 }}>
          {/* Live pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100,
            padding: '8px 18px', marginBottom: 24,
            fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)',
          }}>
            <span className="live-dot" />
            Now live in your area
          </div>
          {['ONE', 'GOLF'].map(word => (
            <span key={word} style={{
              display: 'block',
              fontSize: 'clamp(90px, 16vw, 220px)',
              fontWeight: 900, letterSpacing: '-5px', lineHeight: 0.88,
              color: '#fff', textTransform: 'uppercase',
            }}>
              {word}
            </span>
          ))}
        </div>

        {/* Bottom strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '32px 40px', gap: 24,
          background: 'linear-gradient(to top, rgba(0,0,0,.5), transparent)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', lineHeight: 2, margin: 0 }}>
            Monthly credits · Any partner course<br />No booking fees · Cancel anytime
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Link href="/signup" style={{ background: '#fff', color: '#000', fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '13px 32px', textDecoration: 'none', borderRadius: 6 }}>
              GET STARTED
            </Link>
            <Link href="/pricing" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
              SEE PRICING →
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', overflow: 'hidden', padding: '14px 0' }}>
        <div className="marquee-track">
          {[
            'MONTHLY CREDITS', '✦ ANY COURSE', 'ZERO BOOKING FEES',
            '✦ CANCEL ANYTIME', 'FROM $99 / MO', '✦ 03 TIERS',
            'MONTHLY CREDITS', '✦ ANY COURSE', 'ZERO BOOKING FEES',
            '✦ CANCEL ANYTIME', 'FROM $99 / MO', '✦ 03 TIERS',
          ].map((item, i) => (
            <span key={i} className={item.startsWith('✦') ? 'marquee-item accent' : 'marquee-item'}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── EDITORIAL ── */}
      <section id="how-it-works" style={{ background: '#faf9f6', padding: '100px 0 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Ghost text */}
        <div style={{ position: 'absolute', top: 20, left: -10, fontSize: 'clamp(130px, 22vw, 280px)', fontWeight: 900, letterSpacing: '-8px', color: 'rgba(0,0,0,0.04)', textTransform: 'uppercase', userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>
          PLAY
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '0 60px', gap: 60 }}>
          {/* Copy */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#1a5c38', marginBottom: 16 }}>
              One membership
            </p>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: '#0d0d0d', textTransform: 'uppercase' }}>
              Golf,<br />on your<br />terms.
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75, marginTop: 20, maxWidth: 380 }}>
              Book tee times at any partner course using monthly credits. No fees, no phone calls. Pick a time, show up, play.
            </p>
            <div style={{ marginTop: 36, borderTop: '1px solid #e5e7eb' }}>
              {[
                { num: '01', title: 'Choose a membership tier' },
                { num: '02', title: 'Browse partner courses' },
                { num: '03', title: 'Book with credits, show QR' },
              ].map(step => (
                <div key={step.num} className="step-row">
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#1a5c38', minWidth: 28 }}>{step.num}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0d0d0d', flex: 1 }}>{step.title}</span>
                  <span style={{ fontSize: 14, color: '#e5e7eb' }}>→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating cards */}
          <div style={{ position: 'relative', height: 420 }}>
            {/* Badge: $0 fees */}
            <div className="float-badge" style={{ position: 'absolute', top: -10, left: 8, zIndex: 10, background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', animationDelay: '.5s' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0d0d0d', lineHeight: 1 }}>$0</div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b7280', marginTop: 2 }}>Booking Fees</div>
            </div>

            {EDITORIAL_CARDS.map((card, i) => (
              <div
                key={i}
                className="float-card"
                style={{
                  position: 'absolute',
                  width: card.width, height: card.height,
                  top: card.top, left: card.left,
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  transform: `rotate(${card.rotate})`,
                  transition: 'transform .3s, box-shadow .3s',
                }}
              >
                {EDITORIAL_IMAGES_READY ? (
                  <Image
                    src={`/editorial-${i + 1}.jpg`}
                    alt={card.label}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="300px"
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: `hsl(${140 + i * 20}, 20%, ${40 - i * 5}%)` }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {card.label}
                </div>
              </div>
            ))}

            {/* Badge: 3× tiers */}
            <div className="float-badge" style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 10, background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', animationDelay: '1.5s' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0d0d0d', lineHeight: 1 }}>3×</div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b7280', marginTop: 2 }}>Tier options</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div style={{ background: '#1a5c38', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { num: '03', label: 'Membership Tiers' },
          { num: '$99', label: 'Starting per month' },
          { num: '0', label: 'Booking Fees. Ever.' },
          { num: '∞', label: 'Partner courses' },
        ].map((stat, i) => (
          <div key={i} style={{ padding: '40px 36px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-2px', color: '#fff', lineHeight: 1 }}>{stat.num}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── SAVINGS ── */}
      <section style={{ background: '#fff', padding: '100px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 60, gap: 40 }}>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, textTransform: 'uppercase' }}>
            Play more.<br /><span style={{ color: '#1a5c38' }}>Spend less.</span>
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 280, lineHeight: 1.7, textAlign: 'right', flexShrink: 0 }}>
            The average golfer pays $85 per round. With OneGolf Core, 3 rounds a month costs $149. The math is a no-brainer.
          </p>
        </div>

        {/* Comparison grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, borderRadius: 16, overflow: 'hidden' }}>
          {/* Without */}
          <div style={{ background: '#f3f1ec', padding: 40 }}>
            <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: 'rgba(0,0,0,0.08)', color: '#666', marginBottom: 28 }}>
              Without OneGolf / year
            </div>
            {[
              { name: '36 rounds × $85', price: '$3,060' },
              { name: 'Booking fees', price: '$180' },
              { name: 'Phone calls to pro shop', price: 'Endless' },
            ].map(row => (
              <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: 13, color: '#777' }}>{row.name}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0d0d0d' }}>{row.price}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, paddingTop: 20, borderTop: '2px solid rgba(0,0,0,0.08)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#aaa' }}>Per year</span>
              <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: '#0d0d0d' }}>$3,240</span>
            </div>
          </div>

          {/* With OneGolf */}
          <div style={{ background: '#1a5c38', padding: 40 }}>
            <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', marginBottom: 28 }}>
              With OneGolf Core / year
            </div>
            {[
              { name: '$149/mo × 12', price: '$1,788' },
              { name: 'Booking fees', price: '$0' },
              { name: 'Phone calls', price: 'Zero' },
            ].map(row => (
              <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{row.name}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{row.price}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, paddingTop: 20, borderTop: '2px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Per year</span>
              <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: '#fff' }}>$1,788</span>
            </div>
          </div>
        </div>

        {/* Callout */}
        <div style={{ background: '#0d0d0d', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#4ade80' }}>YOU SAVE</div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: '#fff' }}>$1,452 / year</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>That&apos;s a new driver. New irons. Both.</div>
          </div>
          <Link href="/signup" style={{ background: '#1a5c38', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '14px 32px', textDecoration: 'none', borderRadius: 8, flexShrink: 0 }}>
            START SAVING TODAY
          </Link>
        </div>
      </section>

      {/* ── TOP COURSES ── */}
      <section id="courses" style={{ background: '#faf9f6', padding: '80px 0 80px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, paddingRight: 60 }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', textTransform: 'uppercase' }}>
            Top Courses
          </h2>
          <Link href="/courses" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b7280', textDecoration: 'none', borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
            View all →
          </Link>
        </div>
        <CourseScroll courses={topCourses} />
      </section>

      {/* ── REVIEWS ── */}
      <ReviewCarousel />

      {/* ── DARK CTA ── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 520 }}>
        <div style={{ background: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
          {/* Placeholder until golfer photo placed */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a3a28 0%, #0d1f16 100%)' }} />
        </div>
        <div style={{ background: '#0d0d0d', padding: '72px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#1a5c38', marginBottom: 20 }}>
            Join today
          </p>
          <h2 style={{ fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: '#fff', textTransform: 'uppercase', marginBottom: 16 }}>
            Ready<br />to play?
          </h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, maxWidth: 340, marginBottom: 40 }}>
            Pick a plan, get your credits, book your first round. Setup takes 2 minutes. No contracts.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/signup" style={{ background: '#1a5c38', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '14px 32px', textDecoration: 'none', borderRadius: 8 }}>
              GET STARTED
            </Link>
            <Link href="/pricing" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '13px 28px', textDecoration: 'none', borderRadius: 6 }}>
              View pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#000', padding: '40px 60px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 32, borderBottom: '1px solid #111' }}>
          <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '4px', color: '#fff' }}>ONEGOLF</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { href: '#how-it-works', label: 'How it works' },
              { href: '#courses', label: 'Courses' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/login', label: 'Log In' },
              { href: '/signup', label: 'Join' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#333', textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
          </div>
          <span style={{ fontSize: 10, color: '#333' }}>© 2026 OneGolf</span>
        </div>
        <div style={{ fontSize: 'clamp(70px, 14vw, 190px)', fontWeight: 900, letterSpacing: '-8px', color: '#111', textTransform: 'uppercase', lineHeight: 0.82, overflow: 'hidden', userSelect: 'none' }}>
          ONEGOLF
        </div>
      </footer>

      {/* ── CSS ANIMATIONS ── */}
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes heroZoom { to { transform: scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(1.3); } }

        .marquee-track { display: flex; white-space: nowrap; animation: marquee 22s linear infinite; }
        .marquee-item { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4c4c0; padding: 0 24px; border-right: 1px solid #f0f0f0; flex-shrink: 0; }
        .marquee-item.accent { color: #1a5c38; }

        .hero-bg-img { animation: heroZoom 8s ease-out forwards; transform: scale(1.04); }

        .live-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; display: inline-block; animation: pulse 2s infinite; }

        .float-badge { animation: float 3s ease-in-out infinite; }

        .float-card:hover { transform: rotate(0deg) translateY(-6px) !important; box-shadow: 0 30px 80px rgba(0,0,0,0.2) !important; }

        .step-row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid #e5e7eb; cursor: default; transition: padding-left .2s; }
        .step-row:last-child { border-bottom: none; }
        .step-row:hover { padding-left: 8px; }
      `}</style>

    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript and build**

```bash
npx tsc --noEmit
```

Fix any type errors before proceeding.

- [ ] **Step 3: Check the page in browser**

Navigate to `http://localhost:3002`. Verify:
- [ ] Nav is frosted white bar with ONEGOLF + green JOIN NOW
- [ ] Hero renders (dark or photo background), live pill visible, ONE/GOLF heading, GET STARTED button
- [ ] Marquee scrolls continuously, ✦ items are green
- [ ] Editorial section: ghosted PLAY, step rows hover and slide right, floating badges animate
- [ ] Green stats strip: 03 / $99 / 0 / ∞
- [ ] Savings comparison: two columns + black callout with $1,452
- [ ] Course scroll renders (empty state or cards), draggable
- [ ] Review carousel shows 3 cards, prev/next work, auto-advances, dots highlight
- [ ] Dark CTA section renders
- [ ] Footer with giant ONEGOLF

- [ ] **Step 4: Commit**

```bash
git add app/\(public\)/page.tsx components/homepage/
git commit -m "feat: redesign homepage with green editorial layout, savings section, courses, reviews carousel"
```

---

## Task 5: Place editorial images (optional — unblocks full visual)

**Files:**
- Add: `public/editorial-1.jpg`, `public/editorial-2.jpg`, `public/editorial-3.jpg`
- Add: `public/hero-golf.jpg`

- [ ] **Step 1: Download 3 golf photos from Unsplash (free license)**

Suggested searches: "golfer swing", "golf course wide", "golf ball green".
Save as `public/editorial-1.jpg`, `public/editorial-2.jpg`, `public/editorial-3.jpg`.

- [ ] **Step 2: Download hero photo**

Wide landscape golf course photo. Save as `public/hero-golf.jpg`.

- [ ] **Step 3: Flip the flag**

In `app/(public)/page.tsx`, change:
```tsx
const HERO_IMAGE_READY = false
```
to:
```tsx
const HERO_IMAGE_READY = true
```

Update editorial cards to use `<Image>` instead of the color placeholder div.

- [ ] **Step 4: Update next.config to allow unsplash if using remote URLs**

If using Unsplash remote URLs instead of local files, add to `next.config.ts`:
```ts
images: {
  remotePatterns: [{ hostname: 'images.unsplash.com' }],
}
```

- [ ] **Step 5: Commit**

```bash
git add public/
git commit -m "feat: add homepage photography assets"
```

---

## Verification Checklist

Run `npm run dev` → open `localhost:3002` (or next available port).

- [ ] Nav is fixed/sticky and shows frosted glass effect on scroll
- [ ] Hero section is full-viewport height
- [ ] Hero photo loads (or `#111` fallback renders when `HERO_IMAGE_READY = false`)
- [ ] Hero zoom animation plays once on load (scale 1.04 → 1.0 over 8s)
- [ ] Live pill above headline is visible with green pulsing dot
- [ ] Marquee scrolls continuously without gaps
- [ ] Editorial floating cards show with correct rotations (-3°, +2.5°, -1.5°)
- [ ] Hovering a floating card lifts it 6px and returns rotation to 0°
- [ ] Two floating badges animate (float up/down loop)
- [ ] Green stats strip shows all 4 stats (03 / $99 / 0 / ∞)
- [ ] Savings comparison renders two columns (cream + green) + black callout strip
- [ ] Course scroll section renders cards; dragging horizontally scrolls them
- [ ] Reviews section shows 3 cards at a time, auto-advances every 5s
- [ ] Prev/next buttons and dot indicators work in review carousel
- [ ] Dark CTA section shows two-column layout with photo left, copy right
- [ ] Footer renders with giant barely-visible ONEGOLF watermark text
- [ ] GET STARTED links → `/signup`
- [ ] PRICING links → `/pricing`
- [ ] LOG IN links → `/login`
