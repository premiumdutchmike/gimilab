'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { courses, creditLedger } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('NOT_AUTHENTICATED')
  if (user.user_metadata?.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}

export async function approveCourse(courseId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await db
      .update(courses)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(courses.id, courseId))
    revalidatePath('/admin/courses')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Failed to approve course.' }
  }
}

export async function rejectCourse(courseId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await db
      .update(courses)
      .set({ status: 'suspended', updatedAt: new Date() })
      .where(eq(courses.id, courseId))
    revalidatePath('/admin/courses')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Failed to reject course.' }
  }
}

export async function adminGrantCredits(
  userId: string,
  amount: number,
  notes: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    if (!notes.trim()) return { error: 'Notes are required for admin adjustments.' }
    await db.insert(creditLedger).values({
      userId,
      amount,
      type: 'ADMIN_ADJUSTMENT',
      notes,
      expiresAt: null,
    })
    revalidatePath('/admin/members')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Failed to adjust credits.' }
  }
}
