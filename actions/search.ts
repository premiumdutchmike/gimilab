'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { teeTimeSlots, courses } from '@/lib/db/schema'
import { and, eq, gte, lt } from 'drizzle-orm'
import { bookTeeTime } from '@/lib/booking/book-tee-time'

export type TimeFilter = 'any' | 'early' | 'morning' | 'midday' | 'afternoon'

export interface SlotItem {
  slotId: string
  startTime: string // 'HH:MM:SS'
  creditCost: number
  available: boolean
}

export interface SlotGroup {
  courseId: string
  courseName: string
  courseAddress: string
  holes: number
  amenities: string[] | null
  baseCreditCost: number
  slots: SlotItem[]
}

export async function fetchAvailableSlots(
  date: string,
  courseId?: string,
  timeFilter?: TimeFilter,
): Promise<{ error: string } | { groups: SlotGroup[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Build time-range conditions
  const timeConds: ReturnType<typeof gte | typeof lt>[] = []
  if (timeFilter === 'early')     timeConds.push(lt(teeTimeSlots.startTime, '08:00:00'))
  if (timeFilter === 'morning')   { timeConds.push(gte(teeTimeSlots.startTime, '08:00:00')); timeConds.push(lt(teeTimeSlots.startTime, '11:00:00')) }
  if (timeFilter === 'midday')    { timeConds.push(gte(teeTimeSlots.startTime, '11:00:00')); timeConds.push(lt(teeTimeSlots.startTime, '14:00:00')) }
  if (timeFilter === 'afternoon') timeConds.push(gte(teeTimeSlots.startTime, '14:00:00'))

  const rows = await db
    .select({
      slotId:        teeTimeSlots.id,
      startTime:     teeTimeSlots.startTime,
      slotStatus:    teeTimeSlots.status,
      slotCreditCost: teeTimeSlots.creditCost,
      courseId:      courses.id,
      courseName:    courses.name,
      courseAddress: courses.address,
      holes:         courses.holes,
      amenities:     courses.amenities,
      baseCreditCost: courses.baseCreditCost,
    })
    .from(teeTimeSlots)
    .innerJoin(courses, eq(teeTimeSlots.courseId, courses.id))
    .where(and(
      eq(teeTimeSlots.date, date),
      eq(courses.status, 'active'),
      courseId ? eq(teeTimeSlots.courseId, courseId) : undefined,
      ...timeConds,
    ))
    .orderBy(courses.name, teeTimeSlots.startTime)

  const courseMap = new Map<string, SlotGroup>()
  for (const row of rows) {
    if (!courseMap.has(row.courseId)) {
      courseMap.set(row.courseId, {
        courseId:      row.courseId,
        courseName:    row.courseName,
        courseAddress: row.courseAddress,
        holes:         row.holes ?? 18,
        amenities:     row.amenities,
        baseCreditCost: row.baseCreditCost,
        slots: [],
      })
    }
    courseMap.get(row.courseId)!.slots.push({
      slotId:     row.slotId,
      startTime:  row.startTime,
      creditCost: row.slotCreditCost,
      available:  row.slotStatus === 'AVAILABLE',
    })
  }

  return { groups: Array.from(courseMap.values()) }
}

export async function bookSlotConfirm(slotId: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  try {
    await bookTeeTime(user.id, slotId)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'SLOT_NOT_AVAILABLE')  return { error: 'This slot was just taken. Please choose another time.' }
    if (msg === 'INSUFFICIENT_CREDITS') return { error: 'Not enough credits to book this slot.' }
    return { error: 'Something went wrong. Please try again.' }
  }
}
