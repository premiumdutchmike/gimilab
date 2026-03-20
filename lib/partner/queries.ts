import { cache } from 'react'
import { db } from '@/lib/db'
import { partners, courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const getPartnerByUserId = cache(async function getPartnerByUserId(userId: string) {
  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.userId, userId))
    .limit(1)
  return rows[0] ?? null
})

export const getPartnerCourse = cache(async function getPartnerCourse(partnerId: string) {
  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.partnerId, partnerId))
    .limit(1)
  return rows[0] ?? null
})
