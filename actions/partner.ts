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

  // Extract amenities before Zod (multi-value field)
  const amenities = formData.getAll('amenities') as string[]

  const raw = Object.fromEntries(formData)

  const parsed = createCourseSchema.safeParse({ ...raw, amenities })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const slug =
    parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) +
    '-' +
    Date.now().toString(36)

  const { lat: _lat, lng: _lng, ...courseData } = parsed.data
  await db.insert(courses).values({
    ...courseData,
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
): Promise<{ error: string } | Record<string, never>> {
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

  // Extract amenities before Zod (multi-value field)
  const amenities = formData.getAll('amenities') as string[]

  const rawUpdate = Object.fromEntries(formData)

  const parsed = createCourseSchema.safeParse({ ...rawUpdate, amenities })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { lat: _lat, lng: _lng, ...courseData } = parsed.data
  await db
    .update(courses)
    .set({ ...courseData, photos, updatedAt: new Date() })
    .where(eq(courses.id, courseId))

  revalidatePath('/partner/course')
  revalidatePath('/partner/dashboard')
  return {}
}
