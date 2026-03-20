# Partner Portal — Shell + Course Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the partner portal shell (layout, nav) and course profile CRUD so a partner can log in, create their course, and see a dashboard — unblocking sub-project 2 (Inventory).

**Architecture:** Server Component layout fetches partner + course from Drizzle, passes to a `'use client'` `<PartnerNav>`. Course create/edit share a single `<CourseForm>` client component that calls Server Actions. Dashboard auto-redirects to course setup if no course exists.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Supabase Auth, React Hook Form + Zod, shadcn/ui (`Input`, `Textarea`, `Button`, `Select`, `Label`, `Checkbox`), Vitest

**Spec:** `docs/superpowers/specs/2026-03-20-partner-portal-shell-course-setup-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `lib/partner/queries.ts` | `getPartnerByUserId`, `getPartnerCourse` — pure DB reads |
| Create | `actions/partner.ts` | `createCourse`, `updateCourse` Server Actions |
| Create | `actions/partner.test.ts` | Unit tests for both actions |
| Create | `components/partner-nav.tsx` | `'use client'` sticky double-header nav (sky blue accent) |
| Create | `app/(partner)/layout.tsx` | Async Server Component — fetches partner + course, renders nav |
| Create | `components/course-form.tsx` | `'use client'` shared form for create + edit modes |
| Create | `app/(partner)/course/new/page.tsx` | Create course page |
| Create | `app/(partner)/course/page.tsx` | Edit course page |
| Create | `app/(partner)/dashboard/page.tsx` | Dashboard — redirect if no course, stats shell if course exists |

---

## Task 1: DB Query Helpers

**Files:**
- Create: `lib/partner/queries.ts`

No tests — these are thin DB wrappers with no business logic.

- [ ] **Step 1: Create the query helpers**

```ts
import { db } from '@/lib/db'
import { partners, courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getPartnerByUserId(userId: string) {
  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.userId, userId))
    .limit(1)
  return rows[0] ?? null
}

export async function getPartnerCourse(partnerId: string) {
  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.partnerId, partnerId))
    .limit(1)
  return rows[0] ?? null
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd "/Users/dutchmike/Desktop/Claude Agents/OneGolf/V1/onegolf" && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/partner/queries.ts
git commit -m "feat: add partner DB query helpers"
```

---

## Task 2: Server Actions + Tests

**Files:**
- Create: `actions/partner.ts`
- Create: `actions/partner.test.ts`

Follow the exact same test pattern as `actions/booking.test.ts` — `vi.mock` before imports, mock Supabase + Drizzle, test all error paths.

> **Before writing tests:** Check `lib/validations/index.ts` to confirm `createCourseSchema` field constraints. The tests below assume: `name` min 2 chars, `baseCreditCost` min 10. Adjust the test values if the schema differs.

- [ ] **Step 1: Write the failing tests**

```ts
// actions/partner.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}))
vi.mock('@/lib/partner/queries', () => ({
  getPartnerByUserId: vi.fn(),
  getPartnerCourse: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { createCourse, updateCourse } from './partner'

const mockUser = { id: 'user-123' }
const mockPartner = { id: 'partner-abc', userId: 'user-123', businessName: 'Pine Valley GC' }
const mockCourse = { id: 'course-xyz', partnerId: 'partner-abc', name: 'Pine Valley', status: 'pending' }

const mockCreateClient = vi.mocked(createClient)
const mockGetPartnerByUserId = vi.mocked(getPartnerByUserId)
const mockGetPartnerCourse = vi.mocked(getPartnerCourse)

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
  return fd
}

const validFields = {
  name: 'Pine Valley GC',
  description: 'A classic course',
  address: '1 Pine Valley Rd, NJ',
  holes: '18',
  baseCreditCost: '50',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
  } as any)
  mockGetPartnerByUserId.mockResolvedValue(mockPartner as any)
  mockGetPartnerCourse.mockResolvedValue(null) // no course by default
})

// ─── createCourse ──────────────────────────────────────────────────────────

describe('createCourse', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await createCourse(makeFormData(validFields))
    expect(result).toEqual({ error: 'Not authenticated.' })
  })

  it('returns error when partner record not found', async () => {
    mockGetPartnerByUserId.mockResolvedValue(null)
    const result = await createCourse(makeFormData(validFields))
    expect(result).toEqual({ error: 'Partner account not found.' })
  })

  it('returns error when course already exists', async () => {
    mockGetPartnerCourse.mockResolvedValue(mockCourse as any)
    const result = await createCourse(makeFormData(validFields))
    expect(result).toEqual({ error: 'Course already exists.' })
  })

  it('returns error on validation failure', async () => {
    const result = await createCourse(makeFormData({ ...validFields, name: 'X' })) // too short
    expect(result).toHaveProperty('error')
    expect(typeof (result as any).error).toBe('string')
  })

  it('redirects to /partner/dashboard on success', async () => {
    const insertMock = { values: vi.fn().mockResolvedValue([]) }
    vi.mocked(db.insert).mockReturnValue(insertMock as any)
    await expect(createCourse(makeFormData(validFields))).rejects.toThrow('REDIRECT:/partner/dashboard')
    expect(revalidatePath).toHaveBeenCalledWith('/partner/dashboard')
  })
})

// ─── updateCourse ──────────────────────────────────────────────────────────

describe('updateCourse', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await updateCourse('course-xyz', makeFormData(validFields))
    expect(result).toEqual({ error: 'Not authenticated.' })
  })

  it('returns error when partner record not found', async () => {
    mockGetPartnerByUserId.mockResolvedValue(null)
    const result = await updateCourse('course-xyz', makeFormData(validFields))
    expect(result).toEqual({ error: 'Partner account not found.' })
  })

  it('returns error when course not found or belongs to another partner', async () => {
    const selectMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue([]), // no course found
    }
    vi.mocked(db.select).mockReturnValue(selectMock as any)
    const result = await updateCourse('course-xyz', makeFormData(validFields))
    expect(result).toEqual({ error: 'Not authorized.' })
  })

  it('returns error on validation failure', async () => {
    const selectMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue([mockCourse]),
    }
    vi.mocked(db.select).mockReturnValue(selectMock as any)
    const result = await updateCourse('course-xyz', makeFormData({ ...validFields, baseCreditCost: '5' })) // below min
    expect(result).toHaveProperty('error')
  })

  it('revalidates and returns {} on success', async () => {
    const selectMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue([mockCourse]),
    }
    vi.mocked(db.select).mockReturnValue(selectMock as any)
    const updateMock = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(db.update).mockReturnValue(updateMock as any)
    const result = await updateCourse('course-xyz', makeFormData(validFields))
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/partner/course')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run actions/partner.test.ts 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module './partner'`

- [ ] **Step 3: Implement the Server Actions**

```ts
// actions/partner.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import { createCourseSchema } from '@/lib/validations'

export async function createCourse(formData: FormData): Promise<{ error: string } | never> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) return { error: 'Partner account not found.' }

  const existing = await getPartnerCourse(partner.id)
  if (existing) return { error: 'Course already exists.' }

  // Extract photos before Zod (not in schema)
  const photos = (formData.get('photos') as string ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const parsed = createCourseSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const slug =
    parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) +
    '-' +
    Date.now().toString(36)

  await db.insert(courses).values({
    ...parsed.data,
    photos,
    partnerId: partner.id,
    slug,
    status: 'pending',
  })

  revalidatePath('/partner/dashboard')
  redirect('/partner/dashboard')
}

export async function updateCourse(
  courseId: string,
  formData: FormData
): Promise<{ error: string } | {}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) return { error: 'Partner account not found.' }

  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)
    .then((r) => r[0] ?? null)

  if (!course || course.partnerId !== partner.id) return { error: 'Not authorized.' }

  const photos = (formData.get('photos') as string ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const parsed = createCourseSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db
    .update(courses)
    .set({ ...parsed.data, photos, updatedAt: new Date() })
    .where(eq(courses.id, courseId))

  revalidatePath('/partner/course')
  return {}
}
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
npx vitest run actions/partner.test.ts 2>&1 | tail -15
```

Expected: `10 passed` (5 createCourse + 5 updateCourse)

- [ ] **Step 5: Commit**

```bash
git add actions/partner.ts actions/partner.test.ts
git commit -m "feat: add partner Server Actions with tests"
```

---

## Task 3: PartnerNav Component

**Files:**
- Create: `components/partner-nav.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface PartnerNavProps {
  businessName: string
}

const activeTabs = [
  { label: 'Dashboard', href: '/partner/dashboard' },
  { label: 'Course', href: '/partner/course' },
] as const

const lockedTabs = ['Inventory', 'Bookings', 'Payouts'] as const

export default function PartnerNav({ businessName }: PartnerNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 40 }}>
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
          href="/partner/dashboard"
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
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {businessName}
        </span>
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
        {/* Active tabs */}
        {activeTabs.map((tab) => {
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
                borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Link>
          )
        })}

        {/* Locked tabs — not yet built */}
        {lockedTabs.map((label) => (
          <span
            key={label}
            style={{
              height: 44,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.2)',
              borderBottom: '2px solid transparent',
              flexShrink: 0,
              cursor: 'default',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/partner-nav.tsx
git commit -m "feat: add PartnerNav client component"
```

---

## Task 4: Partner Layout

**Files:**
- Create: `app/(partner)/layout.tsx`

- [ ] **Step 1: Create the directory and layout**

```bash
mkdir -p "/Users/dutchmike/Desktop/Claude Agents/OneGolf/V1/onegolf/app/(partner)"
```

```tsx
// app/(partner)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId } from '@/lib/partner/queries'
import PartnerNav from '@/components/partner-nav'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let partner
  try {
    partner = await getPartnerByUserId(user.id)
    if (!partner) redirect('/login')
  } catch (err) {
    console.error('[partner-layout] query failed', err)
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#090f1a] flex flex-col">
      <PartnerNav businessName={partner.businessName} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(partner)/layout.tsx"
git commit -m "feat: add partner layout with PartnerNav"
```

---

## Task 5: CourseForm Component

**Files:**
- Create: `components/course-form.tsx`

This is the shared form for both create and edit. Uses shadcn/ui components from `components/ui/` — all already installed (`Input`, `Textarea`, `Button`, `Label`). Uses React Hook Form + the existing `createCourseSchema`.

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useTransition, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createCourseSchema } from '@/lib/validations'
import { createCourse, updateCourse } from '@/actions/partner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Schema for the form — holes as string (select value) before transform
const formSchema = createCourseSchema.extend({
  holes: z.enum(['9', '18']),
})
type FormValues = z.infer<typeof formSchema>

interface CourseInitialValues {
  name: string
  description: string | null
  address: string
  holes: 9 | 18
  baseCreditCost: number
  amenities: string[] | null
  photos: string[] | null
}

type CourseFormProps =
  | { mode: 'create'; partnerId: string }
  | { mode: 'edit'; courseId: string; initialValues: CourseInitialValues }

const AMENITIES = [
  'Driving Range',
  'Practice Green',
  'Pro Shop',
  'Caddies Available',
  'Golf Cart Included',
  'Walking Only',
  'Restaurant/Bar',
  'Changing Rooms',
]

export default function CourseForm(props: CourseFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const photosRef = useRef<HTMLTextAreaElement>(null)

  const defaultValues: Partial<FormValues> =
    props.mode === 'edit'
      ? {
          name: props.initialValues.name,
          description: props.initialValues.description ?? '',
          address: props.initialValues.address,
          holes: String(props.initialValues.holes) as '9' | '18',
          baseCreditCost: props.initialValues.baseCreditCost,
          amenities: props.initialValues.amenities ?? [],
        }
      : { holes: '18', amenities: [] }

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues })

  const selectedAmenities = watch('amenities') ?? []

  function toggleAmenity(amenity: string) {
    const current = selectedAmenities
    setValue(
      'amenities',
      current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity]
    )
  }

  function onSubmit(data: FormValues) {
    setServerError(null)
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach((item) => fd.append(k, item))
      } else if (v != null) {
        fd.append(k, String(v))
      }
    })
    // Photos field is uncontrolled (not in Zod schema) — read from ref
    fd.set('photos', photosRef.current?.value ?? '')

    startTransition(async () => {
      const result =
        props.mode === 'create'
          ? await createCourse(fd)
          : await updateCourse(props.courseId, fd)

      if (result && 'error' in result) {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">Course name</Label>
        <Input id="name" {...register('name')} className="bg-[#0f1923] border-[#1a1a1a] text-white" />
        {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">Description</Label>
        <Textarea id="description" {...register('description')} rows={4}
          className="bg-[#0f1923] border-[#1a1a1a] text-white resize-none" />
        {errors.description && <p className="text-red-400 text-xs">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-white">Address</Label>
        <Input id="address" {...register('address')} className="bg-[#0f1923] border-[#1a1a1a] text-white" />
        {errors.address && <p className="text-red-400 text-xs">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="holes" className="text-white">Holes</Label>
          <select
            id="holes"
            {...register('holes')}
            className="w-full h-10 px-3 bg-[#0f1923] border border-[#1a1a1a] text-white rounded-none text-sm"
          >
            <option value="18">18 holes</option>
            <option value="9">9 holes</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseCreditCost" className="text-white">Base credit cost</Label>
          <Input
            id="baseCreditCost"
            type="number"
            {...register('baseCreditCost', { valueAsNumber: true })}
            className="bg-[#0f1923] border-[#1a1a1a] text-white"
          />
          {errors.baseCreditCost && <p className="text-red-400 text-xs">{errors.baseCreditCost.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Photo URLs <span className="text-white/40 font-normal">(comma-separated)</span></Label>
        <Textarea
          ref={photosRef}
          defaultValue={
            props.mode === 'edit' ? (props.initialValues.photos ?? []).join(', ') : ''
          }
          rows={2}
          placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
          className="bg-[#0f1923] border-[#1a1a1a] text-white resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="accent-[#38bdf8]"
              />
              <span className="text-sm text-white/70">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {serverError && (
        <p className="text-red-400 text-sm">{serverError}</p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="bg-white text-black hover:bg-white/90 rounded-none font-bold uppercase tracking-widest text-xs px-8"
      >
        {isPending
          ? props.mode === 'create' ? 'Creating course…' : 'Saving changes…'
          : props.mode === 'create' ? 'Create course' : 'Save changes'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/course-form.tsx
git commit -m "feat: add CourseForm shared client component"
```

---

## Task 6: Create Course Page

**Files:**
- Create: `app/(partner)/course/new/page.tsx`

- [ ] **Step 1: Create directory and page**

```bash
mkdir -p "/Users/dutchmike/Desktop/Claude Agents/OneGolf/V1/onegolf/app/(partner)/course/new"
```

```tsx
// app/(partner)/course/new/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import CourseForm from '@/components/course-form'

export const metadata = { title: 'Set up your course — OneGolf' }

export default async function NewCoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const existing = await getPartnerCourse(partner.id)
  if (existing) redirect('/partner/course')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Set up your course</h1>
        <p className="text-white/40 text-sm mt-1">Your course will be reviewed before going live.</p>
      </div>
      <CourseForm mode="create" partnerId={partner.id} />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "app/(partner)/course/new/page.tsx"
git commit -m "feat: add create course page"
```

---

## Task 7: Edit Course Page

**Files:**
- Create: `app/(partner)/course/page.tsx`

- [ ] **Step 1: Create directory and page**

```bash
mkdir -p "/Users/dutchmike/Desktop/Claude Agents/OneGolf/V1/onegolf/app/(partner)/course"
```

```tsx
// app/(partner)/course/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import CourseForm from '@/components/course-form'

export const metadata = { title: 'Edit course — OneGolf' }

export default async function EditCoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course/new')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">{course.name}</h1>
        <p className="text-white/40 text-sm mt-1">
          Status: <span className={course.status === 'active' ? 'text-[#38bdf8]' : 'text-yellow-400'}>{course.status}</span>
        </p>
      </div>
      <CourseForm
        mode="edit"
        courseId={course.id}
        initialValues={{
          name: course.name,
          description: course.description,
          address: course.address,
          holes: course.holes as 9 | 18,
          baseCreditCost: course.baseCreditCost,
          amenities: course.amenities,
          photos: course.photos,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "app/(partner)/course/page.tsx"
git commit -m "feat: add edit course page"
```

---

## Task 8: Dashboard Page

**Files:**
- Create: `app/(partner)/dashboard/page.tsx`

- [ ] **Step 1: Create directory and page**

```bash
mkdir -p "/Users/dutchmike/Desktop/Claude Agents/OneGolf/V1/onegolf/app/(partner)/dashboard"
```

```tsx
// app/(partner)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'

export const metadata = { title: 'Partner Dashboard — OneGolf' }

export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course/new')

  const stats = [
    { label: 'Total bookings', value: '0' },
    { label: 'This week', value: '0' },
    { label: 'Active slots', value: '0' },
    { label: 'Revenue', value: '$0' },
  ]

  return (
    <div className="p-8">
      {course.status === 'pending' && (
        <div className="mb-6 px-4 py-3 border border-yellow-400/30 bg-yellow-400/5 text-yellow-400 text-sm">
          Your course is pending approval. We'll notify you when it goes live.
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">{course.name}</h1>
        <p className="text-white/40 text-sm mt-1 uppercase tracking-widest text-xs">Partner Dashboard</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a1a1a]">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#090f1a] p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run all tests to confirm nothing is broken**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: all tests pass (including the new partner action tests)

- [ ] **Step 4: Commit**

```bash
git add "app/(partner)/dashboard/page.tsx"
git commit -m "feat: add partner dashboard page"
```

---

## Verification Checklist

After all 8 tasks complete:

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx vitest run` — all tests pass including `actions/partner.test.ts` (10 tests)
- [ ] As a partner user, visiting `/partner/dashboard` redirects to `/partner/course/new`
- [ ] Course create form submits → course created in DB → redirects to `/partner/dashboard`
- [ ] Dashboard shows "pending approval" banner for new courses
- [ ] Dashboard shows 4 stat tiles (all `0` initially)
- [ ] `/partner/course` shows pre-filled edit form for existing course
- [ ] Editing and saving updates the course in the DB
- [ ] PartnerNav shows sky blue (`#38bdf8`) active tab indicator
- [ ] Inventory, Bookings, Payouts tabs are dim (`rgba(255,255,255,0.2)`) and non-clickable
- [ ] Non-partner users visiting `/partner/*` are redirected by `proxy.ts` (test by visiting as a member)
