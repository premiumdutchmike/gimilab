# Partner Inventory — Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Phase:** 4 — Sub-project 2 of 4

---

## 1. Scope

Build the partner inventory management UI: create, edit, toggle, and delete availability blocks, plus a read-only upcoming slots viewer. This unblocks member booking by giving partners the UI to populate `tee_time_blocks`, which the existing cron job (`/api/cron/generate-slots`) materializes into bookable `tee_time_slots` nightly.

**In scope:**
- `lib/partner/queries.ts` — add `getPartnerBlocks`, `getUpcomingSlots`
- `lib/validations/index.ts` — add `createBlockSchema`
- `actions/inventory.ts` — `createBlock`, `updateBlock`, `toggleBlock`, `deleteBlock`
- `actions/inventory.test.ts` — unit tests for all four actions
- `components/block-form.tsx` — shared `'use client'` create/edit form
- `app/(partner)/inventory/page.tsx` — main page: blocks list + slots table
- `app/(partner)/inventory/new/page.tsx` — create block page
- `app/(partner)/inventory/[blockId]/page.tsx` — edit block page
- `components/partner-nav.tsx` — unlock Inventory tab (`<span>` → `<Link>`)

> `proxy.ts` already guards `/partner/inventory` — no change needed.

**Out of scope:** Manual slot overrides, per-slot cancellation, visual calendar grid, analytics.

---

## 2. Routing

```
/partner/inventory              → main page (blocks list + upcoming slots table)
/partner/inventory/new          → create block form
/partner/inventory/[blockId]    → edit block form
```

`proxy.ts` already includes `pathname.startsWith('/partner/inventory')` in `isPartnerRoute` — no change needed.

---

## 3. Database Queries — `lib/partner/queries.ts`

Add two functions, both wrapped with `React.cache`:

```ts
export const getPartnerBlocks = cache(async function getPartnerBlocks(partnerId: string) {
  // Join tee_time_blocks → courses → partners to scope to this partner's course
  const rows = await db
    .select({ block: teeTimeBlocks })
    .from(teeTimeBlocks)
    .innerJoin(courses, eq(teeTimeBlocks.courseId, courses.id))
    .where(eq(courses.partnerId, partnerId))
    .orderBy(desc(teeTimeBlocks.createdAt))
  return rows.map(r => r.block)
})

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

> Note: Date range uses `new Date()` with the Node.js server clock. Vercel functions run UTC, which is correct for this use case. Local development in non-UTC timezones is acceptable since this is a read-only preview, not a booking-critical path.

---

## 4. Validation — `lib/validations/index.ts`

Add `createBlockSchema`:

```ts
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
  (d) => d.startTime < d.endTime,
  { message: 'End time must be after start time', path: ['endTime'] }
)
```

Export `createBlockSchema` from `lib/validations/index.ts`.

---

## 5. Server Actions — `actions/inventory.ts`

```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { teeTimeBlocks, teeTimeSlots, courses } from '@/lib/db/schema'
import { and, eq, gte, not } from 'drizzle-orm'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import { createBlockSchema } from '@/lib/validations'
```

### `createBlock(formData: FormData): Promise<{ error: string } | never>`

1. Auth check → `if (!user) return { error: 'Not authenticated.' }`
2. `getPartnerByUserId(user.id)` → `if (!partner) return { error: 'Partner account not found.' }`
3. `getPartnerCourse(partner.id)` → `if (!course) return { error: 'No course found.' }`
4. Extract `dayOfWeek`: `const dayOfWeek = formData.getAll('dayOfWeek') as string[]`
5. Extract `creditOverride` safely — blank `<input type="number">` submits `""`, which `z.coerce.number()` would coerce to `0`:
   ```ts
   const creditOverride = formData.get('creditOverride') === '' ? undefined : formData.get('creditOverride')
   ```
6. Parse: `createBlockSchema.safeParse({ ...Object.fromEntries(formData), dayOfWeek, creditOverride })` → return `{ error: issues[0].message }` on failure
7. `db.insert(teeTimeBlocks).values({ ...parsed.data, courseId: course.id })`
8. `revalidatePath('/partner/inventory')`
9. `redirect('/partner/inventory')`

### `updateBlock(blockId: string, formData: FormData): Promise<{ error: string } | Record<string, never>>`

1. Auth check
2. `getPartnerByUserId(user.id)` → partner
3. Fetch block:
   ```ts
   const block = await db.select().from(teeTimeBlocks).where(eq(teeTimeBlocks.id, blockId)).limit(1).then(r => r[0] ?? null)
   ```
4. `if (!block) return { error: 'Block not found.' }`
5. Fetch course → `if (course?.partnerId !== partner.id) return { error: 'Not authorized.' }`
6. Extract `dayOfWeek` + `creditOverride` same as `createBlock` (steps 4–5)
7. Parse with `createBlockSchema.safeParse(...)` → return `{ error }` on failure
8. `db.update(teeTimeBlocks).set({ ...parsed.data, updatedAt: new Date() }).where(eq(teeTimeBlocks.id, blockId))`
9. `revalidatePath('/partner/inventory')`
10. `return {}`

> Note: `updateBlock` returns `{}` on success (not redirect) — consistent with `updateCourse`. The client form handles returning to the list (either via `router.push` or the revalidation refresh).

### `toggleBlock(blockId: string): Promise<{ error: string } | Record<string, never>>`

1. Auth check
2. Partner + ownership check (same pattern)
3. `db.update(teeTimeBlocks).set({ isActive: !block.isActive, updatedAt: new Date() }).where(eq(teeTimeBlocks.id, blockId))`
4. `revalidatePath('/partner/inventory')`
5. `return {}`

### `deleteBlock(blockId: string): Promise<{ error: string } | Record<string, never>>`

1. Auth check
2. Partner + ownership check
3. Check for upcoming booked slots:
   ```ts
   const today = new Date().toISOString().split('T')[0]
   const booked = await db.select({ id: teeTimeSlots.id })
     .from(teeTimeSlots)
     .where(and(
       eq(teeTimeSlots.blockId, blockId),
       eq(teeTimeSlots.status, 'BOOKED'),
       gte(teeTimeSlots.date, today)
     ))
     .limit(1)
   if (booked.length > 0) return { error: 'Cannot delete a block with upcoming bookings.' }
   ```
4. `db.delete(teeTimeBlocks).where(eq(teeTimeBlocks.id, blockId))`
5. `revalidatePath('/partner/inventory')`
6. `return {}`

---

## 6. Block Form — `components/block-form.tsx`

**Type:** `'use client'`

Uses React Hook Form + Zod (`createBlockSchema`). `dayOfWeek` managed via `watch` + `setValue` (same toggle pattern as amenities in `CourseForm`).

**Props (discriminated union):**
```ts
type BlockFormProps =
  | { mode: 'create' }
  | { mode: 'edit'; blockId: string; initialValues: BlockInitialValues }

interface BlockInitialValues {
  dayOfWeek: number[]
  startTime: string         // "HH:MM:SS" from DB → truncated to "HH:MM" for input
  endTime: string
  slotsPerInterval: number
  creditOverride: number | null
  validFrom: string         // "YYYY-MM-DD"
  validUntil: string | null
  isActive: boolean
}
```

**Form schema** — extends `createBlockSchema` with plain `z.number()` / `z.array(z.number())` overrides so RHF infers correct TypeScript types (no `z.coerce` on the client side — RHF uses `valueAsNumber` on number inputs and the day-of-week array holds native numbers from `watch`/`setValue`):
```ts
const formSchema = createBlockSchema.extend({
  dayOfWeek:        z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one day'),
  slotsPerInterval: z.number().int().min(1).max(4),
  creditOverride:   z.number().int().min(10).max(500).optional(),
})
type FormValues = z.infer<typeof formSchema>
```

**Fields:**

| Field | Input | Notes |
|-------|-------|-------|
| Days of week | 7 toggle buttons: S M T W T F S | Toggle with `setValue('dayOfWeek', [...])` |
| Start time | `<input type="time">` | Registered with RHF |
| End time | `<input type="time">` | Registered with RHF |
| Slots per interval | `<input type="number" min="1" max="4">` | `valueAsNumber: true` |
| Credit override | `<input type="number">` | Optional; blank = use course base |
| Valid from | `<input type="date">` | Registered with RHF |
| Valid until | `<input type="date">` | Optional |
| Active | `<input type="checkbox">` | Default checked on create |

**Submit:** builds `FormData` → `dayOfWeek` appended as repeated keys → calls `createBlock(fd)` or `updateBlock(blockId, fd)` via `useTransition`. Server errors shown below submit button.

**Submit button text:**
- Create: `'Add block'` / `'Adding block…'`
- Edit: `'Save changes'` / `'Saving changes…'`

**Styling:** Matches `CourseForm` — `bg-[#0f1923] border-[#1a1a1a] text-white` inputs, `rounded-none`, uppercase labels. Day toggle pills: active = `bg-white text-black`, inactive = `border border-[#333] text-white/40`.

---

## 7. Main Inventory Page — `app/(partner)/inventory/page.tsx`

**Type:** Async Server Component

**Logic:**
1. `createClient()` → `supabase.auth.getUser()` → `if (!user) redirect('/login')`
2. `getPartnerByUserId(user.id)` → `if (!partner) redirect('/login')`
3. `getPartnerCourse(partner.id)` → `if (!course) redirect('/partner/course/new')`
4. `const [blocks, slots] = await Promise.all([getPartnerBlocks(partner.id), getUpcomingSlots(course.id)])`

**Page structure:**

```
[Page header: "Inventory"]

[Section label bar]
  Left:  "AVAILABILITY BLOCKS — {blocks.length}"
  Right: <Link href="/partner/inventory/new"> "+ ADD BLOCK" </Link>  (white bg, black text button)

[Blocks list]
  Each block row (border-bottom: 1px solid #111):
    - Days pills: abbreviated day names for each active day (MON TUE WED...)
    - Time range: "07:00 – 11:00"
    - "N slot/interval" or "N slots/interval"
    - Credit cost: "{creditOverride} credits (override)" or "{course.baseCreditCost} credits (base)"
      Note: `course` is fetched in step 3 of the page logic and is available in the same Server Component scope — pass it alongside the blocks array when rendering the list.
    - Status badge: "ACTIVE" (white) or "INACTIVE" (rgba(255,255,255,0.2))
    - <Link href="/partner/inventory/{block.id}">EDIT →</Link>
    - Toggle form: <form action={toggleBlock.bind(null, block.id)}><button>ACTIVATE / DEACTIVATE</button></form>
    - Delete form: <form action={deleteBlock.bind(null, block.id)}><button>DELETE</button></form>
      (delete button dim, confirmation via browser confirm() — not needed for MVP)

  Empty state:
    "No blocks yet. Add your first availability block to start generating tee times."

[Section label bar]
  Left:  "UPCOMING SLOTS — NEXT 14 DAYS"
  Right: "{slots.length} slots"

[Slots table]
  Columns: DATE | TIME | CREDITS | STATUS
  Rows: first 100 slots
  If slots.length > 100: footer row "Showing 100 of {slots.length} slots"
  Status colours:
    AVAILABLE → rgba(255,255,255,0.8)
    BOOKED    → #38bdf8  (sky blue)
    RELEASED  → #333
    EXPIRED   → #333

  Empty state:
    "No slots yet. Slots are generated nightly — check back tomorrow, or ensure your course status is active."
```

---

## 8. Create Block Page — `app/(partner)/inventory/new/page.tsx`

**Type:** Async Server Component

1. Auth + partner check (redirect if missing)
2. Course check — `if (!course) redirect('/partner/course/new')`
3. Renders `<BlockForm mode="create" />`

Page title: `Set up availability`

---

## 9. Edit Block Page — `app/(partner)/inventory/[blockId]/page.tsx`

**Type:** Async Server Component

1. Auth + partner + course check
2. `const { blockId } = await params` → fetch block:
   ```ts
   const block = await db.select().from(teeTimeBlocks).where(eq(teeTimeBlocks.id, blockId)).limit(1).then(r => r[0] ?? null)
   ```
   Ownership check: `if (!block || block.courseId !== course.id) redirect('/partner/inventory')`
3. Coerce `initialValues`:
   - `startTime`: trim to `"HH:MM"` (`block.startTime.slice(0, 5)`)
   - `endTime`: same
   - Pass remaining fields directly
4. Renders `<BlockForm mode="edit" blockId={block.id} initialValues={...} />`

Page title: `Edit block`

---

## 10. PartnerNav Update — `components/partner-nav.tsx`

Convert the locked Inventory `<span>` to a `<Link>`:

```tsx
// Before (locked):
<span style={{ color: 'rgba(255,255,255,0.2)', cursor: 'default', ... }}>
  Inventory
</span>

// After (active-capable):
<Link
  href="/partner/inventory"
  style={{
    color: pathname.startsWith('/partner/inventory') ? '#fff' : 'rgba(255,255,255,0.4)',
    borderBottom: pathname.startsWith('/partner/inventory') ? '2px solid #38bdf8' : '2px solid transparent',
    ...
  }}
>
  Inventory
</Link>
```

---

## 11. Data Flow

```
app/(partner)/inventory/page.tsx (Server)
  → getPartnerByUserId(user.id)         — lib/partner/queries.ts
  → getPartnerCourse(partner.id)        — lib/partner/queries.ts
  → getPartnerBlocks(partner.id)        — lib/partner/queries.ts
  → getUpcomingSlots(course.id)         — lib/partner/queries.ts
  → render blocks list + slots table

app/(partner)/inventory/new/page.tsx (Server)
  → render <BlockForm mode="create" />

components/block-form.tsx (Client)
  → React Hook Form + Zod
  → createBlock(fd) / updateBlock(blockId, fd)   — actions/inventory.ts
  → Server Action → DB insert/update → redirect

app/(partner)/inventory/page.tsx inline forms (Server)
  → toggleBlock(blockId)   — actions/inventory.ts (revalidates in place)
  → deleteBlock(blockId)   — actions/inventory.ts (revalidates in place)
```

---

## 12. Error States

- No course → redirect to `/partner/course/new`
- Block not found on edit → redirect to `/partner/inventory`
- Unauthorized block access → `return { error: 'Not authorized.' }`
- Delete with upcoming bookings → `return { error: 'Cannot delete a block with upcoming bookings.' }`
- Validation failure → form-level error shown in `<BlockForm>`
- DB error → catch, `return { error: 'Something went wrong. Please try again.' }`

---

## 13. Testing

Unit tests in `actions/inventory.test.ts` (Vitest, same mock pattern as `actions/partner.test.ts`):

**`createBlock`:** unauthenticated, no partner, no course, validation failure (no days selected, end before start), success (redirects to `/partner/inventory`)

**`updateBlock`:** unauthenticated, block not found, unauthorized (wrong partner), validation failure, success (returns `{}`)

**`toggleBlock`:** unauthenticated, unauthorized, success (returns `{}`)

**`deleteBlock`:** unauthenticated, unauthorized, blocked by upcoming bookings (returns error), success (returns `{}`)

No component tests needed — visual verification sufficient.

---

## 14. Implementation Order

1. `lib/validations/index.ts` — add `createBlockSchema`
2. `lib/partner/queries.ts` — add `getPartnerBlocks` + `getUpcomingSlots`
3. `actions/inventory.ts` + `actions/inventory.test.ts` — Server Actions + tests
4. `components/block-form.tsx` — shared client form
5. `app/(partner)/inventory/page.tsx` — main page
6. `app/(partner)/inventory/new/page.tsx` — create page
7. `app/(partner)/inventory/[blockId]/page.tsx` — edit page
8. `components/partner-nav.tsx` — unlock Inventory tab
