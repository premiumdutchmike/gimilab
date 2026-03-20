import { db, DbTransaction } from '@/lib/db'
import { creditLedger, users } from '@/lib/db/schema'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'
import type { LedgerEntryType } from '@/lib/db/schema'

// ─── Balance ─────────────────────────────────────────────────────────────────
// NEVER read a balance column — always compute from ledger SUM
export async function getCreditBalance(userId: string): Promise<number> {
  const result = await db
    .select({ balance: sql<number>`COALESCE(SUM(${creditLedger.amount}), 0)` })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.userId, userId),
        or(
          isNull(creditLedger.expiresAt),
          gt(creditLedger.expiresAt, new Date())
        )
      )
    )

  return Number(result[0]?.balance ?? 0)
}

// ─── Debit (used inside booking transaction) ──────────────────────────────────
// Must be called inside a db.transaction() — uses tx for the balance check so
// the read and write are in the same snapshot, preventing overdraft under concurrency.
export async function debitCredits(
  userId: string,
  amount: number,
  bookingId: string,
  tx: DbTransaction
): Promise<void> {
  // Balance check inside the transaction context (same snapshot as the debit insert)
  const result = await tx
    .select({ balance: sql<number>`COALESCE(SUM(${creditLedger.amount}), 0)` })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.userId, userId),
        or(
          isNull(creditLedger.expiresAt),
          gt(creditLedger.expiresAt, new Date())
        )
      )
    )

  const balance = Number(result[0]?.balance ?? 0)
  if (balance < amount) {
    throw new Error('INSUFFICIENT_CREDITS')
  }

  await tx.insert(creditLedger).values({
    userId,
    amount: -amount,
    type: 'BOOKING_DEBIT' satisfies LedgerEntryType,
    referenceId: bookingId as unknown as undefined,
    notes: null,
    expiresAt: null, // debits don't expire
  })
}

// ─── Refund (on cancellation) ─────────────────────────────────────────────────
export async function refundCredits(
  userId: string,
  amount: number,
  bookingId: string
): Promise<void> {
  await db.insert(creditLedger).values({
    userId,
    amount,
    type: 'BOOKING_REFUND' satisfies LedgerEntryType,
    referenceId: bookingId as unknown as undefined,
    notes: `Refund for booking ${bookingId}`,
    expiresAt: null,
  })
}

// ─── Grant subscription credits ───────────────────────────────────────────────
export async function grantSubscriptionCredits(
  userId: string,
  amount: number,
  notes?: string
): Promise<void> {
  await db.insert(creditLedger).values({
    userId,
    amount,
    type: 'SUBSCRIPTION_GRANT' satisfies LedgerEntryType,
    notes: notes ?? null,
    expiresAt: null,
  })
}

// ─── Grant bonus credits ──────────────────────────────────────────────────────
export async function grantBonusCredits(
  userId: string,
  amount: number,
  notes: string,
  expiryDays = 60
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  await db.insert(creditLedger).values({
    userId,
    amount,
    type: 'BONUS_GRANT' satisfies LedgerEntryType,
    notes,
    expiresAt,
  })
}

// ─── Top-up purchase ──────────────────────────────────────────────────────────
export async function recordTopUpPurchase(
  userId: string,
  amount: number,
  notes?: string
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 90) // top-ups expire in 90 days

  await db.insert(creditLedger).values({
    userId,
    amount,
    type: 'TOP_UP_PURCHASE' satisfies LedgerEntryType,
    notes: notes ?? null,
    expiresAt,
  })
}

// ─── Admin adjustment ─────────────────────────────────────────────────────────
export async function adminAdjustCredits(
  userId: string,
  amount: number,
  notes: string // required for admin adjustments
): Promise<void> {
  if (!notes?.trim()) {
    throw new Error('Notes are required for admin credit adjustments')
  }

  await db.insert(creditLedger).values({
    userId,
    amount,
    type: 'ADMIN_ADJUSTMENT' satisfies LedgerEntryType,
    notes,
    expiresAt: null,
  })
}

// ─── Ledger history (for /credits page) ──────────────────────────────────────
export async function getLedgerHistory(userId: string, limit = 50) {
  return db
    .select()
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(sql`${creditLedger.createdAt} DESC`)
    .limit(limit)
}
