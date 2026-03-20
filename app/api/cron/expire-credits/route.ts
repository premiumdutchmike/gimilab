import { NextRequest, NextResponse } from 'next/server'
import { processMonthlyRolloverExpiry } from '@/lib/credits/expiry'

// Runs daily at midnight UTC: 0 0 * * *
// Expires credits that exceed rollover limits for each subscriber
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processMonthlyRolloverExpiry()

  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
  })
}
