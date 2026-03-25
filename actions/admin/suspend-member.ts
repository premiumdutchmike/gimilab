// actions/admin/suspend-member.ts
'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from './require-admin'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function setMemberSuspended(
  userId: string,
  isSuspended: boolean
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    // Update DB
    await db.update(users).set({ isSuspended, updatedAt: new Date() }).where(eq(users.id, userId))
    // Sync to Supabase Auth metadata so proxy.ts can read it without a DB query
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { isSuspended },
    })
    revalidatePath(`/admin/members/${userId}`)
    revalidatePath('/admin/members')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Suspend failed' }
  }
}
