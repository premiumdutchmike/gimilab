'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { ratings, bookings, courses } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function submitRating(
  bookingId: string,
  score: number,
  comment?: string,
): Promise<{ error?: string }> {
  if (score < 1 || score > 5) return { error: 'Score must be between 1 and 5.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Verify the booking belongs to this user and is in a rateable state
  const [booking] = await db
    .select({ courseId: bookings.courseId, status: bookings.status, userId: bookings.userId })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) return { error: 'Booking not found.' }
  if (booking.userId !== user.id) return { error: 'Not authorized.' }
  if (booking.status === 'CANCELLED') return { error: 'Cannot rate a cancelled booking.' }

  try {
    await db.insert(ratings).values({
      bookingId,
      userId: user.id,
      courseId: booking.courseId,
      score,
      comment: comment?.trim() || null,
    })

    // Update course average rating
    await db
      .update(courses)
      .set({
        avgRating: sql`(SELECT ROUND(AVG(score)::numeric, 2) FROM ratings WHERE course_id = ${booking.courseId})`,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, booking.courseId))

    revalidatePath('/rounds')
    return {}
  } catch (err) {
    // Unique constraint on bookingId means already rated
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return { error: 'You have already rated this round.' }
    }
    return { error: 'Failed to submit rating.' }
  }
}
