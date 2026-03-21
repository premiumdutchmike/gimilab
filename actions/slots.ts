'use server'

import { db } from '@/lib/db'
import { teeTimeSlots, courses } from '@/lib/db/schema'
import { and, eq, lt, gte, sql } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

export type CourseSlot = {
  id: string
  startTime: string   // "HH:MM:SS"
  creditCost: number
}

export type CourseWithSlots = {
  courseId: string
  courseName: string
  courseAddress: string
  holes: number
  amenities: string[]
  baseCreditCost: number
  slots: CourseSlot[]
}

export async function getSlotsByDate(
  date: string,
  courseId?: string,
  timeOfDay?: string,
): Promise<{ data?: CourseWithSlots[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  try {
    const conditions = [
      eq(teeTimeSlots.date, date),
      eq(teeTimeSlots.status, 'AVAILABLE'),
      eq(courses.status, 'active'),
    ]

    if (courseId) conditions.push(eq(teeTimeSlots.courseId, courseId))

    if (timeOfDay === 'early') {
      conditions.push(lt(teeTimeSlots.startTime, '08:00:00'))
    } else if (timeOfDay === 'morning') {
      conditions.push(gte(teeTimeSlots.startTime, '08:00:00'))
      conditions.push(lt(teeTimeSlots.startTime, '11:00:00'))
    } else if (timeOfDay === 'midday') {
      conditions.push(gte(teeTimeSlots.startTime, '11:00:00'))
      conditions.push(lt(teeTimeSlots.startTime, '14:00:00'))
    } else if (timeOfDay === 'afternoon') {
      conditions.push(gte(teeTimeSlots.startTime, '14:00:00'))
    }

    const rows = await db
      .select({
        slotId: teeTimeSlots.id,
        startTime: teeTimeSlots.startTime,
        creditCost: teeTimeSlots.creditCost,
        courseId: courses.id,
        courseName: courses.name,
        courseAddress: courses.address,
        holes: courses.holes,
        amenities: courses.amenities,
        baseCreditCost: courses.baseCreditCost,
      })
      .from(teeTimeSlots)
      .innerJoin(courses, eq(teeTimeSlots.courseId, courses.id))
      .where(and(...conditions))
      .orderBy(courses.name, teeTimeSlots.startTime)

    // Group by course
    const map = new Map<string, CourseWithSlots>()
    for (const r of rows) {
      if (!map.has(r.courseId)) {
        map.set(r.courseId, {
          courseId: r.courseId,
          courseName: r.courseName,
          courseAddress: r.courseAddress,
          holes: r.holes ?? 18,
          amenities: r.amenities ?? [],
          baseCreditCost: r.baseCreditCost,
          slots: [],
        })
      }
      map.get(r.courseId)!.slots.push({
        id: r.slotId,
        startTime: r.startTime,
        creditCost: r.creditCost,
      })
    }

    return { data: Array.from(map.values()) }
  } catch {
    return { error: 'Failed to load tee times.' }
  }
}
