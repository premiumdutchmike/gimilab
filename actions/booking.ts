'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bookTeeTime, cancelBooking } from '@/lib/booking/book-tee-time'

export async function bookSlot(slotId: string): Promise<{ error: string } | never> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  try {
    await bookTeeTime(user.id, slotId)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'SLOT_NOT_AVAILABLE') {
      return { error: 'This slot was just booked. Please choose another.' }
    }
    if (message === 'INSUFFICIENT_CREDITS') {
      return { error: 'Not enough credits to book this slot.' }
    }
    return { error: 'Something went wrong. Please try again.' }
  }

  redirect('/rounds')
}

export async function cancelSlot(
  bookingId: string,
  reason?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  try {
    await cancelBooking(bookingId, user.id, reason)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'BOOKING_NOT_FOUND') return { error: 'Booking not found.' }
    if (message === 'UNAUTHORIZED') return { error: 'Not authorized.' }
    if (message === 'BOOKING_NOT_CANCELLABLE') return { error: 'This booking cannot be cancelled.' }
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/rounds')
  return {}
}
