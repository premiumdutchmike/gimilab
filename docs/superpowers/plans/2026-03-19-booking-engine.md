# Booking Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the member-facing booking engine — browse courses, search/filter tee times, book slots, view booking history, and check credit ledger.

**Architecture:** Server Component pages read URL params and DB data, render Client Component filters + cards. Booking/cancellation go through Server Actions (`actions/booking.ts`) that call the existing `bookTeeTime()` / `cancelBooking()` business logic. AI search is a cached API route. No schema changes needed — all tables already exist.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Supabase Auth, shadcn/ui, Vercel AI SDK v6 + `@ai-sdk/anthropic`, Upstash Redis (caching + rate limiting), Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `actions/booking.ts` | Create | `bookSlot()`, `cancelSlot()` Server Actions |
| `app/api/ai/search/route.ts` | Create | AI intent extraction, Redis cache, rate limit |
| `proxy.ts` | Modify | Add `/api/` to isPublicPath so API routes return 401 JSON not HTML redirect |
| `components/course-card.tsx` | Create | Server Component — single course info card |
| `app/(member)/courses/page.tsx` | Create | Server Component — course grid |
| `components/book-filters.tsx` | Create | Client Component — date/course/time/AI filters, updates URL |
| `components/slot-card.tsx` | Create | Client Component — single bookable slot, opens BookingDialog |
| `components/booking-dialog.tsx` | Create | Client Component — confirm booking, calls `bookSlot` |
| `app/(member)/book/page.tsx` | Create | Server Component shell — reads params, queries slots |
| `components/round-card.tsx` | Create | Client Component — booking row with QR + cancel button |
| `components/cancel-dialog.tsx` | Create | Client Component — cancel confirmation with refund info |
| `app/(member)/rounds/page.tsx` | Create | Server Component — upcoming/past tabs |
| `components/ledger-table.tsx` | Create | Server Component — paginated ledger rows |
| `app/(member)/credits/page.tsx` | Create | Server Component — balance + ledger history |
| `app/(member)/dashboard/page.tsx` | Modify | Replace "coming soon" with link to `/book` |

---

## Task 1: Server Actions (`actions/booking.ts`)

**Files:**
- Create: `actions/booking.ts`
- Create: `actions/booking.test.ts`

**Context:**
- Pattern: see `actions/auth.ts` — uses `'use server'`, imports `createClient` from `@/lib/supabase/server`, returns `{ error }` on failure
- `bookTeeTime(userId, slotId)` from `lib/booking/book-tee-time.ts` — throws `'SLOT_NOT_AVAILABLE'` or `'INSUFFICIENT_CREDITS'`
- `cancelBooking(bookingId, userId, reason?)` from `lib/booking/book-tee-time.ts` — throws `'BOOKING_NOT_FOUND'`, `'UNAUTHORIZED'`, `'BOOKING_NOT_CANCELLABLE'`
- `bookSlot` redirects to `/rounds` on success (never returns, throws redirect)
- `cancelSlot` calls `revalidatePath('/rounds')` and returns `{}` on success — no redirect, page refreshes in-place

- [ ] **Step 1: Write the failing test**

Create `actions/booking.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/booking/book-tee-time', () => ({
  bookTeeTime: vi.fn(),
  cancelBooking: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { bookTeeTime, cancelBooking } from '@/lib/booking/book-tee-time'
import { bookSlot, cancelSlot } from './booking'

const mockUser = { id: 'user-123' }
const mockCreateClient = vi.mocked(createClient)
const mockBookTeeTime = vi.mocked(bookTeeTime)
const mockCancelBooking = vi.mocked(cancelBooking)

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
  } as any)
})

describe('bookSlot', () => {
  it('redirects to /rounds on success', async () => {
    mockBookTeeTime.mockResolvedValue({ booking: { id: 'b-1' } as any })
    await expect(bookSlot('slot-abc')).rejects.toThrow('REDIRECT:/rounds')
    expect(mockBookTeeTime).toHaveBeenCalledWith('user-123', 'slot-abc')
  })

  it('returns error when slot not available', async () => {
    mockBookTeeTime.mockRejectedValue(new Error('SLOT_NOT_AVAILABLE'))
    const result = await bookSlot('slot-abc')
    expect(result).toEqual({ error: 'This slot was just booked. Please choose another.' })
  })

  it('returns error when insufficient credits', async () => {
    mockBookTeeTime.mockRejectedValue(new Error('INSUFFICIENT_CREDITS'))
    const result = await bookSlot('slot-abc')
    expect(result).toEqual({ error: 'Not enough credits to book this slot.' })
  })

  it('returns error when user not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await bookSlot('slot-abc')
    expect(result).toEqual({ error: 'Not authenticated.' })
  })
})

describe('cancelSlot', () => {
  it('revalidates /rounds on success', async () => {
    mockCancelBooking.mockResolvedValue({ refunded: 50 })
    const { revalidatePath } = await import('next/cache')
    const result = await cancelSlot('booking-abc')
    expect(result).toEqual({})
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/rounds')
  })

  it('passes reason to cancelBooking', async () => {
    mockCancelBooking.mockResolvedValue({ refunded: 0 })
    await cancelSlot('booking-abc', 'Changed plans')
    expect(mockCancelBooking).toHaveBeenCalledWith('booking-abc', 'user-123', 'Changed plans')
  })

  it('returns error when booking not found', async () => {
    mockCancelBooking.mockRejectedValue(new Error('BOOKING_NOT_FOUND'))
    const result = await cancelSlot('booking-abc')
    expect(result).toEqual({ error: 'Booking not found.' })
  })

  it('returns error when already cancelled', async () => {
    mockCancelBooking.mockRejectedValue(new Error('BOOKING_NOT_CANCELLABLE'))
    const result = await cancelSlot('booking-abc')
    expect(result).toEqual({ error: 'This booking cannot be cancelled.' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/dutchmike/Desktop/Claude Agents/OneGolf/V1/onegolf"
npx vitest run actions/booking.test.ts
```
Expected: FAIL — `Cannot find module './booking'`

- [ ] **Step 3: Implement `actions/booking.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bookTeeTime } from '@/lib/booking/book-tee-time'
import { cancelBooking } from '@/lib/booking/book-tee-time'

export async function bookSlot(slotId: string): Promise<{ error: string } | never> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  try {
    await bookTeeTime(user.id, slotId)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'SLOT_NOT_AVAILABLE') {
      return { error: 'This slot was just booked. Please choose another.' }
    }
    if (message === 'INSUFFICIENT_CREDITS') {
      return { error: 'Not enough credits to book this slot.' }
    }
    return { error: 'Something went wrong. Please try again.' }
  }

  redirect('/rounds')
}

export async function cancelSlot(
  bookingId: string,
  reason?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  try {
    await cancelBooking(bookingId, user.id, reason)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'BOOKING_NOT_FOUND') return { error: 'Booking not found.' }
    if (message === 'UNAUTHORIZED') return { error: 'Not authorized.' }
    if (message === 'BOOKING_NOT_CANCELLABLE') return { error: 'This booking cannot be cancelled.' }
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/rounds')
  return {}
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run actions/booking.test.ts
```
Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add actions/booking.ts actions/booking.test.ts
git commit -m "feat: add bookSlot and cancelSlot server actions"
```

---

## Task 2: AI Search API Route + proxy.ts fix

**Files:**
- Create: `app/api/ai/search/route.ts`
- Modify: `proxy.ts` (line 38 — add `/api/` to isPublicPath)
- Create: `app/api/ai/search/route.test.ts`

**Context:**
- `aiSearchInputSchema` and `aiSearchIntentSchema` (and `AiSearchIntent` type) already exist in `lib/validations/index.ts`
- Redis: `@upstash/redis` installed — use `Redis.fromEnv()` (reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)
- Rate limiting: `@upstash/ratelimit` installed — 10 requests/min per user
- AI SDK v6: use `generateText` with `Output.object()` for structured output
- Model: `anthropic('claude-sonnet-4-6')` from `@ai-sdk/anthropic`
- proxy.ts issue: all `/api/` routes (including `/api/credits/balance` and the new `/api/ai/search`) should return `{ error: 'Unauthorized' }` JSON not HTML redirects when unauthenticated. Add `pathname.startsWith('/api/')` to `isPublicPath` — each API route handles its own 401.

- [ ] **Step 1: Write the failing test**

Create `app/api/ai/search/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })) },
}))
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({ success: true }),
  })),
}))
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return { ...actual, generateText: vi.fn(), Output: { object: vi.fn() } }
})
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'mock-model'),
}))

import { createClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'
import { generateText } from 'ai'
import { POST } from './route'

const mockUser = { id: 'user-123' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
  } as any)
})

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/ai/search', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/ai/search', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const res = await POST(makeRequest({ query: 'saturday morning' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    const res = await POST(makeRequest({ query: '' }))
    expect(res.status).toBe(400)
  })

  it('returns cached result on cache hit', async () => {
    const cached = { timeOfDay: 'morning', dateRange: { start: '2026-03-21', end: '2026-03-21' } }
    const redis = Redis.fromEnv()
    vi.mocked(redis.get).mockResolvedValue(cached)
    const res = await POST(makeRequest({ query: 'saturday morning' }))
    const data = await res.json()
    expect(data).toEqual(cached)
    expect(generateText).not.toHaveBeenCalled()
  })

  it('calls AI and caches on cache miss', async () => {
    const intent = { timeOfDay: 'morning' as const }
    const redis = Redis.fromEnv()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(generateText).mockResolvedValue({ output: intent } as any)
    const res = await POST(makeRequest({ query: 'saturday morning' }))
    const data = await res.json()
    expect(data).toEqual(intent)
    expect(redis.set).toHaveBeenCalled()
  })

  it('returns 429 when rate limited', async () => {
    const { Ratelimit } = await import('@upstash/ratelimit')
    vi.mocked(Ratelimit).mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue({ success: false }),
    }) as any)
    const res = await POST(makeRequest({ query: 'morning round' }))
    expect(res.status).toBe(429)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run "app/api/ai/search/route.test.ts"
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement the route**

Create `app/api/ai/search/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { generateText, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { aiSearchInputSchema, aiSearchIntentSchema } from '@/lib/validations'
import type { AiSearchIntent } from '@/lib/validations'

const redis = Redis.fromEnv()

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
})

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit per user
  const { success } = await ratelimit.limit(user.id)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many searches — try again in a minute.' },
      { status: 429 }
    )
  }

  // Parse + validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = aiSearchInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { query } = parsed.data
  const normalised = query.toLowerCase().trim()
  const cacheKey = `ai:search:${createHash('sha256').update(normalised).digest('hex').slice(0, 24)}`

  // Cache hit
  const cached = await redis.get<AiSearchIntent>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  // AI call
  const today = new Date().toISOString().split('T')[0]

  try {
    const { output } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      prompt: `Today is ${today}. Extract booking intent from this golf tee time search query: "${query}". Return structured data with optional fields only when clearly stated.`,
      output: Output.object({ schema: aiSearchIntentSchema }),
    })

    const intent = output as AiSearchIntent

    // Cache for 5 minutes
    await redis.set(cacheKey, intent, { ex: 300 })

    return NextResponse.json(intent)
  } catch {
    return NextResponse.json({ error: 'Search unavailable. Use filters instead.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Update `proxy.ts` — add `/api/` to isPublicPath**

In `proxy.ts`, find line 38 and update the `isPublicPath` check:

```ts
// BEFORE:
const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith('/auth') || pathname.startsWith('/welcome') || pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/cron'))

// AFTER:
const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith('/auth') || pathname.startsWith('/welcome') || pathname.startsWith('/api/'))
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run "app/api/ai/search/route.test.ts"
```
Expected: 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/ai/search/route.ts app/api/ai/search/route.test.ts proxy.ts
git commit -m "feat: add AI search route with Redis caching and rate limiting"
```

---

## Task 3: Course Card + Courses Page

**Files:**
- Create: `components/course-card.tsx`
- Create: `app/(member)/courses/page.tsx`

**Context:**
- `Course` type from `lib/db/schema.ts` — relevant fields: `id, name, slug, address, holes, creditFloor, creditCeiling, avgRating, amenities, status`
- Design: dark theme `#090f1a`, surface `#0f1923`, green `#4ade80`
- Uses `Badge`, `Card` from `@/components/ui/`
- Pure Server Component — no `'use client'`
- Query: `db.select().from(courses).where(eq(courses.status, 'active'))`
- "Book a tee time →" links to `/book?course=${course.slug}`

- [ ] **Step 1: Create `components/course-card.tsx`**

```tsx
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Course } from '@/lib/db/schema'

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const creditRange = course.creditFloor && course.creditCeiling
    ? `${course.creditFloor}–${course.creditCeiling} credits`
    : course.baseCreditCost
    ? `~${course.baseCreditCost} credits`
    : 'Credits vary'

  const rating = course.avgRating ? Number(course.avgRating).toFixed(1) : null

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white text-lg leading-snug">{course.name}</h3>
          <p className="text-white/50 text-sm mt-0.5">{course.address}</p>
        </div>
        {rating && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-white/70 text-sm font-medium">{rating}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
          {course.holes ?? 18} holes
        </Badge>
        <Badge variant="outline" className="border-green-400/30 text-green-400 text-xs">
          {creditRange}
        </Badge>
        {(course.amenities ?? []).slice(0, 3).map((a) => (
          <Badge key={a} variant="outline" className="border-white/10 text-white/40 text-xs">
            {a}
          </Badge>
        ))}
      </div>

      <Link
        href={`/book?course=${course.slug}`}
        className="mt-auto inline-flex items-center justify-center rounded-lg bg-green-400 text-black text-sm font-semibold px-4 py-2 hover:bg-green-300 transition-colors"
      >
        Book a tee time →
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(member)/courses/page.tsx`**

```tsx
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { CourseCard } from '@/components/course-card'

export const metadata = { title: 'Courses — OneGolf' }

export default async function CoursesPage() {
  const activeCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.status, 'active'))

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Courses</h1>
        <p className="text-white/50 text-sm mb-8">Browse partner courses available for booking.</p>

        {activeCourses.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-white/40">No courses available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify manually**

Navigate to `http://localhost:3001/courses` — should show empty state (no courses seeded yet). No errors in terminal.

- [ ] **Step 4: Commit**

```bash
git add components/course-card.tsx app/\(member\)/courses/page.tsx
git commit -m "feat: add courses page with CourseCard component"
```

---

## Task 4: BookFilters Component

**Files:**
- Create: `components/book-filters.tsx`

**Context:**
- Client Component (`'use client'`)
- Manages date/course/timeOfDay/maxCredits filters by reading + writing URL search params via `useSearchParams` + `useRouter`
- AI search bar sends POST to `/api/ai/search`, maps response to URL params, calls `router.push`
- Uses `Select`, `Input`, `Button` from `@/components/ui/`
- Date input: HTML `<input type="date">` — no external date picker needed
- Course dropdown: `Select` from shadcn showing all active courses (passed as prop from Server Component)
- Time of day: `Select` with options: Any / Morning (6am–12pm) / Afternoon (12pm–5pm) / Evening (5pm–8pm)
- On any filter change → update URL params → Server Component re-renders with new results

- [ ] **Step 1: Create `components/book-filters.tsx`**

```tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AiSearchIntent } from '@/lib/validations'

interface CourseOption {
  slug: string
  name: string
}

interface BookFiltersProps {
  courses: CourseOption[]
}

export function BookFilters({ courses }: BookFiltersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [aiQuery, setAiQuery] = useState('')
  const [aiError, setAiError] = useState('')
  const [isSearching, startSearchTransition] = useTransition()

  const current = {
    date: searchParams.get('date') ?? '',
    course: searchParams.get('course') ?? '',
    timeOfDay: searchParams.get('timeOfDay') ?? 'any',
    maxCredits: searchParams.get('maxCredits') ?? '',
  }

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'any') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/book?${params.toString()}`)
  }

  function handleAiSearch() {
    if (!aiQuery.trim()) return
    setAiError('')

    startSearchTransition(async () => {
      try {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: aiQuery }),
        })

        if (res.status === 429) {
          setAiError('Too many searches — try again in a minute.')
          return
        }

        if (!res.ok) {
          setAiError('Search unavailable. Use filters instead.')
          return
        }

        const intent: AiSearchIntent = await res.json()
        const params = new URLSearchParams(searchParams.toString())

        if (intent.dateRange?.start) params.set('date', intent.dateRange.start)
        if (intent.timeOfDay && intent.timeOfDay !== 'any') params.set('timeOfDay', intent.timeOfDay)
        else params.delete('timeOfDay')
        if (intent.maxCredits) params.set('maxCredits', String(intent.maxCredits))
        else params.delete('maxCredits')
        // holes, maxDistanceMiles, amenities ignored in Phase 2

        router.push(`/book?${params.toString()}`)
        setAiQuery('')
      } catch {
        setAiError('Search unavailable. Use filters instead.')
      }
    })
  }

  return (
    <div className="space-y-4 mb-6">
      {/* AI Search Bar */}
      <div className="flex gap-2">
        <Input
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
          placeholder="Describe what you're looking for… e.g. Saturday morning 18 holes"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-green-400/50"
          disabled={isSearching}
        />
        <Button
          onClick={handleAiSearch}
          disabled={isSearching || !aiQuery.trim()}
          className="bg-green-400 text-black hover:bg-green-300 font-semibold shrink-0"
        >
          {isSearching ? '…' : 'Search'}
        </Button>
      </div>
      {aiError && <p className="text-red-400 text-sm">{aiError}</p>}

      {/* Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Date */}
        <input
          type="date"
          value={current.date}
          onChange={(e) => updateParam('date', e.target.value)}
          className="col-span-2 sm:col-span-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark] focus:outline-none focus:border-green-400/50"
        />

        {/* Course */}
        <Select
          value={current.course || 'any'}
          onValueChange={(v) => updateParam('course', v === 'any' ? '' : v)}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Any course" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f1923] border-white/10">
            <SelectItem value="any" className="text-white/70">Any course</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.slug} value={c.slug} className="text-white">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time of day */}
        <Select
          value={current.timeOfDay}
          onValueChange={(v) => updateParam('timeOfDay', v)}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Any time" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f1923] border-white/10">
            <SelectItem value="any" className="text-white/70">Any time</SelectItem>
            <SelectItem value="morning" className="text-white">Morning (6am–12pm)</SelectItem>
            <SelectItem value="afternoon" className="text-white">Afternoon (12pm–5pm)</SelectItem>
            <SelectItem value="evening" className="text-white">Evening (5pm–8pm)</SelectItem>
          </SelectContent>
        </Select>

        {/* Max credits */}
        <input
          type="number"
          value={current.maxCredits}
          onChange={(e) => updateParam('maxCredits', e.target.value)}
          placeholder="Max credits"
          min={1}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-400/50"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/book-filters.tsx
git commit -m "feat: add BookFilters client component with AI search + URL param filters"
```

---

## Task 5: SlotCard + BookingDialog

**Files:**
- Create: `components/slot-card.tsx`
- Create: `components/booking-dialog.tsx`

**Context:**
- `SlotCard` is a Client Component — shows slot info, opens `BookingDialog` on click
- `BookingDialog` is a Client Component using shadcn `Dialog` — shows booking confirmation, calls `bookSlot` server action
- Both use `useTransition` for loading state during server action
- Design: slot card is a button-like row, dialog shows credit math
- `bookSlot` from `actions/booking.ts` — may return `{ error }` or redirect (throws)

- [ ] **Step 1: Create `components/booking-dialog.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { bookSlot } from '@/actions/booking'

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: {
    id: string
    courseName: string
    courseHoles: number
    date: string
    startTime: string
    creditCost: number
  }
  userBalance: number
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function BookingDialog({ open, onOpenChange, slot, userBalance }: BookingDialogProps) {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const remaining = userBalance - slot.creditCost
  const canAfford = remaining >= 0

  function handleConfirm() {
    setError('')
    startTransition(async () => {
      const result = await bookSlot(slot.id)
      // If bookSlot redirects, we never reach here
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1923] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Confirm Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-1.5">
            <p className="font-semibold text-white">{slot.courseName}</p>
            <p className="text-white/60 text-sm">{slot.courseHoles} holes</p>
            <p className="text-white/60 text-sm">
              {formatDate(slot.date)} · {formatTime(slot.startTime)}
            </p>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Credit cost</span>
              <span className="text-red-400 font-medium">−{slot.creditCost}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Your balance</span>
              <span>{userBalance}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-white/10 pt-1.5">
              <span>Balance after</span>
              <span className={canAfford ? 'text-green-400' : 'text-red-400'}>{remaining}</span>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="border-white/20 text-white/70 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !canAfford}
            className="bg-green-400 text-black hover:bg-green-300 font-semibold"
          >
            {isPending ? 'Booking…' : 'Confirm Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create `components/slot-card.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { BookingDialog } from '@/components/booking-dialog'

interface SlotCardProps {
  slot: {
    id: string
    courseName: string
    courseHoles: number
    date: string
    startTime: string
    creditCost: number
  }
  userBalance: number
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function SlotCard({ slot, userBalance }: SlotCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const canAfford = userBalance >= slot.creditCost

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left hover:border-green-400/40 hover:bg-white/5 transition-colors"
      >
        <div>
          <p className="font-medium text-white">{slot.courseName}</p>
          <p className="text-white/50 text-sm mt-0.5">
            {formatDate(slot.date)} · {formatTime(slot.startTime)} · {slot.courseHoles} holes
          </p>
        </div>
        <Badge
          className={`shrink-0 ml-4 font-semibold text-sm px-3 py-1 ${
            canAfford
              ? 'bg-green-400/10 text-green-400 border-green-400/30'
              : 'bg-white/5 text-white/30 border-white/10'
          } border`}
        >
          {slot.creditCost} credits
        </Badge>
      </button>

      <BookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        slot={slot}
        userBalance={userBalance}
      />
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/booking-dialog.tsx components/slot-card.tsx
git commit -m "feat: add SlotCard and BookingDialog components"
```

---

## Task 6: Book Page

**Files:**
- Create: `app/(member)/book/page.tsx`

**Context:**
- Server Component — reads `searchParams` (must `await` in Next.js 16)
- Fetches active courses for filter dropdown (props to `BookFilters`)
- Queries `teeTimeSlots` with `status = 'AVAILABLE'` + optional date/course/timeOfDay/maxCredits filters
- Joins `courses` to get name and holes
- Gets user's credit balance to pass to `SlotCard`
- Default date: tomorrow (if no date param)
- Time of day mapping: morning = 06:00–11:59, afternoon = 12:00–16:59, evening = 17:00–20:00

- [ ] **Step 1: Create `app/(member)/book/page.tsx`**

```tsx
import { db } from '@/lib/db'
import { teeTimeSlots, courses } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import { BookFilters } from '@/components/book-filters'
import { SlotCard } from '@/components/slot-card'
import { Skeleton } from '@/components/ui/skeleton'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Book a Tee Time — OneGolf' }

interface BookPageProps {
  searchParams: Promise<{
    date?: string
    course?: string
    timeOfDay?: string
    maxCredits?: string
  }>
}

const TIME_RANGES: Record<string, { from: string; to: string }> = {
  morning: { from: '06:00', to: '11:59' },
  afternoon: { from: '12:00', to: '16:59' },
  evening: { from: '17:00', to: '20:00' },
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Default date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]
  const selectedDate = params.date ?? defaultDate

  // Get all active courses for filter dropdown
  const activeCourses = await db
    .select({ slug: courses.slug, name: courses.name })
    .from(courses)
    .where(eq(courses.status, 'active'))

  // Build slot query conditions
  const conditions = [
    eq(teeTimeSlots.status, 'AVAILABLE'),
    eq(teeTimeSlots.date, selectedDate),
  ]

  // Course filter
  if (params.course) {
    const [matchedCourse] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.slug, params.course))
    if (matchedCourse) {
      conditions.push(eq(teeTimeSlots.courseId, matchedCourse.id))
    }
  }

  // Time of day filter
  const timeRange = params.timeOfDay ? TIME_RANGES[params.timeOfDay] : null
  if (timeRange) {
    conditions.push(gte(teeTimeSlots.startTime, timeRange.from))
    conditions.push(lte(teeTimeSlots.startTime, timeRange.to))
  }

  // Max credits filter
  if (params.maxCredits) {
    const max = parseInt(params.maxCredits, 10)
    if (!isNaN(max)) {
      conditions.push(lte(teeTimeSlots.creditCost, max))
    }
  }

  const [slots, balance] = await Promise.all([
    db
      .select({
        id: teeTimeSlots.id,
        date: teeTimeSlots.date,
        startTime: teeTimeSlots.startTime,
        creditCost: teeTimeSlots.creditCost,
        courseName: courses.name,
        courseHoles: courses.holes,
        courseSlug: courses.slug,
      })
      .from(teeTimeSlots)
      .innerJoin(courses, eq(teeTimeSlots.courseId, courses.id))
      .where(and(...conditions))
      .orderBy(teeTimeSlots.startTime)
      .limit(50),
    getCreditBalance(user.id),
  ])

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Book a Tee Time</h1>
          <span className="text-green-400 font-semibold tabular-nums">
            {balance} credits
          </span>
        </div>

        <BookFilters courses={activeCourses} />

        {slots.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-white/40">No tee times found — try adjusting your filters.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {slots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={{
                  id: slot.id,
                  courseName: slot.courseName,
                  courseHoles: slot.courseHoles ?? 18,
                  date: slot.date,
                  startTime: slot.startTime,
                  creditCost: slot.creditCost,
                }}
                userBalance={balance}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify manually**

Navigate to `http://localhost:3001/book` — should show filters and empty state (no slots yet). No errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(member\)/book/page.tsx
git commit -m "feat: add /book page with slot query and filter integration"
```

---

## Task 7: RoundCard + CancelDialog

**Files:**
- Create: `components/cancel-dialog.tsx`
- Create: `components/round-card.tsx`

**Context:**
- `RoundCard` is a Client Component — shows booking info, QR code (expandable), cancel button for upcoming
- `CancelDialog` is a Client Component — shows refund info (calculated from `hoursUntilTeeTime`), calls `cancelSlot`
- Refund logic: if `hoursUntilTeeTime > 24` → full refund, else → no refund
- Status badges: CONFIRMED = green, CANCELLED = gray, COMPLETED = blue, NO_SHOW = amber
- QR code: just display `booking.qrCode` as text in a monospace badge (real QR rendering is Phase 3)

- [ ] **Step 1: Create `components/cancel-dialog.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cancelSlot } from '@/actions/booking'

interface CancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  creditCost: number
  hoursUntilTeeTime: number
}

export function CancelDialog({
  open,
  onOpenChange,
  bookingId,
  creditCost,
  hoursUntilTeeTime,
}: CancelDialogProps) {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const willRefund = hoursUntilTeeTime > 24

  function handleCancel() {
    setError('')
    startTransition(async () => {
      const result = await cancelSlot(bookingId)
      if (result?.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1923] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Cancel Booking</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {willRefund ? (
            <div className="rounded-lg bg-green-400/10 border border-green-400/20 px-4 py-3">
              <p className="text-green-400 text-sm font-medium">
                Full refund of {creditCost} credits
              </p>
              <p className="text-white/50 text-xs mt-0.5">
                More than 24 hours until your tee time — credits will be returned immediately.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 px-4 py-3">
              <p className="text-amber-400 text-sm font-medium">No refund</p>
              <p className="text-white/50 text-xs mt-0.5">
                Less than 24 hours until your tee time — credits will not be returned.
              </p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="border-white/20 text-white/70 hover:bg-white/10"
          >
            Keep Booking
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isPending}
            className="bg-red-500 text-white hover:bg-red-600 font-semibold"
          >
            {isPending ? 'Cancelling…' : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create `components/round-card.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CancelDialog } from '@/components/cancel-dialog'

interface RoundCardProps {
  booking: {
    id: string
    courseName: string
    courseHoles: number
    date: string
    startTime: string
    creditCost: number
    status: string
    qrCode: string | null
  }
  isUpcoming: boolean
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-green-400/10 text-green-400 border-green-400/30',
  CANCELLED: 'bg-white/5 text-white/40 border-white/10',
  COMPLETED: 'bg-sky-400/10 text-sky-400 border-sky-400/30',
  NO_SHOW: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function RoundCard({ booking, isUpcoming }: RoundCardProps) {
  const [showQr, setShowQr] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const teeDateTime = new Date(`${booking.date}T${booking.startTime}`)
  const hoursUntilTeeTime = (teeDateTime.getTime() - Date.now()) / (1000 * 60 * 60)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{booking.courseName}</p>
          <p className="text-white/50 text-sm mt-0.5">
            {formatDate(booking.date)} · {formatTime(booking.startTime)} · {booking.courseHoles} holes
          </p>
        </div>
        <Badge
          className={`shrink-0 border text-xs ${STATUS_STYLES[booking.status] ?? STATUS_STYLES.CANCELLED}`}
        >
          {booking.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-white/40 text-sm">{booking.creditCost} credits</span>

        {isUpcoming && booking.status === 'CONFIRMED' && (
          <div className="flex items-center gap-2">
            {booking.qrCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQr((v) => !v)}
                className="border-white/20 text-white/60 hover:bg-white/10 text-xs h-7"
              >
                {showQr ? 'Hide QR' : 'Show QR'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(true)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-7"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {showQr && booking.qrCode && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-white/40 text-xs mb-1 uppercase tracking-widest">Check-in Code</p>
          <p className="font-mono text-xs text-white/70 break-all">{booking.qrCode}</p>
        </div>
      )}

      <CancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        bookingId={booking.id}
        creditCost={booking.creditCost}
        hoursUntilTeeTime={hoursUntilTeeTime}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/cancel-dialog.tsx components/round-card.tsx
git commit -m "feat: add RoundCard and CancelDialog components"
```

---

## Task 8: Rounds Page

**Files:**
- Create: `app/(member)/rounds/page.tsx`

**Context:**
- Server Component with shadcn `Tabs` — Upcoming / Past
- Query: `bookings` joined to `teeTimeSlots` (for date/time) and `courses` (for name/holes)
- Upcoming: status = 'CONFIRMED' AND date >= today
- Past: everything else
- Order: upcoming ASC by date, past DESC by date

- [ ] **Step 1: Create `app/(member)/rounds/page.tsx`**

```tsx
import { db } from '@/lib/db'
import { bookings, teeTimeSlots, courses } from '@/lib/db/schema'
import { eq, desc, asc } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoundCard } from '@/components/round-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata = { title: 'My Rounds — OneGolf' }

export default async function RoundsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const allBookings = await db
    .select({
      id: bookings.id,
      creditCost: bookings.creditCost,
      status: bookings.status,
      qrCode: bookings.qrCode,
      slotDate: teeTimeSlots.date,
      slotStartTime: teeTimeSlots.startTime,
      courseName: courses.name,
      courseHoles: courses.holes,
    })
    .from(bookings)
    .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
    .innerJoin(courses, eq(bookings.courseId, courses.id))
    .where(eq(bookings.userId, user.id))
    .orderBy(asc(teeTimeSlots.date), asc(teeTimeSlots.startTime))

  const upcoming = allBookings.filter(
    (b) => b.status === 'CONFIRMED' && b.slotDate >= today
  )
  const past = allBookings
    .filter((b) => b.status !== 'CONFIRMED' || b.slotDate < today)
    .reverse() // most recent first for past

  function toRoundCardProps(b: typeof allBookings[0]) {
    return {
      id: b.id,
      courseName: b.courseName,
      courseHoles: b.courseHoles ?? 18,
      date: b.slotDate,
      startTime: b.slotStartTime,
      creditCost: b.creditCost,
      status: b.status,
      qrCode: b.qrCode,
    }
  }

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">My Rounds</h1>

        <Tabs defaultValue="upcoming">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50"
            >
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50"
            >
              Past ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="text-white/40">No upcoming rounds.</p>
                <a href="/book" className="text-green-400 text-sm mt-2 inline-block hover:underline">
                  Book a tee time →
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((b) => (
                  <RoundCard key={b.id} booking={toRoundCardProps(b)} isUpcoming />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {past.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
                <p className="text-white/40">No past rounds yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {past.map((b) => (
                  <RoundCard key={b.id} booking={toRoundCardProps(b)} isUpcoming={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify manually**

Navigate to `http://localhost:3001/rounds` — should show tabs with empty states. No errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(member\)/rounds/page.tsx
git commit -m "feat: add /rounds page with upcoming/past tabs"
```

---

## Task 9: Credits Page + LedgerTable

**Files:**
- Create: `components/ledger-table.tsx`
- Create: `app/(member)/credits/page.tsx`

**Context:**
- `getLedgerHistory(userId, 20)` already exists in `lib/credits/ledger.ts` — returns `CreditLedgerEntry[]`
- `CreditLedgerEntry` type from `lib/db/schema.ts`: `{ id, userId, amount, type, referenceId, notes, expiresAt, createdAt }`
- `LedgerEntryType` union type also from schema
- Type badge colors: SUBSCRIPTION_GRANT=blue, BOOKING_DEBIT=red, BOOKING_REFUND=green, ADMIN_ADJUSTMENT=amber, CREDIT_EXPIRY=gray, BONUS_GRANT=purple, TOP_UP_PURCHASE=teal
- Amount: positive = green "+N", negative = red "−N" (use Math.abs for display)
- Pure Server Component — no `'use client'`

- [ ] **Step 1: Create `components/ledger-table.tsx`**

```tsx
import { Badge } from '@/components/ui/badge'
import type { CreditLedgerEntry, LedgerEntryType } from '@/lib/db/schema'

interface LedgerTableProps {
  entries: CreditLedgerEntry[]
}

const TYPE_STYLES: Record<LedgerEntryType, string> = {
  SUBSCRIPTION_GRANT: 'bg-sky-400/10 text-sky-400 border-sky-400/30',
  BOOKING_DEBIT: 'bg-red-400/10 text-red-400 border-red-400/30',
  BOOKING_REFUND: 'bg-green-400/10 text-green-400 border-green-400/30',
  ADMIN_ADJUSTMENT: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  CREDIT_EXPIRY: 'bg-white/5 text-white/40 border-white/10',
  BONUS_GRANT: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
  TOP_UP_PURCHASE: 'bg-teal-400/10 text-teal-400 border-teal-400/30',
}

const TYPE_LABELS: Record<LedgerEntryType, string> = {
  SUBSCRIPTION_GRANT: 'Monthly Grant',
  BOOKING_DEBIT: 'Booking',
  BOOKING_REFUND: 'Refund',
  ADMIN_ADJUSTMENT: 'Adjustment',
  CREDIT_EXPIRY: 'Expired',
  BONUS_GRANT: 'Bonus',
  TOP_UP_PURCHASE: 'Top-up',
}

export function LedgerTable({ entries }: LedgerTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-white/40">No transactions yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      {entries.map((entry, i) => {
        const type = entry.type as LedgerEntryType
        const isCredit = entry.amount > 0
        const absAmount = Math.abs(entry.amount)
        const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

        return (
          <div
            key={entry.id}
            className={`flex items-center justify-between px-5 py-3.5 ${
              i < entries.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Badge className={`shrink-0 border text-xs ${TYPE_STYLES[type] ?? TYPE_STYLES.ADMIN_ADJUSTMENT}`}>
                {TYPE_LABELS[type] ?? type}
              </Badge>
              <div className="min-w-0">
                {entry.notes && (
                  <p className="text-white/50 text-xs truncate">{entry.notes}</p>
                )}
                <p className="text-white/30 text-xs">{date}</p>
              </div>
            </div>
            <span
              className={`shrink-0 ml-4 font-semibold tabular-nums text-sm ${
                isCredit ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isCredit ? '+' : '−'}{absAmount}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(member)/credits/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getCreditBalance, getLedgerHistory } from '@/lib/credits/ledger'
import { LedgerTable } from '@/components/ledger-table'

export const metadata = { title: 'Credits — OneGolf' }

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [dbUser, balance, entries] = await Promise.all([
    db.select().from(users).where(eq(users.id, user.id)).then(([u]) => u),
    getCreditBalance(user.id),
    getLedgerHistory(user.id, 20),
  ])

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Credits</h1>

        {/* Balance card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-6">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Current Balance</p>
          <p className="text-5xl font-bold text-green-400 tabular-nums">{balance}</p>
          {dbUser?.subscriptionTier && (
            <p className="text-white/40 text-sm mt-1 capitalize">
              {dbUser.subscriptionTier} plan · credits renew monthly
            </p>
          )}
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="text-white/60 text-sm uppercase tracking-widest mb-3">
            Transaction History
          </h2>
          <LedgerTable entries={entries} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify manually**

Navigate to `http://localhost:3001/credits` — shows balance (150), SUBSCRIPTION_GRANT entry in ledger. No errors.

- [ ] **Step 4: Commit**

```bash
git add components/ledger-table.tsx app/\(member\)/credits/page.tsx
git commit -m "feat: add /credits page with balance and ledger history"
```

---

## Task 10: Dashboard Update + Demo Data Seed

**Files:**
- Modify: `app/(member)/dashboard/page.tsx` — replace "coming soon" with nav links

**Context:**
- Replace the "AI booking search coming soon..." placeholder with navigation links to `/book`, `/rounds`, `/credits`, `/courses`
- Keep the credit balance card and sign out
- Demo seed SQL is in the spec at `docs/superpowers/specs/2026-03-19-booking-engine-design.md` (Step 1 and Step 2)

- [ ] **Step 1: Update dashboard — replace placeholder with nav links**

In `app/(member)/dashboard/page.tsx`, replace the entire "Find a Tee Time" card with nav links:

```tsx
import { redirect } from 'next/navigation'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { signOut } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Dashboard — OneGolf' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id))
  const balance = await getCreditBalance(user.id)

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">
          Hey, {dbUser?.fullName?.split(' ')[0] ?? 'there'} 👋
        </h1>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Credit Balance</p>
          <p className="text-5xl font-bold text-green-400">{balance}</p>
          <p className="text-white/40 text-sm mt-1 capitalize">
            {dbUser?.subscriptionTier ?? '—'} plan
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href="/book"
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-green-400/40 hover:bg-white/5 transition-colors"
          >
            <p className="text-green-400 text-2xl mb-2">⛳</p>
            <p className="font-semibold text-white text-sm">Book a Tee Time</p>
            <p className="text-white/40 text-xs mt-0.5">Find and book available slots</p>
          </Link>
          <Link
            href="/rounds"
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/5 transition-colors"
          >
            <p className="text-sky-400 text-2xl mb-2">📋</p>
            <p className="font-semibold text-white text-sm">My Rounds</p>
            <p className="text-white/40 text-xs mt-0.5">View and manage bookings</p>
          </Link>
          <Link
            href="/credits"
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/5 transition-colors"
          >
            <p className="text-purple-400 text-2xl mb-2">💳</p>
            <p className="font-semibold text-white text-sm">Credits</p>
            <p className="text-white/40 text-xs mt-0.5">Balance and transaction history</p>
          </Link>
          <Link
            href="/courses"
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/5 transition-colors"
          >
            <p className="text-amber-400 text-2xl mb-2">🏌️</p>
            <p className="font-semibold text-white text-sm">Courses</p>
            <p className="text-white/40 text-xs mt-0.5">Browse partner courses</p>
          </Link>
        </div>

        <form action={signOut}>
          <button type="submit" className="text-white/30 text-sm hover:text-white/50 underline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit dashboard update**

```bash
git add app/\(member\)/dashboard/page.tsx
git commit -m "feat: update dashboard with navigation links to booking engine pages"
```

- [ ] **Step 3: Seed demo data in Supabase**

Go to [Supabase Dashboard → SQL Editor → New query](https://supabase.com/dashboard).

Run this SQL (replace `<YOUR_USER_ID>` with your actual Supabase Auth user ID — find it in Authentication → Users):

```sql
-- Step 1: Insert demo partner
WITH partner_insert AS (
  INSERT INTO partners (id, user_id, business_name, status, approved_at)
  VALUES (gen_random_uuid(), '<YOUR_USER_ID>', 'Demo Golf Co', 'approved', now())
  RETURNING id
),
-- Step 2: Insert 3 courses
course_insert AS (
  INSERT INTO courses (id, partner_id, name, slug, description, address, holes, base_credit_cost, credit_floor, credit_ceiling, status, payout_rate)
  SELECT
    gen_random_uuid(), partner_insert.id, name, slug, description, address, holes, base_credit_cost, credit_floor, credit_ceiling, 'active', 0.65
  FROM partner_insert,
  (VALUES
    ('Pebble Creek Golf Club', 'pebble-creek', '18-hole championship course', '123 Golf Lane, San Francisco, CA', 18, 80, 60, 120),
    ('Sunrise Links', 'sunrise-links', 'Classic 18-hole parkland course', '456 Fairway Blvd, Oakland, CA', 18, 60, 40, 90),
    ('The Short Course', 'short-course', 'Fun 9-hole executive course', '789 Birdie Way, San Jose, CA', 9, 35, 25, 55)
  ) AS c(name, slug, description, address, holes, base_credit_cost, credit_floor, credit_ceiling)
  RETURNING id, slug
)
SELECT id, slug FROM course_insert;
```

Copy the 3 course IDs from the output. Then run the blocks SQL (replace `<PEBBLE_ID>`, `<SUNRISE_ID>`, `<SHORT_ID>`):

```sql
-- Pebble Creek: weekday mornings
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<PEBBLE_ID>', ARRAY[1,2,3,4,5], '07:00', '12:00', 1, CURRENT_DATE, true);

-- Pebble Creek: weekend all-day
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<PEBBLE_ID>', ARRAY[0,6], '06:00', '17:00', 1, CURRENT_DATE, true);

-- Sunrise Links: daily mornings
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<SUNRISE_ID>', ARRAY[0,1,2,3,4,5,6], '07:00', '13:00', 1, CURRENT_DATE, true);

-- Sunrise Links: weekend afternoons
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<SUNRISE_ID>', ARRAY[0,6], '13:00', '17:00', 1, CURRENT_DATE, true);

-- The Short Course: daily all-day
INSERT INTO tee_time_blocks (id, course_id, day_of_week, start_time, end_time, slots_per_interval, valid_from, is_active)
VALUES (gen_random_uuid(), '<SHORT_ID>', ARRAY[0,1,2,3,4,5,6], '08:00', '16:00', 1, CURRENT_DATE, true);
```

- [ ] **Step 4: Generate slots**

With `stripe listen` running and dev server on port 3001:

```bash
curl -H "Authorization: Bearer $(grep CRON_SECRET /Users/dutchmike/Desktop/Claude\ Agents/OneGolf/V1/onegolf/.env.local | cut -d= -f2)" \
  http://localhost:3001/api/cron/generate-slots
```

Expected response: `{"created": <N>, "timestamp": "..."}` where N > 0.

Verify in Supabase: Table Editor → `tee_time_slots` → should have rows with `status = 'AVAILABLE'`.

- [ ] **Step 5: End-to-end verification**

Run through the spec verification steps:

1. `/courses` — shows 3 course cards ✓
2. Click "Book a tee time →" on Pebble Creek — lands on `/book?course=pebble-creek` ✓
3. Adjust date to a date that has slots — slot cards appear ✓
4. Type "Saturday morning 18 holes" in AI search — filters update ✓
5. Click a slot → BookingDialog opens with credit math ✓
6. Confirm → redirected to `/rounds` ✓
7. `/rounds` Upcoming tab shows booking with QR code ✓
8. Cancel → dialog shows refund info, confirm → booking moves to Past ✓
9. `/credits` → ledger shows SUBSCRIPTION_GRANT + BOOKING_DEBIT + BOOKING_REFUND ✓
10. `/dashboard` → all 4 nav cards work ✓

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 2 booking engine — courses, book, rounds, credits pages"
```
