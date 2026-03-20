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
  if (!user) return { error: 'Not authenticated.' } as const
  const partner = await getPartnerByUserId(user.id)
  if (!partner) return { error: 'Partner account not found.' } as const
  return { partner } as const
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
  if (auth.error) return { error: auth.error }

  const course = await getPartnerCourse(auth.partner.id)
  if (!course) return { error: 'No course found.' }

  const dayOfWeek = formData.getAll('dayOfWeek') as string[]
  const rawCreditOverride = formData.get('creditOverride')
  const creditOverride =
    rawCreditOverride === null || rawCreditOverride === '' ? undefined : rawCreditOverride

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
  if (auth.error) return { error: auth.error }

  const block = await fetchBlock(blockId)
  if (!block) return { error: 'Block not found.' }

  const course = await getPartnerCourse(auth.partner.id)
  if (!course || block.courseId !== course.id) return { error: 'Not authorized.' }

  const dayOfWeek = formData.getAll('dayOfWeek') as string[]
  const rawCreditOverride = formData.get('creditOverride')
  const creditOverride =
    rawCreditOverride === null || rawCreditOverride === '' ? undefined : rawCreditOverride

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
  if (auth.error) return { error: auth.error }

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
  if (auth.error) return { error: auth.error }

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
