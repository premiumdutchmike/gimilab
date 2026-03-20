import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { teeTimeSlots } from '@/lib/db/schema'
import { and, eq, lte, sql } from 'drizzle-orm'

// Runs every hour: 0 * * * *
// Releases AVAILABLE slots where tee time is within 48 hours.
// Released slots are hidden from member view and returned to the course.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const result = await db
    .update(teeTimeSlots)
    .set({ status: 'RELEASED', updatedAt: now })
    .where(
      and(
        eq(teeTimeSlots.status, 'AVAILABLE'),
        lte(teeTimeSlots.releaseAt, now)
      )
    )

  return NextResponse.json({
    released: result.rowCount ?? 0,
    timestamp: now.toISOString(),
  })
}
