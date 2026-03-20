import { NextRequest, NextResponse } from 'next/server'
import { generateSlotsForDays } from '@/lib/booking/generate-slots'

// Runs daily at 2am UTC: 0 2 * * *
// Materializes the next 14 days of individual bookable slots from partner blocks
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await generateSlotsForDays(14)

  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
  })
}
