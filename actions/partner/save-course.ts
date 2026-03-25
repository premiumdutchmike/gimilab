'use server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { courses, partners } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  courseId:    z.string().uuid().optional(),
  name:        z.string().min(2, 'Course name required'),
  courseType:  z.string().min(1, 'Course type required'),
  holes:       z.coerce.number().min(9).max(36),
  par:         z.coerce.number().min(27).max(72),
  address:     z.string().min(2, 'Address required'),
  city:        z.string().min(2, 'City required'),
  state:       z.string().min(2, 'State required'),
  zip:         z.string().min(5, 'ZIP required'),
  phone:       z.string().optional().default(''),
  website:     z.string().optional().default(''),
  description: z.string().max(280).optional().default(''),
})

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
}

export async function saveCourseProfile(_prev: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/apply/signup')

  const partner = await db.query.partners.findFirst({ where: eq(partners.userId, user.id) })
  if (!partner) redirect('/partner/apply/signup')

  const raw: Record<string, unknown> = {}
  for (const [k, v] of formData.entries()) raw[k] = v

  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const fullAddress = `${d.address}, ${d.city}, ${d.state} ${d.zip}`

  if (d.courseId) {
    await db.update(courses).set({
      name: d.name,
      description: d.description || null,
      address: fullAddress,
      holes: d.holes,
      updatedAt: new Date(),
    }).where(eq(courses.id, d.courseId))
  } else {
    await db.insert(courses).values({
      partnerId:     partner.id,
      name:          d.name,
      slug:          toSlug(d.name),
      description:   d.description || null,
      address:       fullAddress,
      holes:         d.holes,
      baseCreditCost: 50,
      status:        'pending',
    })
  }

  redirect('/partner/onboarding/pricing')
}
