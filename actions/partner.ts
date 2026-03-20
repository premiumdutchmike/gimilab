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

  const raw = Object.fromEntries(formData)
  if (raw.baseCreditCost !== undefined) raw.baseCreditCost = Number(raw.baseCreditCost) as any

  const parsed = createCourseSchema.safeParse(raw)
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

  // Use .then() so the mock in tests resolves correctly; handle both array and mapped results
  const courseResult: any = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)
    .then((r: any) => r)
  const course = Array.isArray(courseResult) ? (courseResult[0] ?? null) : (courseResult ?? null)

  if (!course || course.partnerId !== partner.id) return { error: 'Not authorized.' }

  const photos = (formData.get('photos') as string ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const rawUpdate = Object.fromEntries(formData)
  if (rawUpdate.baseCreditCost !== undefined) rawUpdate.baseCreditCost = Number(rawUpdate.baseCreditCost) as any

  const parsed = createCourseSchema.safeParse(rawUpdate)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db
    .update(courses)
    .set({ ...parsed.data, photos, updatedAt: new Date() })
    .where(eq(courses.id, courseId))

  revalidatePath('/partner/course')
  return {}
}
