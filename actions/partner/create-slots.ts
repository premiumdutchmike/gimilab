'use server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { courses, teeTimeBlocks, teeTimeSlots } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
  courseId:  z.string().uuid(),
  days:      z.string(),
  startTime: z.string(),
  endTime:   z.string(),
  interval:  z.coerce.number(),
  startDate: z.string(),
  weeks:     z.coerce.number(),
})

export async function createInitialSlots(_prev: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/apply/signup')

  const raw: Record<string, unknown> = {}
  for (const [k, v] of formData.entries()) raw[k] = v

  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const d = parsed.data

  const course = await db.query.courses.findFirst({ where: eq(courses.id, d.courseId) })
  if (!course) return { error: 'Course not found' }

  const creditCost = course.gimmelabRateCents
    ? Math.round(course.gimmelabRateCents / 100)
    : course.baseCreditCost

  const selectedDays = d.days.split(',').map(Number).filter(n => !isNaN(n))
  if (selectedDays.length === 0) return { error: 'Select at least one day' }

  const [block] = await db.insert(teeTimeBlocks).values({
    courseId:        d.courseId,
    dayOfWeek:       selectedDays,
    startTime:       d.startTime,
    endTime:         d.endTime,
    slotsPerInterval: 1,
    validFrom:       d.startDate,
    isActive:        true,
  }).returning()

  const slotsToInsert: (typeof teeTimeSlots.$inferInsert)[] = []
  const [startH, startM] = d.startTime.split(':').map(Number)
  const [endH, endM] = d.endTime.split(':').map(Number)
  const endMins = endH * 60 + endM

  for (let i = 0; i < d.weeks * 7; i++) {
    const cur = new Date(d.startDate + 'T12:00:00')
    cur.setDate(cur.getDate() + i)
    if (!selectedDays.includes(cur.getDay())) continue
    const dateStr = cur.toISOString().split('T')[0]

    for (let m = startH * 60 + startM; m < endMins; m += d.interval) {
      const h = String(Math.floor(m / 60)).padStart(2, '0')
      const min = String(m % 60).padStart(2, '0')
      const slotTime = `${h}:${min}`
      const slotDt = new Date(`${dateStr}T${slotTime}:00`)
      slotsToInsert.push({
        blockId:    block.id,
        courseId:   d.courseId,
        date:       dateStr,
        startTime:  slotTime,
        status:     'AVAILABLE',
        creditCost,
        releaseAt:  new Date(slotDt.getTime() - 48 * 60 * 60 * 1000),
      })
    }
  }

  for (let i = 0; i < slotsToInsert.length; i += 500) {
    await db.insert(teeTimeSlots).values(slotsToInsert.slice(i, i + 500))
  }

  redirect('/partner/onboarding/live')
}

export async function skipSlots() {
  redirect('/partner/onboarding/live')
}
