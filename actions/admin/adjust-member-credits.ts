// actions/admin/adjust-member-credits.ts
'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { creditLedger } from '@/lib/db/schema'
import { requireAdmin } from './require-admin'

export async function adjustMemberCredits(
  userId: string,
  amount: number,
  notes: string
): Promise<{ error?: string }> {
  if (!notes.trim()) return { error: 'Notes are required for admin adjustments' }
  if (amount === 0) return { error: 'Amount cannot be zero' }
  try {
    await requireAdmin()
    await db.insert(creditLedger).values({
      userId,
      amount,
      type: 'ADMIN_ADJUSTMENT',
      notes,
    })
    revalidatePath(`/admin/members/${userId}`)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Adjustment failed' }
  }
}
