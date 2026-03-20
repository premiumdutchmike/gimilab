# Partner Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the partner inventory UI — create/edit/toggle/delete availability blocks and a read-only upcoming slots viewer — so the cron job has data to generate bookable tee time slots.

**Architecture:** 8 tasks in order: validation schema → DB queries → Server Actions + tests → shared form component → 3 pages → PartnerNav unlock. Each task is independently committable. Server Actions follow the exact pattern in `actions/partner.ts`. Form follows `components/course-form.tsx`.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Drizzle ORM, Supabase Auth, React Hook Form + Zod, Vitest, Tailwind v4

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `lib/validations/index.ts` | Modify | Add `createBlockSchema` alongside existing `createTeeTimeBlockSchema` |
| `lib/partner/queries.ts` | Modify | Add `getPartnerBlocks`, `getUpcomingSlots` |
| `actions/inventory.ts` | Create | `createBlock`, `updateBlock`, `toggleBlock`, `deleteBlock` Server Actions |
| `actions/inventory.test.ts` | Create | Unit tests for all four actions |
| `components/block-form.tsx` | Create | `'use client'` shared create/edit form (RHF + Zod) |
| `app/(partner)/inventory/page.tsx` | Create | Main page: blocks list + upcoming slots table |
| `app/(partner)/inventory/new/page.tsx` | Create | Create block page |
| `app/(partner)/inventory/[blockId]/page.tsx` | Create | Edit block page |
| `components/partner-nav.tsx` | Modify | Unlock Inventory tab: move from `lockedTabs` to `activeTabs` |

> **`proxy.ts` is already updated** — `pathname.startsWith('/partner/inventory')` is present. No change needed.

---

## Codebase Patterns to Follow

Before starting, scan these files (do not modify, just read for patterns):

- `actions/partner.ts` — exact auth + ownership + FormData pattern used in all actions
- `actions/partner.test.ts` — exact Vitest mock setup, `makeFormData` helper, `db.select` mock with `.then(cb)` pattern
- `components/course-form.tsx` — RHF + Zod discriminated union props, `watch`/`setValue` for multi-value fields, `useTransition`, FormData submit
- `lib/partner/queries.ts` — `React.cache` wrapper pattern
- `components/partner-nav.tsx` — `activeTabs` array and `lockedTabs` array structure

---

## Task 1: Add `createBlockSchema` to `lib/validations/index.ts`

**Files:**
- Modify: `lib/validations/index.ts`

> **Context:** The file already has `createTeeTimeBlockSchema` (lines 25–34) — a different schema used by the booking engine that includes `courseId` and has no `isActive`. Do NOT modify or remove it. Add a new `createBlockSchema` export after it for the partner form.

- [ ] **Step 1: Open `lib/validations/index.ts` and read the existing content**

  Verify `createTeeTimeBlockSchema` exists on line 25. Confirm `createBlockSchema` does NOT exist yet.

- [ ] **Step 2: Add `createBlockSchema` after `createTeeTimeBlockSchema`**

  Insert after line 34 (after the closing `)`):

  ```ts
  // ─── Partner / Inventory Block ────────────────────────────────────────────────
  export const createBlockSchema = z.object({
    dayOfWeek:        z.array(z.coerce.number().int().min(0).max(6)).min(1, 'Select at least one day'),
    startTime:        z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time'),
    endTime:          z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time'),
    slotsPerInterval: z.coerce.number().int().min(1).max(4).default(1),
    creditOverride:   z.coerce.number().int().min(10).max(500).optional(),
    validFrom:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
    validUntil:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    isActive:         z.coerce.boolean().default(true),
  }).refine(
    (d) => d.startTime.slice(0, 5) < d.endTime.slice(0, 5),
    { message: 'End time must be after start time', path: ['endTime'] }
  )
  ```

- [ ] **Step 3: Run TypeScript check**

  ```bash
  cd V1/onegolf && npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add lib/validations/index.ts
  git commit -m "feat: add createBlockSchema for partner inventory"
  ```

---

## Task 2: Add DB queries to `lib/partner/queries.ts`

**Files:**
- Modify: `lib/partner/queries.ts`

> **Context:** File currently has two `React.cache`-wrapped functions. Add two more at the bottom. Need new imports: `teeTimeBlocks`, `teeTimeSlots` from schema, and `desc`, `asc`, `and`, `gte`, `lt` from drizzle-orm.

- [ ] **Step 1: Read `lib/partner/queries.ts`**

  Confirm current imports include `eq` but not `desc`, `asc`, `and`, `gte`, `lt`. Confirm `teeTimeBlocks` and `teeTimeSlots` are not yet imported.

- [ ] **Step 2: Update imports**

  Change the imports block to:

  ```ts
  import { cache } from 'react'
  import { db } from '@/lib/db'
  import { partners, courses, teeTimeBlocks, teeTimeSlots } from '@/lib/db/schema'
  import { eq, desc, asc, and, gte, lt } from 'drizzle-orm'
  ```

- [ ] **Step 3: Add `getPartnerBlocks` at the bottom of the file**

  ```ts
  export const getPartnerBlocks = cache(async function getPartnerBlocks(partnerId: string) {
    const rows = await db
      .select({ block: teeTimeBlocks })
      .from(teeTimeBlocks)
      .innerJoin(courses, eq(teeTimeBlocks.courseId, courses.id))
      .where(eq(courses.partnerId, partnerId))
      .orderBy(desc(teeTimeBlocks.createdAt))
    return rows.map((r) => r.block)
  })
  ```

- [ ] **Step 4: Add `getUpcomingSlots` immediately after**

  ```ts
  export const getUpcomingSlots = cache(async function getUpcomingSlots(courseId: string, days = 14) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const until = new Date(today)
    until.setDate(until.getDate() + days)

    return db
      .select({
        id: teeTimeSlots.id,
        date: teeTimeSlots.date,
        startTime: teeTimeSlots.startTime,
        creditCost: teeTimeSlots.creditCost,
        status: teeTimeSlots.status,
      })
      .from(teeTimeSlots)
      .where(
        and(
          eq(teeTimeSlots.courseId, courseId),
          gte(teeTimeSlots.date, today.toISOString().split('T')[0]),
          lt(teeTimeSlots.date, until.toISOString().split('T')[0])
        )
      )
      .orderBy(asc(teeTimeSlots.date), asc(teeTimeSlots.startTime))
  })
  ```

- [ ] **Step 5: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 6: Commit**

  ```bash
  git add lib/partner/queries.ts
  git commit -m "feat: add getPartnerBlocks and getUpcomingSlots queries"
  ```

---

## Task 3: Server Actions + Tests

**Files:**
- Create: `actions/inventory.ts`
- Create: `actions/inventory.test.ts`

> **Context:** Follow `actions/partner.ts` exactly. For ownership in `updateBlock`/`toggleBlock`/`deleteBlock`, fetch the block via `db.select` then check ownership via `getPartnerCourse(partner.id)`. Use `.then((r) => r[0] ?? null)` pattern. `createBlock` redirects; `updateBlock` returns `{}`. The mock pattern in `actions/partner.test.ts` is the reference — especially `db.select` with `.then(cb)`.

- [ ] **Step 1: Write the failing tests first**

  Create `actions/inventory.test.ts`:

  ```ts
  import { describe, it, expect, vi, beforeEach } from 'vitest'

  vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
  }))
  vi.mock('@/lib/db', () => ({
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
  import { createBlock, updateBlock, toggleBlock, deleteBlock } from './inventory'

  const mockUser = { id: 'user-123' }
  const mockPartner = { id: 'partner-abc', userId: 'user-123' }
  const mockCourse = { id: 'course-xyz', partnerId: 'partner-abc' }
  const mockBlock = {
    id: 'block-111',
    courseId: 'course-xyz',
    isActive: true,
    dayOfWeek: [1, 2, 3],
    startTime: '07:00:00',
    endTime: '11:00:00',
    slotsPerInterval: 1,
    creditOverride: null,
    validFrom: '2026-03-21',
    validUntil: null,
  }

  const mockCreateClient = vi.mocked(createClient)
  const mockGetPartnerByUserId = vi.mocked(getPartnerByUserId)
  const mockGetPartnerCourse = vi.mocked(getPartnerCourse)

  /** Helper: creates a FormData with multi-value dayOfWeek support */
  function makeBlockFormData(
    overrides: Record<string, string> = {},
    days: number[] = [1, 2, 3]
  ) {
    const fd = new FormData()
    const defaults: Record<string, string> = {
      startTime: '07:00',
      endTime: '11:00',
      validFrom: '2026-03-21',
      slotsPerInterval: '1',
      isActive: 'true',
    }
    Object.entries({ ...defaults, ...overrides }).forEach(([k, v]) => fd.append(k, v))
    days.forEach((d) => fd.append('dayOfWeek', String(d)))
    return fd
  }

  /** Drizzle select chain mock that executes the .then() callback */
  function makeSelectMock(rows: unknown[]) {
    return {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb: any) => Promise.resolve(cb(rows))),
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    } as any)
    mockGetPartnerByUserId.mockResolvedValue(mockPartner as any)
    mockGetPartnerCourse.mockResolvedValue(mockCourse as any)
  })

  // ─── createBlock ───────────────────────────────────────────────────────────

  describe('createBlock', () => {
    it('returns error when not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      } as any)
      const result = await createBlock(makeBlockFormData())
      expect(result).toEqual({ error: 'Not authenticated.' })
    })

    it('returns error when partner not found', async () => {
      mockGetPartnerByUserId.mockResolvedValue(null as any)
      const result = await createBlock(makeBlockFormData())
      expect(result).toEqual({ error: 'Partner account not found.' })
    })

    it('returns error when no course found', async () => {
      mockGetPartnerCourse.mockResolvedValue(null as any)
      const result = await createBlock(makeBlockFormData())
      expect(result).toEqual({ error: 'No course found.' })
    })

    it('returns error on validation failure (no days)', async () => {
      const result = await createBlock(makeBlockFormData({}, [])) // no days
      expect(result).toHaveProperty('error')
    })

    it('returns error on validation failure (end before start)', async () => {
      const result = await createBlock(makeBlockFormData({ startTime: '11:00', endTime: '07:00' }))
      expect(result).toHaveProperty('error')
    })

    it('redirects to /partner/inventory on success', async () => {
      const insertMock = { values: vi.fn().mockResolvedValue([]) }
      vi.mocked(db.insert).mockReturnValue(insertMock as any)
      await expect(createBlock(makeBlockFormData())).rejects.toThrow('REDIRECT:/partner/inventory')
      expect(revalidatePath).toHaveBeenCalledWith('/partner/inventory')
    })
  })

  // ─── updateBlock ───────────────────────────────────────────────────────────

  describe('updateBlock', () => {
    it('returns error when not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      } as any)
      const result = await updateBlock('block-111', makeBlockFormData())
      expect(result).toEqual({ error: 'Not authenticated.' })
    })

    it('returns error when block not found', async () => {
      vi.mocked(db.select).mockReturnValue(makeSelectMock([]) as any) // no block
      const result = await updateBlock('block-111', makeBlockFormData())
      expect(result).toEqual({ error: 'Block not found.' })
    })

    it('returns error when block belongs to another partner', async () => {
      vi.mocked(db.select).mockReturnValue(
        makeSelectMock([{ ...mockBlock, courseId: 'other-course' }]) as any
      )
      // course is course-xyz, block.courseId is other-course → not authorized
      const result = await updateBlock('block-111', makeBlockFormData())
      expect(result).toEqual({ error: 'Not authorized.' })
    })

    it('returns error on validation failure', async () => {
      vi.mocked(db.select).mockReturnValue(makeSelectMock([mockBlock]) as any)
      const result = await updateBlock('block-111', makeBlockFormData({}, [])) // no days
      expect(result).toHaveProperty('error')
    })

    it('revalidates and returns {} on success', async () => {
      vi.mocked(db.select).mockReturnValue(makeSelectMock([mockBlock]) as any)
      const updateMock = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) }
      vi.mocked(db.update).mockReturnValue(updateMock as any)
      const result = await updateBlock('block-111', makeBlockFormData())
      expect(result).toEqual({})
      expect(revalidatePath).toHaveBeenCalledWith('/partner/inventory')
    })
  })

  // ─── toggleBlock ───────────────────────────────────────────────────────────

  describe('toggleBlock', () => {
    it('returns error when not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      } as any)
      const result = await toggleBlock('block-111')
      expect(result).toEqual({ error: 'Not authenticated.' })
    })

    it('returns error when not authorized', async () => {
      vi.mocked(db.select).mockReturnValue(
        makeSelectMock([{ ...mockBlock, courseId: 'other-course' }]) as any
      )
      const result = await toggleBlock('block-111')
      expect(result).toEqual({ error: 'Not authorized.' })
    })

    it('toggles isActive and returns {} on success', async () => {
      vi.mocked(db.select).mockReturnValue(makeSelectMock([mockBlock]) as any)
      const updateMock = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) }
      vi.mocked(db.update).mockReturnValue(updateMock as any)
      const result = await toggleBlock('block-111')
      expect(result).toEqual({})
      expect(updateMock.set).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }) // flipped from true
      )
      expect(revalidatePath).toHaveBeenCalledWith('/partner/inventory')
    })
  })

  // ─── deleteBlock ───────────────────────────────────────────────────────────

  describe('deleteBlock', () => {
    it('returns error when not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      } as any)
      const result = await deleteBlock('block-111')
      expect(result).toEqual({ error: 'Not authenticated.' })
    })

    it('returns error when not authorized', async () => {
      vi.mocked(db.select)
        .mockReturnValueOnce(makeSelectMock([{ ...mockBlock, courseId: 'other-course' }]) as any)
      const result = await deleteBlock('block-111')
      expect(result).toEqual({ error: 'Not authorized.' })
    })

    it('returns error when block has upcoming bookings', async () => {
      vi.mocked(db.select)
        .mockReturnValueOnce(makeSelectMock([mockBlock]) as any) // block fetch
        .mockReturnValueOnce(makeSelectMock([{ id: 'slot-1' }]) as any) // booked slots found
      const result = await deleteBlock('block-111')
      expect(result).toEqual({ error: 'Cannot delete a block with upcoming bookings.' })
    })

    it('deletes and returns {} on success', async () => {
      vi.mocked(db.select)
        .mockReturnValueOnce(makeSelectMock([mockBlock]) as any) // block fetch
        .mockReturnValueOnce(makeSelectMock([]) as any) // no booked slots
      const deleteMock = { where: vi.fn().mockResolvedValue([]) }
      vi.mocked(db.delete).mockReturnValue(deleteMock as any)
      const result = await deleteBlock('block-111')
      expect(result).toEqual({})
      expect(revalidatePath).toHaveBeenCalledWith('/partner/inventory')
    })
  })
  ```

- [ ] **Step 2: Run tests — verify they all fail (actions file doesn't exist yet)**

  ```bash
  npx vitest run actions/inventory.test.ts 2>&1 | head -20
  ```

  Expected: FAIL with "Cannot find module './inventory'"

- [ ] **Step 3: Create `actions/inventory.ts`**

  ```ts
  'use server'

  import { redirect } from 'next/navigation'
  import { revalidatePath } from 'next/cache'
  import { createClient } from '@/lib/supabase/server'
  import { db } from '@/lib/db'
  import { teeTimeBlocks, teeTimeSlots } from '@/lib/db/schema'
  import { and, eq, gte } from 'drizzle-orm'
  import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
  import { createBlockSchema } from '@/lib/validations'

  // ─── Shared helpers ───────────────────────────────────────────────────────────

  async function getAuthAndPartner() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' as const }
    const partner = await getPartnerByUserId(user.id)
    if (!partner) return { error: 'Partner account not found.' as const }
    return { user, partner }
  }

  async function fetchBlock(blockId: string) {
    return db
      .select()
      .from(teeTimeBlocks)
      .where(eq(teeTimeBlocks.id, blockId))
      .limit(1)
      .then((r) => r[0] ?? null)
  }

  // ─── createBlock ──────────────────────────────────────────────────────────────

  export async function createBlock(formData: FormData): Promise<{ error: string } | never> {
    const auth = await getAuthAndPartner()
    if ('error' in auth) return auth

    const course = await getPartnerCourse(auth.partner.id)
    if (!course) return { error: 'No course found.' }

    const dayOfWeek = formData.getAll('dayOfWeek') as string[]
    const creditOverride =
      formData.get('creditOverride') === '' ? undefined : formData.get('creditOverride')

    const parsed = createBlockSchema.safeParse({
      ...Object.fromEntries(formData),
      dayOfWeek,
      creditOverride,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await db.insert(teeTimeBlocks).values({ ...parsed.data, courseId: course.id })

    revalidatePath('/partner/inventory')
    redirect('/partner/inventory')
  }

  // ─── updateBlock ──────────────────────────────────────────────────────────────

  export async function updateBlock(
    blockId: string,
    formData: FormData
  ): Promise<{ error: string } | Record<string, never>> {
    const auth = await getAuthAndPartner()
    if ('error' in auth) return auth

    const block = await fetchBlock(blockId)
    if (!block) return { error: 'Block not found.' }

    const course = await getPartnerCourse(auth.partner.id)
    if (!course || block.courseId !== course.id) return { error: 'Not authorized.' }

    const dayOfWeek = formData.getAll('dayOfWeek') as string[]
    const creditOverride =
      formData.get('creditOverride') === '' ? undefined : formData.get('creditOverride')

    const parsed = createBlockSchema.safeParse({
      ...Object.fromEntries(formData),
      dayOfWeek,
      creditOverride,
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    await db
      .update(teeTimeBlocks)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(teeTimeBlocks.id, blockId))

    revalidatePath('/partner/inventory')
    return {}
  }

  // ─── toggleBlock ──────────────────────────────────────────────────────────────

  export async function toggleBlock(
    blockId: string
  ): Promise<{ error: string } | Record<string, never>> {
    const auth = await getAuthAndPartner()
    if ('error' in auth) return auth

    const block = await fetchBlock(blockId)
    if (!block) return { error: 'Block not found.' }

    const course = await getPartnerCourse(auth.partner.id)
    if (!course || block.courseId !== course.id) return { error: 'Not authorized.' }

    await db
      .update(teeTimeBlocks)
      .set({ isActive: !block.isActive, updatedAt: new Date() })
      .where(eq(teeTimeBlocks.id, blockId))

    revalidatePath('/partner/inventory')
    return {}
  }

  // ─── deleteBlock ──────────────────────────────────────────────────────────────

  export async function deleteBlock(
    blockId: string
  ): Promise<{ error: string } | Record<string, never>> {
    const auth = await getAuthAndPartner()
    if ('error' in auth) return auth

    const block = await fetchBlock(blockId)
    if (!block) return { error: 'Block not found.' }

    const course = await getPartnerCourse(auth.partner.id)
    if (!course || block.courseId !== course.id) return { error: 'Not authorized.' }

    const today = new Date().toISOString().split('T')[0]
    const booked = await db
      .select({ id: teeTimeSlots.id })
      .from(teeTimeSlots)
      .where(
        and(
          eq(teeTimeSlots.blockId, blockId),
          eq(teeTimeSlots.status, 'BOOKED'),
          gte(teeTimeSlots.date, today)
        )
      )
      .limit(1)

    if (booked.length > 0) return { error: 'Cannot delete a block with upcoming bookings.' }

    await db.delete(teeTimeBlocks).where(eq(teeTimeBlocks.id, blockId))

    revalidatePath('/partner/inventory')
    return {}
  }
  ```

- [ ] **Step 4: Run tests — all should pass**

  ```bash
  npx vitest run actions/inventory.test.ts
  ```

  Expected: All 15 tests PASS.

- [ ] **Step 5: Run full test suite to check no regressions**

  ```bash
  npx vitest run
  ```

  Expected: All tests pass (29 existing + 15 new = 44 total).

- [ ] **Step 6: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 7: Commit**

  ```bash
  git add actions/inventory.ts actions/inventory.test.ts
  git commit -m "feat: add inventory Server Actions with tests"
  ```

---

## Task 4: BlockForm Client Component

**Files:**
- Create: `components/block-form.tsx`

> **Context:** Follow `components/course-form.tsx` exactly. Key differences: day-of-week uses a toggle button array (not checkboxes), `creditOverride` is optional (blank = use course base). On successful `updateBlock` (returns `{}`), call `router.push('/partner/inventory')`.

- [ ] **Step 1: Create `components/block-form.tsx`**

  ```tsx
  'use client'

  import { useTransition, useState } from 'react'
  import { useForm } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { z } from 'zod'
  import { useRouter } from 'next/navigation'
  import { createBlock, updateBlock } from '@/actions/inventory'
  import { createBlockSchema } from '@/lib/validations'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Client-side schema: override coerce fields with plain types for RHF compatibility
  const formSchema = createBlockSchema.extend({
    dayOfWeek:        z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one day'),
    slotsPerInterval: z.number().int().min(1).max(4),
    creditOverride:   z.number().int().min(10).max(500).optional(),
  })
  type FormValues = z.infer<typeof formSchema>

  interface BlockInitialValues {
    dayOfWeek: number[]
    startTime: string       // "HH:MM" (trim from DB "HH:MM:SS")
    endTime: string
    slotsPerInterval: number
    creditOverride: number | null
    validFrom: string       // "YYYY-MM-DD"
    validUntil: string | null
    isActive: boolean
  }

  type BlockFormProps =
    | { mode: 'create' }
    | { mode: 'edit'; blockId: string; initialValues: BlockInitialValues }

  export default function BlockForm(props: BlockFormProps) {
    const [isPending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const router = useRouter()

    const defaultValues: Partial<FormValues> =
      props.mode === 'edit'
        ? {
            dayOfWeek:        props.initialValues.dayOfWeek,
            startTime:        props.initialValues.startTime,
            endTime:          props.initialValues.endTime,
            slotsPerInterval: props.initialValues.slotsPerInterval,
            creditOverride:   props.initialValues.creditOverride ?? undefined,
            validFrom:        props.initialValues.validFrom,
            validUntil:       props.initialValues.validUntil ?? undefined,
            isActive:         props.initialValues.isActive,
          }
        : { dayOfWeek: [], slotsPerInterval: 1, isActive: true }

    const {
      register,
      handleSubmit,
      watch,
      setValue,
      formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues })

    const selectedDays = watch('dayOfWeek') ?? []

    function toggleDay(day: number) {
      const current = selectedDays
      setValue(
        'dayOfWeek',
        current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
      )
    }

    function onSubmit(data: FormValues) {
      setServerError(null)
      const fd = new FormData()

      // Append dayOfWeek as repeated keys
      data.dayOfWeek.forEach((d) => fd.append('dayOfWeek', String(d)))

      // Append remaining fields
      fd.append('startTime', data.startTime)
      fd.append('endTime', data.endTime)
      fd.append('slotsPerInterval', String(data.slotsPerInterval))
      fd.append('creditOverride', data.creditOverride != null ? String(data.creditOverride) : '')
      fd.append('validFrom', data.validFrom)
      fd.append('validUntil', data.validUntil ?? '')
      fd.append('isActive', data.isActive ? 'true' : 'false')

      startTransition(async () => {
        const result =
          props.mode === 'create'
            ? await createBlock(fd)
            : await updateBlock(props.blockId, fd)

        if (result && 'error' in result) {
          setServerError(result.error)
        } else if (props.mode === 'edit') {
          router.push('/partner/inventory')
        }
      })
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">

        {/* Days of week */}
        <div className="space-y-2">
          <Label className="text-white">Days of week</Label>
          <div className="flex gap-2">
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                title={DAY_NAMES[i]}
                style={{
                  width: 36,
                  height: 36,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  background: selectedDays.includes(i) ? '#fff' : 'transparent',
                  color: selectedDays.includes(i) ? '#000' : 'rgba(255,255,255,0.4)',
                  border: selectedDays.includes(i) ? '1px solid #fff' : '1px solid #333',
                  borderRadius: 0,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.dayOfWeek && (
            <p className="text-red-400 text-xs">{errors.dayOfWeek.message as string}</p>
          )}
        </div>

        {/* Start / End time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-white">Start time</Label>
            <Input
              id="startTime"
              type="time"
              {...register('startTime')}
              className="bg-[#0f1923] border-[#1a1a1a] text-white"
            />
            {errors.startTime && (
              <p className="text-red-400 text-xs">{errors.startTime.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime" className="text-white">End time</Label>
            <Input
              id="endTime"
              type="time"
              {...register('endTime')}
              className="bg-[#0f1923] border-[#1a1a1a] text-white"
            />
            {errors.endTime && (
              <p className="text-red-400 text-xs">{errors.endTime.message}</p>
            )}
          </div>
        </div>

        {/* Slots per interval */}
        <div className="space-y-2">
          <Label htmlFor="slotsPerInterval" className="text-white">
            Slots per 10-min interval{' '}
            <span className="text-white/40 font-normal">(1–4)</span>
          </Label>
          <Input
            id="slotsPerInterval"
            type="number"
            min={1}
            max={4}
            {...register('slotsPerInterval', { valueAsNumber: true })}
            className="bg-[#0f1923] border-[#1a1a1a] text-white"
          />
          {errors.slotsPerInterval && (
            <p className="text-red-400 text-xs">{errors.slotsPerInterval.message}</p>
          )}
        </div>

        {/* Credit override */}
        <div className="space-y-2">
          <Label htmlFor="creditOverride" className="text-white">
            Credit override{' '}
            <span className="text-white/40 font-normal">(blank = use course base)</span>
          </Label>
          <Input
            id="creditOverride"
            type="number"
            min={10}
            max={500}
            {...register('creditOverride', { valueAsNumber: true })}
            className="bg-[#0f1923] border-[#1a1a1a] text-white"
          />
          {errors.creditOverride && (
            <p className="text-red-400 text-xs">{errors.creditOverride.message}</p>
          )}
        </div>

        {/* Valid from / until */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="validFrom" className="text-white">Valid from</Label>
            <Input
              id="validFrom"
              type="date"
              {...register('validFrom')}
              className="bg-[#0f1923] border-[#1a1a1a] text-white"
            />
            {errors.validFrom && (
              <p className="text-red-400 text-xs">{errors.validFrom.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="validUntil" className="text-white">
              Valid until{' '}
              <span className="text-white/40 font-normal">(blank = ongoing)</span>
            </Label>
            <Input
              id="validUntil"
              type="date"
              {...register('validUntil')}
              className="bg-[#0f1923] border-[#1a1a1a] text-white"
            />
          </div>
        </div>

        {/* Active */}
        <div className="flex items-center gap-3">
          <input
            id="isActive"
            type="checkbox"
            {...register('isActive')}
            className="accent-[#38bdf8]"
            defaultChecked
          />
          <Label htmlFor="isActive" className="text-white/70 text-sm font-normal cursor-pointer">
            Active (block will generate tee time slots)
          </Label>
        </div>

        {serverError && <p className="text-red-400 text-sm">{serverError}</p>}

        <Button
          type="submit"
          disabled={isPending}
          className="bg-white text-black hover:bg-white/90 rounded-none font-bold uppercase tracking-widest text-xs px-8"
        >
          {isPending
            ? props.mode === 'create' ? 'Adding block…' : 'Saving changes…'
            : props.mode === 'create' ? 'Add block' : 'Save changes'}
        </Button>
      </form>
    )
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add components/block-form.tsx
  git commit -m "feat: add BlockForm shared client component"
  ```

---

## Task 5: Main Inventory Page

**Files:**
- Create: `app/(partner)/inventory/page.tsx`

> **Context:** Server Component. Fetch partner → course → blocks + slots in parallel. `course` must be in scope when rendering the blocks list (for `baseCreditCost` fallback). Toggle/delete use inline `<form>` Server Actions with `.bind()`.

- [ ] **Step 1: Create `app/(partner)/inventory/page.tsx`**

  ```tsx
  import { redirect } from 'next/navigation'
  import Link from 'next/link'
  import { createClient } from '@/lib/supabase/server'
  import {
    getPartnerByUserId,
    getPartnerCourse,
    getPartnerBlocks,
    getUpcomingSlots,
  } from '@/lib/partner/queries'
  import { toggleBlock, deleteBlock } from '@/actions/inventory'
  import type { TeeTimeBlock } from '@/lib/db/schema'

  export const metadata = { title: 'Inventory — OneGolf' }

  const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  function formatTime(t: string) {
    return t.slice(0, 5) // "HH:MM:SS" → "HH:MM"
  }

  export default async function InventoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const partner = await getPartnerByUserId(user.id)
    if (!partner) redirect('/login')

    const course = await getPartnerCourse(partner.id)
    if (!course) redirect('/partner/course/new')

    const [blocks, slots] = await Promise.all([
      getPartnerBlocks(partner.id),
      getUpcomingSlots(course.id),
    ])

    const visibleSlots = slots.slice(0, 100)

    return (
      <div className="px-8 py-8 max-w-4xl">
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
            Partner Portal
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-1px', color: '#fff', lineHeight: 1, margin: 0 }}>
            Inventory
          </h1>
        </div>

        {/* ── Blocks section ── */}
        <div style={{ borderTop: '1px solid #1a1a1a', marginBottom: 48 }}>
          {/* Section label bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase' }}>
              AVAILABILITY BLOCKS — {blocks.length}
            </span>
            <Link
              href="/partner/inventory/new"
              style={{
                background: '#fff',
                color: '#000',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '8px 20px',
                textDecoration: 'none',
              }}
            >
              + ADD BLOCK
            </Link>
          </div>

          {blocks.length === 0 ? (
            <div style={{ padding: '32px 0', color: '#444', fontSize: 13 }}>
              No blocks yet. Add your first availability block to start generating tee times.
            </div>
          ) : (
            blocks.map((block: TeeTimeBlock) => (
              <div
                key={block.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 0',
                  borderBottom: '1px solid #111',
                  flexWrap: 'wrap',
                }}
              >
                {/* Days pills */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {(block.dayOfWeek as number[]).sort().map((d) => (
                    <span
                      key={d}
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '1px',
                        padding: '3px 6px',
                        background: '#1a1a1a',
                        color: '#fff',
                      }}
                    >
                      {DAY_ABBR[d]}
                    </span>
                  ))}
                </div>

                {/* Time range */}
                <span style={{ fontSize: 13, color: '#fff', fontFamily: 'var(--font-geist-mono)', flexShrink: 0 }}>
                  {formatTime(block.startTime)} – {formatTime(block.endTime)}
                </span>

                {/* Slots per interval */}
                <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>
                  {block.slotsPerInterval} slot{block.slotsPerInterval !== 1 ? 's' : ''}/10min
                </span>

                {/* Credit cost */}
                <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>
                  {block.creditOverride != null
                    ? `${block.creditOverride} cr (override)`
                    : `${course.baseCreditCost} cr (base)`}
                </span>

                {/* Status */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: block.isActive ? '#fff' : 'rgba(255,255,255,0.2)',
                    flexShrink: 0,
                  }}
                >
                  {block.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>

                {/* Actions — pushed to the right */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
                  <Link
                    href={`/partner/inventory/${block.id}`}
                    style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', letterSpacing: '1px', textTransform: 'uppercase' }}
                  >
                    EDIT →
                  </Link>
                  <form action={toggleBlock.bind(null, block.id)}>
                    <button
                      type="submit"
                      style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.4)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        padding: 0,
                      }}
                    >
                      {block.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                    </button>
                  </form>
                  <form action={deleteBlock.bind(null, block.id)}>
                    <button
                      type="submit"
                      style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.2)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        padding: 0,
                      }}
                    >
                      DELETE
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Slots section ── */}
        <div style={{ borderTop: '1px solid #1a1a1a' }}>
          {/* Section label bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase' }}>
              UPCOMING SLOTS — NEXT 14 DAYS
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', color: '#444', textTransform: 'uppercase' }}>
              {slots.length} SLOTS
            </span>
          </div>

          {slots.length === 0 ? (
            <div style={{ padding: '32px 0', color: '#444', fontSize: 13 }}>
              No slots yet. Slots are generated nightly — check back tomorrow, or ensure your course status is active.
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px', gap: 8, padding: '10px 0', borderBottom: '1px solid #111' }}>
                {['DATE', 'TIME', 'CREDITS', 'STATUS'].map((col) => (
                  <span key={col} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#333', textTransform: 'uppercase' }}>
                    {col}
                  </span>
                ))}
              </div>

              {/* Table rows */}
              {visibleSlots.map((slot) => {
                const statusColor =
                  slot.status === 'BOOKED' ? '#38bdf8' :
                  slot.status === 'AVAILABLE' ? 'rgba(255,255,255,0.8)' : '#333'

                return (
                  <div
                    key={slot.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 80px 120px',
                      gap: 8,
                      padding: '8px 0',
                      borderBottom: '1px solid #0d0d0d',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-geist-mono)' }}>
                      {slot.date}
                    </span>
                    <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-geist-mono)' }}>
                      {formatTime(slot.startTime)}
                    </span>
                    <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-geist-mono)' }}>
                      {slot.creditCost}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', color: statusColor, textTransform: 'uppercase' }}>
                      {slot.status}
                    </span>
                  </div>
                )
              })}

              {/* Overflow note */}
              {slots.length > 100 && (
                <div style={{ padding: '12px 0', fontSize: 11, color: '#444' }}>
                  Showing 100 of {slots.length} slots
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add app/\(partner\)/inventory/page.tsx
  git commit -m "feat: add partner inventory main page"
  ```

---

## Task 6: Create Block Page

**Files:**
- Create: `app/(partner)/inventory/new/page.tsx`

- [ ] **Step 1: Create `app/(partner)/inventory/new/page.tsx`**

  ```tsx
  import { redirect } from 'next/navigation'
  import { createClient } from '@/lib/supabase/server'
  import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
  import BlockForm from '@/components/block-form'

  export const metadata = { title: 'Add Block — OneGolf' }

  export default async function NewBlockPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const partner = await getPartnerByUserId(user.id)
    if (!partner) redirect('/login')

    const course = await getPartnerCourse(partner.id)
    if (!course) redirect('/partner/course/new')

    return (
      <div className="px-8 py-8">
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
            Inventory
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', color: '#fff', lineHeight: 1, margin: 0 }}>
            Set up availability
          </h1>
        </div>
        <BlockForm mode="create" />
      </div>
    )
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add "app/(partner)/inventory/new/page.tsx"
  git commit -m "feat: add create block page"
  ```

---

## Task 7: Edit Block Page

**Files:**
- Create: `app/(partner)/inventory/[blockId]/page.tsx`

> **Context:** `await params` (Next.js 16 async params). Fetch block directly from DB, not via query helper — check ownership via `block.courseId === course.id`. Coerce `startTime`/`endTime` to `"HH:MM"` (DB stores `"HH:MM:SS"`). `creditOverride` is `integer | null` in DB.

- [ ] **Step 1: Create `app/(partner)/inventory/[blockId]/page.tsx`**

  ```tsx
  import { redirect } from 'next/navigation'
  import { createClient } from '@/lib/supabase/server'
  import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
  import { db } from '@/lib/db'
  import { teeTimeBlocks } from '@/lib/db/schema'
  import { eq } from 'drizzle-orm'
  import BlockForm from '@/components/block-form'

  export const metadata = { title: 'Edit Block — OneGolf' }

  export default async function EditBlockPage({
    params,
  }: {
    params: Promise<{ blockId: string }>
  }) {
    const { blockId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const partner = await getPartnerByUserId(user.id)
    if (!partner) redirect('/login')

    const course = await getPartnerCourse(partner.id)
    if (!course) redirect('/partner/course/new')

    const block = await db
      .select()
      .from(teeTimeBlocks)
      .where(eq(teeTimeBlocks.id, blockId))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!block || block.courseId !== course.id) redirect('/partner/inventory')

    return (
      <div className="px-8 py-8">
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
            Inventory
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', color: '#fff', lineHeight: 1, margin: 0 }}>
            Edit block
          </h1>
        </div>
        <BlockForm
          mode="edit"
          blockId={block.id}
          initialValues={{
            dayOfWeek:        block.dayOfWeek as number[],
            startTime:        block.startTime.slice(0, 5),
            endTime:          block.endTime.slice(0, 5),
            slotsPerInterval: block.slotsPerInterval ?? 1,
            creditOverride:   block.creditOverride,
            validFrom:        block.validFrom,
            validUntil:       block.validUntil ?? null,
            isActive:         block.isActive ?? true,
          }}
        />
      </div>
    )
  }
  ```

- [ ] **Step 2: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add "app/(partner)/inventory/[blockId]/page.tsx"
  git commit -m "feat: add edit block page"
  ```

---

## Task 8: Unlock Inventory Tab in PartnerNav

**Files:**
- Modify: `components/partner-nav.tsx`

> **Context:** The nav uses two arrays: `activeTabs` (rendered as `<Link>`) and `lockedTabs` (rendered as `<span>`). Move `'Inventory'` from `lockedTabs` to `activeTabs` by adding it to the `activeTabs` array with `href: '/partner/inventory'`.

- [ ] **Step 1: Read `components/partner-nav.tsx`**

  Confirm `activeTabs` contains Dashboard + Course. Confirm `lockedTabs` contains `'Inventory'`, `'Bookings'`, `'Payouts'`.

- [ ] **Step 2: Add Inventory to `activeTabs`**

  Change:
  ```ts
  const activeTabs = [
    { label: 'Dashboard', href: '/partner/dashboard' },
    { label: 'Course', href: '/partner/course' },
  ] as const
  ```

  To:
  ```ts
  const activeTabs = [
    { label: 'Dashboard', href: '/partner/dashboard' },
    { label: 'Course', href: '/partner/course' },
    { label: 'Inventory', href: '/partner/inventory' },
  ] as const
  ```

- [ ] **Step 3: Remove `'Inventory'` from `lockedTabs`**

  Change:
  ```ts
  const lockedTabs = ['Inventory', 'Bookings', 'Payouts'] as const
  ```

  To:
  ```ts
  const lockedTabs = ['Bookings', 'Payouts'] as const
  ```

- [ ] **Step 4: TypeScript check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 5: Run full test suite**

  ```bash
  npx vitest run
  ```

  Expected: All tests pass.

- [ ] **Step 6: Commit**

  ```bash
  git add components/partner-nav.tsx
  git commit -m "feat: unlock Inventory tab in PartnerNav"
  ```
