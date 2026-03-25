import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, creditLedger } from '@/lib/db/schema'
import { eq, sql, and, gt } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import CreditsExpiring from '@/emails/credits-expiring'
import { getCreditBalance } from '@/lib/credits/ledger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find active Casual members (no rollover — all credits expire at billing date)
    // Also Core/Heavy members with credits that exceed rollover cap
    const activeUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        tier: users.subscriptionTier,
      })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, 'active'),
          sql`${users.subscriptionTier} IS NOT NULL`
        )
      )

    let sent = 0

    for (const user of activeUsers) {
      if (!user.email || !user.tier) continue

      const balance = await getCreditBalance(user.id)
      if (balance <= 0) continue

      // For Casual: all credits expire (no rollover)
      // For Core/Heavy: only excess over rollover cap expires
      let expiringCredits = 0
      if (user.tier === 'casual') {
        expiringCredits = balance
      } else if (user.tier === 'core') {
        const rolloverCap = Math.floor(170 * 0.10) // 10% of 170
        expiringCredits = Math.max(0, balance - rolloverCap)
      } else if (user.tier === 'heavy') {
        const rolloverCap = Math.floor(250 * 0.15) // 15% of 250
        expiringCredits = Math.max(0, balance - rolloverCap)
      }

      if (expiringCredits <= 0) continue

      // Approximate expiration date (next billing cycle = ~3 days from now for this cron)
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 3)
      const expDateStr = expirationDate.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })

      await sendEmail({
        to: user.email,
        subject: `${expiringCredits} credits expiring soon — book before ${expDateStr}`,
        react: CreditsExpiring({
          memberName: user.fullName ?? user.email,
          expiringCredits,
          expirationDate: expDateStr,
          currentBalance: balance,
          tier: user.tier,
          daysLeft: 3,
        }),
      })
      sent++
    }

    return NextResponse.json({ sent, total: activeUsers.length })
  } catch (err) {
    console.error('[cron/send-expiry-warnings] error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
