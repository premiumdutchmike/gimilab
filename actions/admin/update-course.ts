// actions/admin/update-course.ts
'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from './require-admin'

export async function updateCourseFields(
  courseId: string,
  fields: {
    name?: string
    description?: string
    address?: string
    holes?: number
    baseCreditCost?: number
    payoutRate?: string
  }
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await db.update(courses).set({ ...fields, updatedAt: new Date() }).where(eq(courses.id, courseId))
    revalidatePath(`/admin/courses/${courseId}`)
    revalidatePath('/admin/courses')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Update failed' }
  }
}

export async function setCourseStatus(
  courseId: string,
  status: 'active' | 'suspended'
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await db.update(courses).set({ status, updatedAt: new Date() }).where(eq(courses.id, courseId))
    revalidatePath(`/admin/courses/${courseId}`)
    revalidatePath('/admin/courses')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Status update failed' }
  }
}
