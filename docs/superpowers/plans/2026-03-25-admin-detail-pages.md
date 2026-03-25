# Admin Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clickable course and member rows to the admin console, each opening a sidebar-nav detail page with full activity logs and admin actions (edit, suspend, credit adjustments, subscription management, refunds).

**Architecture:** All data fetched server-side in page components using Drizzle queries added to `lib/admin/queries.ts`. Admin mutations live in `actions/admin/` with a shared `requireAdmin()` guard. Both detail pages use a client-side sidebar that shows/hides sections via a `section` URL search param — no client-side state needed for navigation, just `<Link>` with `?section=bookings` etc., letting the server component read `searchParams` and render the correct section.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Supabase Auth, Stripe, TypeScript strict, inline styles (no Tailwind — follow existing admin page patterns).

**Spec:** `docs/superpowers/specs/2026-03-25-admin-detail-pages-design.md`

---

## File Map

**New files:**
- `actions/admin/require-admin.ts` — shared auth guard for all admin Server Actions
- `actions/admin/update-course.ts` — edit course fields, suspend/activate course
- `actions/admin/adjust-member-credits.ts` — insert ADMIN_ADJUSTMENT ledger row
- `actions/admin/suspend-member.ts` — toggle users.isSuspended
- `actions/admin/change-subscription.ts` — Stripe subscription change/cancel (Stripe only, no DB write)
- `app/(admin)/admin/courses/[id]/page.tsx` — course detail server component
- `app/(admin)/admin/courses/[id]/course-sidebar.tsx` — sidebar nav (client)
- `app/(admin)/admin/courses/[id]/course-settings-form.tsx` — editable course fields (client)
- `app/(admin)/admin/members/[id]/page.tsx` — member detail server component
- `app/(admin)/admin/members/[id]/member-sidebar.tsx` — sidebar nav (client)
- `app/(admin)/admin/members/[id]/credit-adjustment-form.tsx` — credit grant/debit form (client)

**Modified files:**
- `lib/db/schema.ts` — add `isSuspended` boolean to users table
- `lib/admin/queries.ts` — add `getCourseDetail`, `getCourseBookings`, `getCoursePayouts`, `getMemberDetail`, `getMemberLedger`, `getMemberBookings` queries
- `proxy.ts` — add isSuspended redirect for member routes
- `app/(admin)/admin/courses/page.tsx` — make course name cells links; remove `PayoutRateEditor` (moved to detail page)
- `app/(admin)/admin/members/page.tsx` — make member rows links

---

## Task 1: Add `isSuspended` to users schema + migrate

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add column to schema**

In `lib/db/schema.ts`, add `isSuspended` to the `users` table after `updatedAt`:

```ts
isSuspended: boolean('is_suspended').default(false).notNull(),
```

- [ ] **Step 2: Push migration**

```bash
cd /Users/dutchmike/Desktop/Gimmelab/Tech/website
npx drizzle-kit push
```

Expected: Drizzle confirms column added with no data loss (new boolean column with default).

- [ ] **Step 3: Verify TypeScript still happy**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add isSuspended column to users table"
```

---

## Task 2: Update `proxy.ts` to block suspended members

**Files:**
- Modify: `proxy.ts`

Suspended members should be redirected to `/login` when accessing member routes.

- [ ] **Step 1: Add isSuspended check**

`proxy.ts` currently only checks `role` for route guards. We need to also block suspended members on member routes. The proxy doesn't have DB access (it runs in edge-like context), so we use Supabase user metadata — but `isSuspended` lives in the DB, not metadata.

The correct approach: add a DB check only for member routes. However, since proxy.ts uses `createServerClient` (not the service role), we cannot query the `users` table directly here.

**Solution:** After a suspend action, also update the user's Supabase Auth metadata via the service role to include `isSuspended: true`. Then `proxy.ts` can read `user.user_metadata.isSuspended`.

Update the check in `proxy.ts` after the role guard block (around line 84):

```ts
// ── Suspended member check
if (isMemberRoute && user.user_metadata?.isSuspended === true) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('error', 'suspended')
  return NextResponse.redirect(loginUrl)
}
```

- [ ] **Step 2: Commit**

```bash
git add proxy.ts
git commit -m "feat: block suspended members in proxy"
```

---

## Task 3: Add admin queries to `lib/admin/queries.ts`

**Files:**
- Modify: `lib/admin/queries.ts`

Add 6 new exported query functions at the bottom of the file.

- [ ] **Step 1: Add imports needed**

At top of `lib/admin/queries.ts`, ensure these are imported (add any missing ones):

```ts
import {
  users, partners, courses, bookings, creditLedger,
  payoutTransfers, teeTimeSlots, ratings
} from '@/lib/db/schema'
import { eq, desc, sql, and, inArray, sum } from 'drizzle-orm'
```

- [ ] **Step 2: Add `getCourseDetail`**

```ts
export const getCourseDetail = cache(async function getCourseDetail(courseId: string) {
  const rows = await db
    .select({
      courseId: courses.id,
      courseName: courses.name,
      slug: courses.slug,
      description: courses.description,
      address: courses.address,
      holes: courses.holes,
      baseCreditCost: courses.baseCreditCost,
      payoutRate: courses.payoutRate,
      courseStatus: courses.status,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      approvedAt: partners.approvedAt,
      businessName: partners.businessName,
      partnerId: partners.id,
      partnerUserId: partners.userId,
      totalBookings: sql<number>`COUNT(DISTINCT ${bookings.id})`,
      totalEarningsCents: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} IN ('CONFIRMED','COMPLETED') THEN ${bookings.payoutAmountCents} ELSE 0 END), 0)`,
    })
    .from(courses)
    .innerJoin(partners, eq(courses.partnerId, partners.id))
    .leftJoin(bookings, eq(bookings.courseId, courses.id))
    .where(eq(courses.id, courseId))
    .groupBy(
      courses.id, courses.name, courses.slug, courses.description, courses.address,
      courses.holes, courses.baseCreditCost, courses.payoutRate, courses.status,
      courses.createdAt, courses.updatedAt, partners.approvedAt,
      partners.businessName, partners.id, partners.userId,
    )
    .limit(1)
  return rows[0] ?? null
})
```

- [ ] **Step 3: Add `getCourseBookings`**

```ts
export const getCourseBookings = cache(async function getCourseBookings(courseId: string) {
  return db
    .select({
      bookingId: bookings.id,
      status: bookings.status,
      creditCost: bookings.creditCost,
      payoutStatus: bookings.payoutStatus,
      payoutAmountCents: bookings.payoutAmountCents,
      checkedInAt: bookings.checkedInAt,
      cancelledAt: bookings.cancelledAt,
      createdAt: bookings.createdAt,
      memberName: users.fullName,
      memberEmail: users.email,
      date: teeTimeSlots.date,
      startTime: teeTimeSlots.startTime,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
    .where(eq(bookings.courseId, courseId))
    .orderBy(desc(teeTimeSlots.date))
})
```

- [ ] **Step 4: Add `getCoursePayouts`**

```ts
export const getCoursePayouts = cache(async function getCoursePayouts(partnerId: string, courseId: string) {
  const [pendingRows, transfers] = await Promise.all([
    db
      .select({ pendingCents: sql<number>`COALESCE(SUM(${bookings.payoutAmountCents}), 0)` })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .where(and(
        eq(teeTimeSlots.courseId, courseId),
        eq(bookings.payoutStatus, 'PENDING'),
        inArray(bookings.status, ['CONFIRMED', 'COMPLETED']),
      )),
    db
      .select({
        id: payoutTransfers.id,
        amountCents: payoutTransfers.amountCents,
        bookingCount: payoutTransfers.bookingCount,
        status: payoutTransfers.status,
        stripeTransferId: payoutTransfers.stripeTransferId,
        failedReason: payoutTransfers.failedReason,
        completedAt: payoutTransfers.completedAt,
        createdAt: payoutTransfers.createdAt,
      })
      .from(payoutTransfers)
      .where(eq(payoutTransfers.partnerId, partnerId))
      .orderBy(desc(payoutTransfers.createdAt))
      .limit(50),
  ])
  return { pendingCents: Number(pendingRows[0]?.pendingCents ?? 0), transfers }
})
```

- [ ] **Step 5: Add `getMemberDetail`**

```ts
export const getMemberDetail = cache(async function getMemberDetail(userId: string) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
      stripeSubscriptionId: users.stripeSubscriptionId,
      stripeCustomerId: users.stripeCustomerId,
      isSuspended: users.isSuspended,
      createdAt: users.createdAt,
      creditBalance: sql<number>`COALESCE(SUM(CASE WHEN (${creditLedger.expiresAt} IS NULL OR ${creditLedger.expiresAt} > NOW()) THEN ${creditLedger.amount} ELSE 0 END), 0)`,
      totalRounds: sql<number>`COUNT(DISTINCT CASE WHEN ${bookings.status} IN ('CONFIRMED','COMPLETED') THEN ${bookings.id} END)`,
    })
    .from(users)
    .leftJoin(creditLedger, eq(creditLedger.userId, users.id))
    .leftJoin(bookings, eq(bookings.userId, users.id))
    .where(eq(users.id, userId))
    .groupBy(
      users.id, users.email, users.fullName, users.avatarUrl,
      users.subscriptionTier, users.subscriptionStatus, users.stripeSubscriptionId,
      users.stripeCustomerId, users.isSuspended, users.createdAt,
    )
    .limit(1)
  return rows[0] ?? null
})
```

- [ ] **Step 6: Add `getMemberLedger`**

```ts
export const getMemberLedger = cache(async function getMemberLedger(userId: string) {
  return db
    .select({
      id: creditLedger.id,
      amount: creditLedger.amount,
      type: creditLedger.type,
      referenceId: creditLedger.referenceId,
      notes: creditLedger.notes,
      expiresAt: creditLedger.expiresAt,
      createdAt: creditLedger.createdAt,
    })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(desc(creditLedger.createdAt))
})
```

- [ ] **Step 7: Add `getMemberBookings`**

```ts
export const getMemberBookings = cache(async function getMemberBookings(userId: string) {
  return db
    .select({
      bookingId: bookings.id,
      status: bookings.status,
      creditCost: bookings.creditCost,
      refundAmount: bookings.refundAmount,
      qrCode: bookings.qrCode,
      createdAt: bookings.createdAt,
      cancelledAt: bookings.cancelledAt,
      courseName: courses.name,
      courseId: courses.id,
      date: teeTimeSlots.date,
      startTime: teeTimeSlots.startTime,
      ratingScore: ratings.score,
    })
    .from(bookings)
    .innerJoin(courses, eq(bookings.courseId, courses.id))
    .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
    .leftJoin(ratings, eq(ratings.bookingId, bookings.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt))
})
```

- [ ] **Step 8: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add lib/admin/queries.ts
git commit -m "feat: add admin detail queries for courses and members"
```

---

## Task 4: Create admin Server Actions

**Files:**
- Create: `actions/admin/require-admin.ts`
- Create: `actions/admin/update-course.ts`
- Create: `actions/admin/adjust-member-credits.ts`
- Create: `actions/admin/suspend-member.ts`
- Create: `actions/admin/change-subscription.ts`

- [ ] **Step 1: Create `require-admin.ts`**

```ts
// actions/admin/require-admin.ts
import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return user
}
```

- [ ] **Step 2: Create `update-course.ts`**

```ts
// actions/admin/update-course.ts
'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from './require-admin'

export async function updateCourseFields(
  courseId: string,
  fields: {
    name?: string
    description?: string
    address?: string
    holes?: number
    baseCreditCost?: number
    payoutRate?: string
  }
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await db.update(courses).set({ ...fields, updatedAt: new Date() }).where(eq(courses.id, courseId))
    revalidatePath(`/admin/courses/${courseId}`)
    revalidatePath('/admin/courses')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Update failed' }
  }
}

export async function setCourseStatus(
  courseId: string,
  status: 'active' | 'suspended'
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await db.update(courses).set({ status, updatedAt: new Date() }).where(eq(courses.id, courseId))
    revalidatePath(`/admin/courses/${courseId}`)
    revalidatePath('/admin/courses')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Status update failed' }
  }
}
```

- [ ] **Step 3: Create `adjust-member-credits.ts`**

```ts
// actions/admin/adjust-member-credits.ts
'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { creditLedger } from '@/lib/db/schema'
import { requireAdmin } from './require-admin'

export async function adjustMemberCredits(
  userId: string,
  amount: number,
  notes: string
): Promise<{ error?: string }> {
  if (!notes.trim()) return { error: 'Notes are required for admin adjustments' }
  if (amount === 0) return { error: 'Amount cannot be zero' }
  try {
    await requireAdmin()
    await db.insert(creditLedger).values({
      userId,
      amount,
      type: 'ADMIN_ADJUSTMENT',
      notes,
    })
    revalidatePath(`/admin/members/${userId}`)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Adjustment failed' }
  }
}
```

- [ ] **Step 4: Create `suspend-member.ts`**

```ts
// actions/admin/suspend-member.ts
'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from './require-admin'
import { createClient } from '@/lib/supabase/server'

export async function setMemberSuspended(
  userId: string,
  isSuspended: boolean
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    // Update DB
    await db.update(users).set({ isSuspended, updatedAt: new Date() }).where(eq(users.id, userId))
    // Sync to Supabase Auth metadata so proxy.ts can read it without a DB query
    const supabase = await createClient()
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { isSuspended },
    })
    revalidatePath(`/admin/members/${userId}`)
    revalidatePath('/admin/members')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Suspend failed' }
  }
}
```

> **Important:** `supabase.auth.admin.updateUserById` requires the **service role key**, not the anon key. Before using `createClient` from `@/lib/supabase/server` here, verify it initialises with `SUPABASE_SERVICE_ROLE_KEY`. If it uses the anon key (check the file), create a separate admin client:
> ```ts
> import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
> const supabaseAdmin = createSupabaseAdmin(
>   process.env.NEXT_PUBLIC_SUPABASE_URL!,
>   process.env.SUPABASE_SERVICE_ROLE_KEY!
> )
> await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: { isSuspended } })
> ```
> Also verify `SUPABASE_SERVICE_ROLE_KEY` is set in both `.env.local` and Vercel project settings.

- [ ] **Step 5: Create `change-subscription.ts`**

```ts
// actions/admin/change-subscription.ts
'use server'
import Stripe from 'stripe'
import { requireAdmin } from './require-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const TIER_PRICE: Record<string, string> = {
  casual: process.env.STRIPE_CASUAL_PRICE_ID!,
  core:   process.env.STRIPE_CORE_PRICE_ID!,
  heavy:  process.env.STRIPE_HEAVY_PRICE_ID!,
}

export async function changeSubscriptionTier(
  stripeSubscriptionId: string,
  newTier: 'casual' | 'core' | 'heavy'
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const priceId = TIER_PRICE[newTier]
    if (!priceId) return { error: 'Invalid tier' }
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    const itemId = sub.items.data[0]?.id
    if (!itemId) return { error: 'Subscription item not found' }
    await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'always_invoice',
    })
    // DB sync happens via existing webhook (customer.subscription.updated → invoice.paid)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Stripe update failed' }
  }
}

export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await stripe.subscriptions.cancel(stripeSubscriptionId)
    // DB sync via webhook (customer.subscription.deleted)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Cancel failed' }
  }
}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add actions/admin/
git commit -m "feat: admin server actions (update course, credits, suspend, subscription)"
```

---

## Task 5: Update courses list — make rows clickable, remove inline payout editor

**Files:**
- Modify: `app/(admin)/admin/courses/page.tsx`

- [ ] **Step 1: Wrap course name in a link**

In the "All courses" table section, replace the course name `<div>` block for each row with a link. Find this block (around line 108):

```tsx
<div>
  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{c.courseName}</div>
  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{c.address}</div>
</div>
```

Replace with:

```tsx
<a href={`/admin/courses/${c.courseId}`} style={{ textDecoration: 'none' }}>
  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{c.courseName}</div>
  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{c.address}</div>
</a>
```

- [ ] **Step 2: Remove `PayoutRateEditor` from the row**

The `PayoutRateEditor` is being moved to the course detail Settings tab. Remove the import and the `<PayoutRateEditor ... />` usage from the "All courses" table. Replace it with a plain text display:

```tsx
<span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>
  {c.payoutRate ? `${Math.round(Number(c.payoutRate) * 100)}%` : '—'}
</span>
```

- [ ] **Step 3: Also link course names in the pending table**

Same change for the pending table (around line 69). Wrap the pending course name `<div>` in an `<a href={/admin/courses/${c.courseId}}>` too.

- [ ] **Step 4: Verify page renders, then commit**

```bash
git add app/\(admin\)/admin/courses/page.tsx
git commit -m "feat: make course rows clickable in admin courses list"
```

---

## Task 6: Build course detail page

**Files:**
- Create: `app/(admin)/admin/courses/[id]/page.tsx`
- Create: `app/(admin)/admin/courses/[id]/course-sidebar.tsx`
- Create: `app/(admin)/admin/courses/[id]/course-settings-form.tsx`

### Step 1: Create the sidebar component

- [ ] **Create `course-sidebar.tsx`**

This client component receives the current section from the URL and renders the nav. Since we use `searchParams`, the sidebar only needs to emit links — no client state needed.

```tsx
// app/(admin)/admin/courses/[id]/course-sidebar.tsx
'use client'

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'payouts',  label: 'Payouts' },
  { key: 'settings', label: 'Settings' },
]

export function CourseSidebar({
  courseId,
  currentSection,
  courseStatus,
}: {
  courseId: string
  currentSection: string
  courseStatus: string
}) {
  const isSuspended = courseStatus === 'suspended'

  return (
    <div style={{
      width: 160, flexShrink: 0, background: '#fafafa',
      borderRight: '1px solid #e8e8e8', padding: '24px 0',
      display: 'flex', flexDirection: 'column', minHeight: '100%',
    }}>
      {SECTIONS.map(s => (
        <a
          key={s.key}
          href={`/admin/courses/${courseId}?section=${s.key}`}
          style={{
            display: 'block', padding: '8px 20px',
            fontSize: 13, fontWeight: currentSection === s.key ? 700 : 400,
            color: currentSection === s.key ? '#111' : 'rgba(0,0,0,0.5)',
            background: currentSection === s.key ? '#f0f0f0' : 'transparent',
            textDecoration: 'none',
            borderLeft: currentSection === s.key ? '3px solid #111' : '3px solid transparent',
          }}
        >
          {s.label}
        </a>
      ))}
      <div style={{ flex: 1 }} />
      <form action={`/admin/courses/${courseId}?section=overview`} style={{ padding: '0 12px 16px' }}>
        <a
          href={`/admin/courses/${courseId}?action=${isSuspended ? 'activate' : 'suspend'}`}
          style={{
            display: 'block', textAlign: 'center', padding: '7px 12px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: isSuspended ? '#16a34a' : '#dc2626',
            background: isSuspended ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
            border: `1px solid ${isSuspended ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
            borderRadius: 2, textDecoration: 'none',
          }}
        >
          {isSuspended ? 'Activate' : 'Suspend'}
        </a>
      </form>
    </div>
  )
}
```

### Step 2: Create the settings form

- [ ] **Create `course-settings-form.tsx`**

```tsx
// app/(admin)/admin/courses/[id]/course-settings-form.tsx
'use client'
import { useState, useTransition } from 'react'
import { updateCourseFields } from '@/actions/admin/update-course'

export function CourseSettingsForm({ course }: {
  course: {
    courseId: string
    courseName: string
    description: string | null
    address: string
    holes: number | null
    baseCreditCost: number
    payoutRate: string | null
  }
}) {
  const [name, setName] = useState(course.courseName)
  const [description, setDescription] = useState(course.description ?? '')
  const [address, setAddress] = useState(course.address)
  const [holes, setHoles] = useState(String(course.holes ?? 18))
  const [baseCreditCost, setBaseCreditCost] = useState(String(course.baseCreditCost))
  const [payoutRate, setPayoutRate] = useState(
    course.payoutRate ? String(Math.round(Number(course.payoutRate) * 100)) : '85'
  )
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #e8e8e8',
    borderRadius: 2, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', display: 'block', marginBottom: 4,
  }

  function handleSave() {
    setError('')
    setSaved(false)
    startTransition(async () => {
      const result = await updateCourseFields(course.courseId, {
        name,
        description,
        address,
        holes: parseInt(holes),
        baseCreditCost: parseInt(baseCreditCost),
        payoutRate: (parseInt(payoutRate) / 100).toFixed(3),
      })
      if (result.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      <div><label style={labelStyle}>Course Name</label>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></div>
      <div><label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }}
          value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div><label style={labelStyle}>Address</label>
        <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>Holes</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={holes} onChange={e => setHoles(e.target.value)}>
            {['9', '18', '27', '36'].map(h => <option key={h} value={h}>{h}</option>)}
          </select></div>
        <div><label style={labelStyle}>Base Credits</label>
          <input style={inputStyle} type="number" min={1} value={baseCreditCost}
            onChange={e => setBaseCreditCost(e.target.value)} /></div>
        <div><label style={labelStyle}>Payout %</label>
          <input style={inputStyle} type="number" min={1} max={100} value={payoutRate}
            onChange={e => setPayoutRate(e.target.value)} /></div>
      </div>
      {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
      {saved && <p style={{ fontSize: 12, color: '#16a34a' }}>Saved.</p>}
      <button
        onClick={handleSave}
        disabled={pending}
        style={{
          alignSelf: 'flex-start', padding: '8px 20px', background: '#111',
          color: '#fff', border: 'none', borderRadius: 2, fontSize: 13,
          fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
```

### Step 3: Create the course detail page

- [ ] **Create `app/(admin)/admin/courses/[id]/page.tsx`**

```tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCourseDetail, getCourseBookings, getCoursePayouts } from '@/lib/admin/queries'
import { setCourseStatus } from '@/actions/admin/update-course'
import { CourseSidebar } from './course-sidebar'
import { CourseSettingsForm } from './course-settings-form'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// Helper to format cents as dollars
function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

const BOOKING_STATUS_COLOR: Record<string, string> = {
  CONFIRMED:  '#16a34a',
  COMPLETED:  '#0ea5e9',
  CANCELLED:  'rgba(0,0,0,0.3)',
  NO_SHOW:    '#dc2626',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const course = await getCourseDetail(id)
  return { title: course ? `${course.courseName} — Admin` : 'Course — Admin' }
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ section?: string; action?: string }>
}) {
  const { id } = await params
  const { section = 'overview', action } = await searchParams

  const course = await getCourseDetail(id)
  if (!course) notFound()

  // Handle suspend/activate action from sidebar link
  // IMPORTANT: redirect immediately after mutation to clear the `action` param from the URL.
  // Without this, reloading the page re-fires the mutation on every refresh.
  if (action === 'suspend' || action === 'activate') {
    await setCourseStatus(id, action === 'suspend' ? 'suspended' : 'active')
    redirect(`/admin/courses/${id}?section=overview`)
  }

  const [bookings, payouts] = await Promise.all([
    section === 'bookings' || section === 'overview' ? getCourseBookings(id) : Promise.resolve([]),
    section === 'payouts' ? getCoursePayouts(course.partnerId, id) : Promise.resolve(null),
  ])

  const statBox = (label: string, value: string, color = '#111') => (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', padding: '16px 20px', flex: 1 }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Back link */}
      <Link href="/admin/courses" style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', textDecoration: 'none', display: 'block', marginBottom: 16 }}>
        ← Courses
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: 24 }}>
        {course.courseName}
      </h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
        {statBox('Total Bookings', String(course.totalBookings))}
        {statBox('Partner Earnings', fmtCents(Number(course.totalEarningsCents)), '#16a34a')}
        {statBox('Payout Rate', course.payoutRate ? `${Math.round(Number(course.payoutRate) * 100)}%` : '—')}
        {statBox('Status', course.courseStatus.toUpperCase(), course.courseStatus === 'active' ? '#16a34a' : course.courseStatus === 'pending' ? '#d97706' : '#dc2626')}
      </div>

      {/* Sidebar + content */}
      <div style={{ display: 'flex', background: '#fff', border: '1px solid #e8e8e8', minHeight: 500 }}>
        <CourseSidebar courseId={id} currentSection={section} courseStatus={course.courseStatus} />

        <div style={{ flex: 1, padding: '28px 32px' }}>

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <div>
              {/* Course info */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 10 }}>Course Info</p>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 1.8 }}>
                  <div>{course.address}</div>
                  <div>Partner: <strong style={{ color: '#111' }}>{course.businessName}</strong></div>
                  <div>{course.holes} holes</div>
                </div>
              </div>

              {/* Activity log */}
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>
                Recent Activity
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {bookings.slice(0, 20).map(b => (
                  <div key={b.bookingId} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', minWidth: 70 }}>{fmtDate(b.date)}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: BOOKING_STATUS_COLOR[b.status] ?? '#111', minWidth: 80,
                    }}>{b.status}</span>
                    <span style={{ fontSize: 13, color: '#111', flex: 1 }}>
                      {b.memberName ?? b.memberEmail} · {fmtTime(b.startTime)} · {b.creditCost}cr
                    </span>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)' }}>No bookings yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {section === 'bookings' && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>All Bookings</p>
              <div style={{ border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 100px 100px 90px', padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                  {['Date', 'Member', 'Time', 'Credits', 'Status', 'Payout'].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>{h}</span>
                  ))}
                </div>
                {bookings.map((b, i) => (
                  <div key={b.bookingId} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 100px 100px 90px', padding: '11px 16px', alignItems: 'center', borderBottom: i < bookings.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtDate(b.date)}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{b.memberName ?? '—'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{b.memberEmail}</div>
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtTime(b.startTime)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{b.creditCost}cr</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: BOOKING_STATUS_COLOR[b.status] ?? '#111' }}>{b.status}</span>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{b.payoutStatus}</span>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>No bookings.</div>
                )}
              </div>
            </div>
          )}

          {/* ── PAYOUTS ── */}
          {section === 'payouts' && payouts && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 8 }}>Partner Payouts</p>
              <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 24 }}>Showing all transfers for partner: {course.businessName}</p>
              <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 2, padding: '16px 20px', marginBottom: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 4 }}>Pending (this course)</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', letterSpacing: '-0.03em' }}>{fmtCents(payouts.pendingCents)}</p>
              </div>
              <div style={{ border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 120px 80px 120px 1fr', padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                  {['Date', 'Amount', 'Bookings', 'Status', 'Stripe ID'].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>{h}</span>
                  ))}
                </div>
                {payouts.transfers.map((t, i) => (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '130px 120px 80px 120px 1fr', padding: '11px 16px', alignItems: 'center', borderBottom: i < payouts.transfers.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtDate(t.createdAt)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{fmtCents(t.amountCents)}</span>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{t.bookingCount}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: t.status === 'COMPLETED' ? '#16a34a' : t.status === 'FAILED' ? '#dc2626' : '#d97706' }}>{t.status}</span>
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' }}>{t.stripeTransferId ?? '—'}</span>
                  </div>
                ))}
                {payouts.transfers.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>No transfers yet.</div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {section === 'settings' && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>Course Settings</p>
              <CourseSettingsForm course={course} />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Smoke test in browser**

Navigate to `/admin/courses` → click a course name → verify detail page loads with Overview section, stats, and activity log.

- [ ] **Step 6: Commit**

```bash
git add app/\(admin\)/admin/courses/
git commit -m "feat: course detail page with sidebar, bookings, payouts, settings"
```

---

## Task 7: Update members list — make rows clickable

**Files:**
- Modify: `app/(admin)/admin/members/page.tsx`

- [ ] **Step 1: Wrap each member row in a link**

Find the `<div key={m.id} ...>` row element (around line 80). Wrap the entire row's content in a link, or just the name cell. Since the entire row is a grid div, the cleanest approach is to make the name+email cell a link:

Replace the name block:

```tsx
<div>
  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>
    {m.fullName ?? '—'}
  </div>
  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{m.email}</div>
</div>
```

With:

```tsx
<a href={`/admin/members/${m.id}`} style={{ textDecoration: 'none' }}>
  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>
    {m.fullName ?? '—'}
  </div>
  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{m.email}</div>
</a>
```

- [ ] **Step 2: Commit**

```bash
git add app/\(admin\)/admin/members/page.tsx
git commit -m "feat: make member rows clickable in admin members list"
```

---

## Task 8: Build member detail page

**Files:**
- Create: `app/(admin)/admin/members/[id]/page.tsx`
- Create: `app/(admin)/admin/members/[id]/member-sidebar.tsx`
- Create: `app/(admin)/admin/members/[id]/credit-adjustment-form.tsx`

### Step 1: Create the member sidebar

- [ ] **Create `member-sidebar.tsx`**

```tsx
// app/(admin)/admin/members/[id]/member-sidebar.tsx
'use client'

const SECTIONS = [
  { key: 'overview',     label: 'Overview' },
  { key: 'credits',      label: 'Credits' },
  { key: 'bookings',     label: 'Bookings' },
  { key: 'subscription', label: 'Subscription' },
]

export function MemberSidebar({
  memberId,
  currentSection,
  isSuspended,
}: {
  memberId: string
  currentSection: string
  isSuspended: boolean
}) {
  return (
    <div style={{
      width: 160, flexShrink: 0, background: '#fafafa',
      borderRight: '1px solid #e8e8e8', padding: '24px 0',
      display: 'flex', flexDirection: 'column', minHeight: '100%',
    }}>
      {SECTIONS.map(s => (
        <a
          key={s.key}
          href={`/admin/members/${memberId}?section=${s.key}`}
          style={{
            display: 'block', padding: '8px 20px',
            fontSize: 13, fontWeight: currentSection === s.key ? 700 : 400,
            color: currentSection === s.key ? '#111' : 'rgba(0,0,0,0.5)',
            background: currentSection === s.key ? '#f0f0f0' : 'transparent',
            textDecoration: 'none',
            borderLeft: currentSection === s.key ? '3px solid #111' : '3px solid transparent',
          }}
        >
          {s.label}
        </a>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '0 12px 16px' }}>
        <a
          href={`/admin/members/${memberId}?action=${isSuspended ? 'activate' : 'suspend'}`}
          style={{
            display: 'block', textAlign: 'center', padding: '7px 12px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: isSuspended ? '#16a34a' : '#dc2626',
            background: isSuspended ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
            border: `1px solid ${isSuspended ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
            borderRadius: 2, textDecoration: 'none',
          }}
        >
          {isSuspended ? 'Activate' : 'Suspend'}
        </a>
      </div>
    </div>
  )
}
```

### Step 2: Create the credit adjustment form

- [ ] **Create `credit-adjustment-form.tsx`**

```tsx
// app/(admin)/admin/members/[id]/credit-adjustment-form.tsx
'use client'
import { useState, useTransition } from 'react'
import { adjustMemberCredits } from '@/actions/admin/adjust-member-credits'

export function CreditAdjustmentForm({ userId }: { userId: string }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, startTransition] = useTransition()

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #e8e8e8',
    borderRadius: 2, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', display: 'block', marginBottom: 4,
  }

  function handleSubmit() {
    setError('')
    setSuccess('')
    const n = parseInt(amount)
    if (isNaN(n) || n === 0) { setError('Enter a non-zero amount'); return }
    if (!notes.trim()) { setError('Notes are required'); return }
    startTransition(async () => {
      const result = await adjustMemberCredits(userId, n, notes)
      if (result.error) { setError(result.error) }
      else { setSuccess(`${n > 0 ? '+' : ''}${n} credits applied.`); setAmount(''); setNotes('') }
    })
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', padding: '20px 24px', maxWidth: 440, borderRadius: 2 }}>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 16 }}>
        Manual Adjustment
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>Amount (positive to add, negative to deduct)</label>
          <input style={inputStyle} type="number" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="e.g. 20 or -10" />
        </div>
        <div>
          <label style={labelStyle}>Notes (required)</label>
          <input style={inputStyle} value={notes}
            onChange={e => setNotes(e.target.value)} placeholder="Reason for adjustment" />
        </div>
        {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
        {success && <p style={{ fontSize: 12, color: '#16a34a' }}>{success}</p>}
        <button
          onClick={handleSubmit}
          disabled={pending}
          style={{
            alignSelf: 'flex-start', padding: '8px 20px', background: '#111',
            color: '#fff', border: 'none', borderRadius: 2, fontSize: 13,
            fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? 'Saving…' : 'Apply'}
        </button>
      </div>
    </div>
  )
}
```

### Step 3: Create the member detail page

- [ ] **Create `app/(admin)/admin/members/[id]/page.tsx`**

```tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getMemberDetail, getMemberLedger, getMemberBookings } from '@/lib/admin/queries'
import { setMemberSuspended } from '@/actions/admin/suspend-member'
import { cancelSubscription, changeSubscriptionTier } from '@/actions/admin/change-subscription'
import { MemberSidebar } from './member-sidebar'
import { CreditAdjustmentForm } from './credit-adjustment-form'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

const LEDGER_COLOR: Record<string, string> = {
  SUBSCRIPTION_GRANT: '#16a34a',
  ROLLOVER_GRANT:     '#16a34a',
  BONUS_GRANT:        '#16a34a',
  TOP_UP_PURCHASE:    '#16a34a',
  BOOKING_DEBIT:      '#111',
  BOOKING_REFUND:     '#0ea5e9',
  ADMIN_ADJUSTMENT:   '#d97706',
  CREDIT_EXPIRY:      'rgba(0,0,0,0.3)',
}

const BOOKING_STATUS_COLOR: Record<string, string> = {
  CONFIRMED:  '#16a34a',
  COMPLETED:  '#0ea5e9',
  CANCELLED:  'rgba(0,0,0,0.3)',
  NO_SHOW:    '#dc2626',
}

const TIER_COLOR: Record<string, string> = {
  casual: '#0ea5e9',
  core:   '#a855f7',
  heavy:  '#16a34a',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const member = await getMemberDetail(id)
  return { title: member ? `${member.fullName ?? member.email} — Admin` : 'Member — Admin' }
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ section?: string; action?: string }>
}) {
  const { id } = await params
  const { section = 'overview', action } = await searchParams

  const member = await getMemberDetail(id)
  if (!member) notFound()

  // Handle suspend/activate — redirect immediately to clear the `action` param,
  // preventing the mutation from re-firing on page reload.
  if (action === 'suspend' || action === 'activate') {
    await setMemberSuspended(id, action === 'suspend')
    redirect(`/admin/members/${id}?section=overview`)
  }

  const [ledger, bookings] = await Promise.all([
    section === 'credits' || section === 'overview' ? getMemberLedger(id) : Promise.resolve([]),
    section === 'bookings' ? getMemberBookings(id) : Promise.resolve([]),
  ])

  const statBox = (label: string, value: string, color = '#111') => (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', padding: '16px 20px', flex: 1 }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )

  const tierColor = member.subscriptionTier ? TIER_COLOR[member.subscriptionTier] ?? '#111' : 'rgba(0,0,0,0.3)'

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <Link href="/admin/members" style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', textDecoration: 'none', display: 'block', marginBottom: 16 }}>
        ← Members
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: 4 }}>
        {member.fullName ?? '—'}
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', marginBottom: 24 }}>{member.email}</p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
        {statBox('Credits', String(member.creditBalance), '#16a34a')}
        {statBox('Plan', member.subscriptionTier?.toUpperCase() ?? 'None', tierColor)}
        {statBox('Total Rounds', String(member.totalRounds))}
        {statBox('Status', member.isSuspended ? 'SUSPENDED' : (member.subscriptionStatus?.toUpperCase() ?? '—'), member.isSuspended ? '#dc2626' : '#16a34a')}
      </div>

      {/* Sidebar + content */}
      <div style={{ display: 'flex', background: '#fff', border: '1px solid #e8e8e8', minHeight: 500 }}>
        <MemberSidebar memberId={id} currentSection={section} isSuspended={member.isSuspended ?? false} />

        <div style={{ flex: 1, padding: '28px 32px' }}>

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <div>
              <div style={{ marginBottom: 28, fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 1.8 }}>
                <div>Joined: {fmtDate(member.createdAt)}</div>
                <div>Stripe Customer: <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{member.stripeCustomerId ?? '—'}</span></div>
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>
                Recent Activity
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {ledger.slice(0, 20).map(e => (
                  <div key={e.id} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', minWidth: 70 }}>{fmtDate(e.createdAt)}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: LEDGER_COLOR[e.type] ?? '#111', minWidth: 140 }}>{e.type.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: e.amount > 0 ? '#16a34a' : '#dc2626', minWidth: 50 }}>
                      {e.amount > 0 ? '+' : ''}{e.amount}cr
                    </span>
                    {e.notes && <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>{e.notes}</span>}
                  </div>
                ))}
                {ledger.length === 0 && <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)' }}>No activity.</p>}
              </div>
            </div>
          )}

          {/* ── CREDITS ── */}
          {section === 'credits' && (
            <div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>Ledger</p>
                  <div style={{ border: '1px solid #e8e8e8' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 60px 100px', padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                      {['Date', 'Type', 'Amount', 'Expires'].map(h => (
                        <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>{h}</span>
                      ))}
                    </div>
                    {ledger.map((e, i) => (
                      <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 60px 100px', padding: '9px 16px', alignItems: 'center', borderBottom: i < ledger.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{fmtDate(e.createdAt)}</span>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: LEDGER_COLOR[e.type] ?? '#111' }}>{e.type.replace(/_/g, ' ')}</span>
                          {e.notes && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{e.notes}</div>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: e.amount > 0 ? '#16a34a' : '#dc2626' }}>
                          {e.amount > 0 ? '+' : ''}{e.amount}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>
                          {e.expiresAt ? fmtDate(e.expiresAt) : '—'}
                        </span>
                      </div>
                    ))}
                    {ledger.length === 0 && (
                      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>No entries.</div>
                    )}
                  </div>
                </div>
                <CreditAdjustmentForm userId={id} />
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {section === 'bookings' && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>Bookings</p>
              <div style={{ border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 80px 100px 60px', padding: '8px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
                  {['Date', 'Course', 'Time', 'Credits', 'Status', 'Rating'].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>{h}</span>
                  ))}
                </div>
                {bookings.map((b, i) => (
                  <div key={b.bookingId} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 80px 100px 60px', padding: '11px 16px', alignItems: 'center', borderBottom: i < bookings.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtDate(b.date)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{b.courseName}</span>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{fmtTime(b.startTime)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{b.creditCost}cr</span>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: BOOKING_STATUS_COLOR[b.status] ?? '#111' }}>{b.status}</span>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>{b.ratingScore ? `${b.ratingScore}/5` : '—'}</span>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>No bookings.</div>
                )}
              </div>
            </div>
          )}

          {/* ── SUBSCRIPTION ── */}
          {section === 'subscription' && (
            <div style={{ maxWidth: 480 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>Subscription</p>
              <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 2, padding: '20px 24px', marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: 1.9 }}>
                  <div>Plan: <strong style={{ color: tierColor, textTransform: 'capitalize' }}>{member.subscriptionTier ?? 'None'}</strong></div>
                  <div>Status: <strong>{member.subscriptionStatus ?? '—'}</strong></div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>{member.stripeSubscriptionId ?? 'No subscription'}</div>
                </div>
              </div>

              {member.stripeSubscriptionId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <form action={async (fd: FormData) => {
                    'use server'
                    const tier = fd.get('tier') as 'casual' | 'core' | 'heavy'
                    await changeSubscriptionTier(member.stripeSubscriptionId!, tier)
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', display: 'block', marginBottom: 4 }}>
                          Change Tier
                        </label>
                        <select name="tier" defaultValue={member.subscriptionTier ?? ''} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e8e8e8', borderRadius: 2, fontSize: 13, fontFamily: 'inherit' }}>
                          <option value="casual">Casual — $99/mo</option>
                          <option value="core">Core — $149/mo</option>
                          <option value="heavy">Heavy — $199/mo</option>
                        </select>
                      </div>
                      <button type="submit" style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Update
                      </button>
                    </div>
                  </form>

                  <form action={async () => {
                    'use server'
                    await cancelSubscription(member.stripeSubscriptionId!)
                  }}>
                    <button type="submit" style={{ padding: '8px 16px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 2, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Cancel Subscription
                    </button>
                  </form>
                </div>
              )}

              {!member.stripeSubscriptionId && (
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)' }}>No active Stripe subscription.</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Smoke test in browser**

- Navigate to `/admin/members` → click a member name → verify detail page loads
- Check Overview (activity log), Credits (ledger + adjustment form), Bookings, Subscription tabs all render
- Apply a small credit adjustment (+1) and verify it appears in the ledger

- [ ] **Step 6: Commit**

```bash
git add app/\(admin\)/admin/members/
git commit -m "feat: member detail page with sidebar, credits, bookings, subscription"
```

---

## Task 9: Deploy to Vercel

- [ ] **Step 1: Final TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Deploy**

```bash
vercel --prod
```

Expected: `● Ready` — `Aliased: https://gimilabdev-smoky.vercel.app`

- [ ] **Step 3: Smoke test production**

- `/admin/courses` → click Walnut Lane → verify course detail page loads
- `/admin/members` → click a member → verify member detail page loads
- Verify sidebar navigation between sections works
- Test credit adjustment in production (apply +0 to a test user and check for validation error)
