'use server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { courses, verificationQueue } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  courseId:          z.string().uuid(),
  rackRateCents:     z.coerce.number().min(1),
  gimmelabRateCents: z.coerce.number().min(1),
})

export async function saveRate(_prev: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/apply/signup')

  const raw: Record<string, unknown> = {}
  for (const [k, v] of formData.entries()) raw[k] = v

  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { courseId, rackRateCents, gimmelabRateCents } = parsed.data

  const discountPct = ((rackRateCents - gimmelabRateCents) / rackRateCents) * 100
  if (discountPct < 10) return { error: 'Gimmelab rate must be at least 10% below rack rate' }

  const payoutRate = discountPct >= 30 ? 0.90 : discountPct >= 20 ? 0.87 : 0.85

  await db.update(courses)
    .set({ rackRateCents, gimmelabRateCents, payoutRate: String(payoutRate), updatedAt: new Date() })
    .where(eq(courses.id, courseId))

  if (gimmelabRateCents > 15000) {
    await db.insert(verificationQueue).values({ courseId, reason: 'gimmelab_rate_above_cap' })
  }
  if (rackRateCents < 3000) {
    await db.insert(verificationQueue).values({ courseId, reason: 'low_rack_rate' })
  }

  redirect('/partner/onboarding/payout')
}
