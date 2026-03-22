'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { courses, partners, bookings, teeTimeSlots, teeTimeBlocks } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { eq, and } from 'drizzle-orm'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import { createCourseSchema } from '@/lib/validations'
import { stripe } from '@/lib/stripe/client'

export async function initiateStripeConnect(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) return { error: 'Partner account not found.' }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const refreshUrl = `${baseUrl}/partner/settings?refresh=1`
  const returnUrl  = `${baseUrl}/partner/settings?connected=1`

  try {
    // Reuse existing Connect account if already created, otherwise create a new one
    let connectId = partner.stripeConnectId
    if (!connectId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      connectId = account.id
      await db
        .update(partners)
        .set({ stripeConnectId: connectId, stripeConnectStatus: 'pending', updatedAt: new Date() })
        .where(eq(partners.id, partner.id))
    }

    const accountLink = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return { url: accountLink.url }
  } catch (err) {
    console.error('[initiateStripeConnect]', err)
    return { error: 'Failed to start Stripe Connect. Please try again.' }
  }
}

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

export async function updateCoursePricing(
  courseId: string,
  baseCreditCost: number,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) return { error: 'Partner account not found.' }

  const [course] = await db.select({ id: courses.id, partnerId: courses.partnerId, creditFloor: courses.creditFloor, creditCeiling: courses.creditCeiling })
    .from(courses).where(eq(courses.id, courseId)).limit(1)

  if (!course || course.partnerId !== partner.id) return { error: 'Not authorized.' }
  if (baseCreditCost < 1) return { error: 'Must be at least 1 credit.' }
  if (course.creditFloor && baseCreditCost < course.creditFloor) return { error: `Below admin-set minimum of ${course.creditFloor} cr.` }
  if (course.creditCeiling && baseCreditCost > course.creditCeiling) return { error: `Above admin-set maximum of ${course.creditCeiling} cr.` }

  await db.update(courses).set({ baseCreditCost, updatedAt: new Date() }).where(eq(courses.id, courseId))
  revalidatePath('/partner/pricing')
  return {}
}

export async function updateBlockCreditOverride(
  blockId: string,
  creditOverride: number | null,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) return { error: 'Partner account not found.' }

  const [block] = await db
    .select({ id: teeTimeBlocks.id, courseId: teeTimeBlocks.courseId })
    .from(teeTimeBlocks)
    .where(eq(teeTimeBlocks.id, blockId))
    .limit(1)

  if (!block) return { error: 'Block not found.' }

  const [course] = await db.select({ partnerId: courses.partnerId })
    .from(courses).where(eq(courses.id, block.courseId)).limit(1)

  if (!course || course.partnerId !== partner.id) return { error: 'Not authorized.' }
  if (creditOverride !== null && creditOverride < 1) return { error: 'Must be at least 1 credit.' }

  await db.update(teeTimeBlocks).set({ creditOverride, updatedAt: new Date() }).where(eq(teeTimeBlocks.id, blockId))
  revalidatePath('/partner/pricing')
  return {}
}

export async function checkInBooking(
  code: string,
): Promise<{ error?: string; booking?: { memberName: string; courseName: string; date: string; time: string; players: number } }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const partner = await getPartnerByUserId(user.id)
  if (!partner) return { error: 'Partner account not found.' }

  const normalized = code.trim().toLowerCase()
  if (normalized.length < 8) return { error: 'Code must be at least 8 characters.' }

  // Look up booking by first 8 chars of qr_code (case-insensitive)
  const [row] = await db
    .select({
      bookingId: bookings.id,
      userId: bookings.userId,
      status: bookings.status,
      courseId: bookings.courseId,
      courseName: courses.name,
      partnerId: partners.id,
      slotDate: teeTimeSlots.date,
      slotStartTime: teeTimeSlots.startTime,
    })
    .from(bookings)
    .innerJoin(courses, eq(bookings.courseId, courses.id))
    .innerJoin(partners, eq(courses.partnerId, partners.id))
    .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
    .where(sql`LOWER(LEFT(${bookings.qrCode}, 8)) = ${normalized.slice(0, 8)}`)
    .limit(1)

  if (!row) return { error: 'Check-in code not found.' }
  if (row.partnerId !== partner.id) return { error: 'This booking is not for your course.' }
  if (row.status === 'CANCELLED') return { error: 'This booking was cancelled.' }
  if (row.status === 'COMPLETED') return { error: 'Already checked in.' }
  if (row.status !== 'CONFIRMED') return { error: 'Booking is not in a confirmable state.' }

  await db
    .update(bookings)
    .set({ status: 'COMPLETED', updatedAt: new Date() })
    .where(eq(bookings.id, row.bookingId))

  revalidatePath('/partner/checkin')
  revalidatePath('/partner/bookings')

  const [h, m] = row.slotStartTime.split(':').map(Number)
  const time = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
  const date = new Date(row.slotDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return { booking: { memberName: '', courseName: row.courseName, date, time, players: 1 } }
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
