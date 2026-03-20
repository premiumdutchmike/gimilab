# Partner Portal — Shell + Course Setup Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Phase:** 4 — Sub-project 1 of 4

---

## 1. Scope

Build the partner portal shell (layout, nav) and course profile management (create + edit). This is the minimum that unblocks sub-project 2 (Inventory) and ultimately makes slots available for members to book.

**In scope:**
- `app/(partner)/layout.tsx` — Server Component shell, fetches partner + course, renders `<PartnerNav>`
- `components/partner-nav.tsx` — `'use client'` sticky double-header nav (sky blue accent)
- `app/(partner)/dashboard/page.tsx` — redirects to `/partner/course/new` if no course; otherwise shows basic stats
- `app/(partner)/course/new/page.tsx` — create course form
- `app/(partner)/course/page.tsx` — edit course form
- `actions/partner.ts` — `createCourse`, `updateCourse` Server Actions
- `lib/partner/queries.ts` — `getPartnerByUserId`, `getPartnerCourse`

**Out of scope:** Stripe Connect, inventory/blocks management, bookings view, analytics, photo upload (URLs only for now), admin approval UI.

---

## 2. Design Language

Partner portal uses the existing dark theme (`#090f1a` background) with **sky blue** accent (`#38bdf8`) instead of the member area's green (`#4ade80`). Same editorial quality: no border-radius, `1px solid #1a1a1a` dividers, uppercase labels, Geist Sans.

Forms use the existing `shadcn/ui` input/button components already in the project.

Do not use Tailwind `dark:` variants — the root layout applies `dark` globally. Use explicit hex values or standard dark-mode-safe Tailwind tokens (`text-white`, `bg-[#090f1a]`, etc.).

---

## 3. Routing

```
/partner/dashboard       → PartnerDashboard page (redirect to /partner/course/new if no course)
/partner/course/new      → CreateCourse page
/partner/course          → EditCourse page
```

`proxy.ts` already guards all `/partner/*` routes — only users with `role === 'partner'` or `role === 'admin'` can access them. No additional auth needed in the layout beyond fetching the partner record.

---

## 4. Database Queries — `lib/partner/queries.ts`

Two focused query functions. No business logic — pure DB reads.

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

Both return `null` if not found (not found is a valid state — new partners have no course yet).

---

## 5. Partner Layout — `app/(partner)/layout.tsx`

**Type:** Async Server Component

**Responsibilities:**
1. Fetch user from Supabase Auth (`createClient` → `supabase.auth.getUser()`)
2. If no user → `redirect('/login')` (belt-and-suspenders; proxy.ts already handles this)
3. `getPartnerByUserId(user.id)` — fetch partner record
4. If no partner record → `redirect('/login')` (shouldn't happen if role is set correctly, but safe)
5. `getPartnerCourse(partner.id)` — fetch course (may be null for new partners)
6. Extract display name: `partner.businessName`
7. Render `<PartnerNav businessName={businessName} hasCourse={!!course} />`
8. Wrap children in layout shell

**Error handling:** If either query throws, catch + log, redirect to `/login`.

**Layout structure:**
```tsx
<div className="min-h-screen bg-[#090f1a] flex flex-col">
  <PartnerNav businessName={businessName} hasCourse={!!course} />
  <main className="flex-1">{children}</main>
</div>
```

---

## 6. Partner Nav — `components/partner-nav.tsx`

**Type:** `'use client'` (needs `usePathname()`)

**Props:**
```ts
interface PartnerNavProps {
  businessName: string
  hasCourse: boolean
}
```

**Structure:** Two sticky horizontal bars (`position: sticky; top: 0; z-index: 40`).

### Top bar
`height: 48px`. `background: #090f1a`. `border-bottom: 1px solid #1a1a1a`. Flex row, space-between, `padding: 0 16px`.

- Left: `ONEGOLF` in `12px`, `font-weight: 900`, `letter-spacing: 4px`, `color: #fff`. Links to `/partner/dashboard`.
- Right: `{businessName}` in `11px`, `font-weight: 600`, uppercase, `color: rgba(255,255,255,0.5)`. No link (static label).

### Tab strip
`height: 44px`. `background: #090f1a`. `border-bottom: 1px solid #1a1a1a`. Flex row, `padding: 0 16px`, overflow-x auto, `scrollbarWidth: 'none'`.

Tabs:

| Label | href | Active when |
|-------|------|-------------|
| Dashboard | `/partner/dashboard` | `pathname === '/partner/dashboard'` |
| Course | `/partner/course` | `pathname.startsWith('/partner/course')` |
| Inventory | — | always dim (not yet built) |
| Bookings | — | always dim |
| Payouts | — | always dim |

**Active tab:** `color: #fff`, `border-bottom: 2px solid #38bdf8` (sky blue)

**Inactive active-capable tab:** `color: rgba(255,255,255,0.4)`, `border-bottom: 2px solid transparent`

**Inactive locked tab (Inventory, Bookings, Payouts):** `color: rgba(255,255,255,0.2)`, no link, cursor default, `border-bottom: 2px solid transparent`. Rendered as `<span>` not `<Link>`.

Active detection: `pathname === href || pathname.startsWith(href + '/')`

---

## 7. Dashboard — `app/(partner)/dashboard/page.tsx`

**Type:** Async Server Component

**Logic:**
1. Get user from Supabase Auth
2. `getPartnerByUserId(user.id)` → partner
3. `getPartnerCourse(partner.id)` → course
4. If `!course` → `redirect('/partner/course/new')`
5. If course exists → render stats shell

**Stats shell (course exists):**

Four stat tiles in a row: `Total Bookings`, `This Week`, `Active Slots`, `Revenue` — all showing `0` or `$0` for now with a label. Simple grid layout, no charts yet.

**Status banner:** If `course.status === 'pending'` show a yellow banner — "Your course is pending approval. We'll notify you when it goes live."

**Page structure:**
```
[Status banner — if pending]
[Page header: course.name + "Partner Dashboard"]
[4 stat tiles]
```

---

## 8. Course Form — shared between Create and Edit

Both pages use the same `<CourseForm>` client component. The difference: create has no initial values, edit pre-fills from the existing course.

**`components/course-form.tsx`** — `'use client'`

Uses React Hook Form + Zod (`createCourseSchema` from `lib/validations`). On submit calls the appropriate Server Action via `useTransition`.

**Props (discriminated union — TypeScript-safe):**
```ts
type CourseFormProps =
  | { mode: 'create'; partnerId: string }
  | { mode: 'edit'; courseId: string; initialValues: CourseInitialValues }

// Separate type for pre-fill — coerced from Drizzle Course select type
interface CourseInitialValues {
  name: string
  description: string | null
  address: string
  holes: 9 | 18           // DB stores integer, coerce from Drizzle number
  baseCreditCost: number  // DB stores integer, coerce from Drizzle number
  amenities: string[] | null
  photos: string[] | null
}
```

In edit mode, the parent page must coerce Drizzle types before passing `initialValues`:
- `holes`: already a number in Drizzle (`integer` column) — pass directly
- `baseCreditCost`: already a number — pass directly
- `lat`/`lng`: intentionally excluded from the form (left null for MVP, will be geocoded later)
- `photos`: pass array directly (already `string[] | null`)

**Fields:**

| Field | Input type | Validation |
|-------|-----------|------------|
| Course name | text | min 2, max 100 |
| Description | textarea | max 2000, optional |
| Address | text | min 5 |
| Holes | select: 9 / 18 | required |
| Base credit cost | number | int, 10–500 |
| Photo URLs | textarea (comma-separated) | optional |
| Amenities | checkbox group | optional, from fixed list |

> `lat` and `lng` are **intentionally excluded** from the partner form. They default to `null` and will be geocoded in a later phase.

**Amenities fixed list:** Driving Range, Practice Green, Pro Shop, Caddies Available, Golf Cart Included, Walking Only, Restaurant/Bar, Changing Rooms

**Photo URLs field:** A `<textarea>` where partners paste comma-separated image URLs. The Server Action handles parsing (split on comma, trim whitespace, filter empty strings → `string[]`). Not part of `createCourseSchema` — extracted separately from `FormData` in the action before Zod validation.

**Submit button:** `Creating course…` / `Saving changes…` during pending state.

**Error display:** Form-level error shown below the submit button if the server action returns `{ error: string }`.

---

## 9. Create Course Page — `app/(partner)/course/new/page.tsx`

**Type:** Server Component (just fetches partner ID, renders `<CourseForm>`)

Check: if course already exists → `redirect('/partner/course')` (can't create a second one in MVP).

Renders `<CourseForm mode="create" partnerId={partner.id} />`.

Page title: `Set up your course`

---

## 10. Edit Course Page — `app/(partner)/course/page.tsx`

**Type:** Async Server Component

Fetches course → if none, redirect to `/partner/course/new`.

Renders `<CourseForm mode="edit" courseId={course.id} initialValues={course} />`.

Page title: `{course.name}`

---

## 11. Server Actions — `actions/partner.ts`

```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPartnerByUserId } from '@/lib/partner/queries'
import { createCourseSchema } from '@/lib/validations'
```

### `createCourse(formData: FormData): Promise<{ error: string } | never>`

1. Auth check → `if (!user) return { error: 'Not authenticated.' }`
2. `getPartnerByUserId(user.id)` → `if (!partner) return { error: 'Partner account not found.' }`
3. Check no course exists via `getPartnerCourse(partner.id)` → `if (existing) return { error: 'Course already exists.' }`
4. Extract photos from FormData before Zod: `const photos = (formData.get('photos') as string ?? '').split(',').map(s => s.trim()).filter(Boolean)`
5. Parse + validate with `createCourseSchema.safeParse(Object.fromEntries(formData))` — `lat`/`lng` will be absent and are optional in schema → return `{ error: issues[0].message }` on failure
6. Generate slug: `parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) + '-' + Date.now().toString(36)`
7. `db.insert(courses).values({ ...parsed, photos, partnerId: partner.id, slug, status: 'pending' })`
8. `revalidatePath('/partner/dashboard')`
9. `redirect('/partner/dashboard')`

### `updateCourse(courseId: string, formData: FormData): Promise<{ error: string } | never>`

1. Auth check → `if (!user) return { error: 'Not authenticated.' }`
2. `getPartnerByUserId(user.id)` → `if (!partner) return { error: 'Partner account not found.' }`
3. Fetch course: `const course = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1).then(r => r[0] ?? null)`
4. Ownership check: `if (!course || course.partnerId !== partner.id) return { error: 'Not authorized.' }`
5. Extract photos: same split/trim/filter as `createCourse`
6. Parse + validate with `createCourseSchema.safeParse(Object.fromEntries(formData))` → return error on failure
7. `db.update(courses).set({ ...parsed, photos, updatedAt: new Date() }).where(eq(courses.id, courseId))`
8. `revalidatePath('/partner/course')`
9. `return {}`

---

## 12. Data Flow

```
app/(partner)/layout.tsx (Server)
  → supabase.auth.getUser()
  → getPartnerByUserId(user.id)       — lib/partner/queries.ts
  → getPartnerCourse(partner.id)      — lib/partner/queries.ts
  → <PartnerNav businessName hasCourse />

app/(partner)/dashboard/page.tsx (Server)
  → getPartnerCourse() → redirect if no course
  → render stats shell

app/(partner)/course/new/page.tsx (Server)
  → render <CourseForm mode="create" />

components/course-form.tsx (Client)
  → React Hook Form + Zod
  → createCourse(formData) / updateCourse(courseId, formData)   — actions/partner.ts
  → Server Action → DB insert/update → redirect/revalidate
```

---

## 13. Error States

- Partner record not found → redirect to `/login` (handled in layout)
- Course already exists on create → return `{ error }` shown in form
- DB insert fails → catch, return `{ error: 'Something went wrong. Please try again.' }`
- Unauthorized update → return `{ error: 'Not authorized.' }`

---

## 14. Testing

Unit tests for Server Actions in `actions/partner.test.ts`:
- `createCourse`: unauthenticated, no partner record, validation failure, duplicate course, success (redirects)
- `updateCourse`: unauthenticated, wrong partner (unauthorized), validation failure, success (revalidates)

No tests needed for layout/nav/form components — visual verification sufficient.

---

## 15. Implementation Order

1. `lib/partner/queries.ts` — DB query helpers
2. `actions/partner.ts` + `actions/partner.test.ts` — Server Actions + tests
3. `components/partner-nav.tsx` — `'use client'` sticky nav
4. `app/(partner)/layout.tsx` — Server Component shell
5. `components/course-form.tsx` — `'use client'` shared form
6. `app/(partner)/course/new/page.tsx` — create page
7. `app/(partner)/course/page.tsx` — edit page
8. `app/(partner)/dashboard/page.tsx` — dashboard with redirect logic + stats shell
