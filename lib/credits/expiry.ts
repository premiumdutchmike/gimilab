import { db } from '@/lib/db'
import { creditLedger, users } from '@/lib/db/schema'
import { and, eq, lt, sql } from 'drizzle-orm'
import { getCreditBalance } from './ledger'
import { TIER_ROLLOVER_MAX } from '@/lib/stripe/client'

// Called by /api/cron/expire-credits at midnight UTC daily
// Inserts CREDIT_EXPIRY ledger entries for credits that exceed rollover limits
export async function processMonthlyRolloverExpiry(): Promise<{ processed: number }> {
  // Get all active subscribers
  const activeUsers = await db
    .select({ id: users.id, subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.subscriptionStatus, 'active'))

  let processed = 0

  for (const user of activeUsers) {
    const tier = user.subscriptionTier as keyof typeof TIER_ROLLOVER_MAX | null
    if (!tier || !TIER_ROLLOVER_MAX[tier]) continue

    const balance = await getCreditBalance(user.id)
    const maxRollover = TIER_ROLLOVER_MAX[tier]

    if (balance > maxRollover) {
      const expireAmount = balance - maxRollover

      await db.insert(creditLedger).values({
        userId: user.id,
        amount: -expireAmount,
        type: 'CREDIT_EXPIRY',
        notes: `Monthly rollover expiry — balance ${balance} exceeds rollover max ${maxRollover} for ${tier} tier`,
        expiresAt: null,
      })

      processed++
    }
  }

  return { processed }
}
