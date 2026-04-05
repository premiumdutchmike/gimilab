'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { userFavoriteCourses } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

const courseIdSchema = z.string().uuid()

export async function toggleFavorite(
  courseId: string,
): Promise<{ favorited: boolean; error?: string }> {
  const parsed = courseIdSchema.safeParse(courseId)
  if (!parsed.success) {
    return { favorited: false, error: 'Invalid course.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { favorited: false, error: 'Not authenticated.' }

  try {
    const existing = await db
      .select({ id: userFavoriteCourses.id })
      .from(userFavoriteCourses)
      .where(
        and(
          eq(userFavoriteCourses.userId, user.id),
          eq(userFavoriteCourses.courseId, parsed.data),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      await db
        .delete(userFavoriteCourses)
        .where(
          and(
            eq(userFavoriteCourses.userId, user.id),
            eq(userFavoriteCourses.courseId, parsed.data),
          ),
        )
      revalidatePath('/courses')
      return { favorited: false }
    }

    await db.insert(userFavoriteCourses).values({
      userId: user.id,
      courseId: parsed.data,
    })
    revalidatePath('/courses')
    return { favorited: true }
  } catch (err) {
    console.error('[favorites] toggleFavorite failed:', err)
    return { favorited: false, error: 'Something went wrong.' }
  }
}

export async function getUserFavorites(userId: string): Promise<Set<string>> {
  const parsed = z.string().uuid().safeParse(userId)
  if (!parsed.success) return new Set<string>()

  try {
    const rows = await db
      .select({ courseId: userFavoriteCourses.courseId })
      .from(userFavoriteCourses)
      .where(eq(userFavoriteCourses.userId, parsed.data))
    return new Set(rows.map((r) => r.courseId))
  } catch (err) {
    console.error('[favorites] getUserFavorites failed:', err)
    return new Set<string>()
  }
}
