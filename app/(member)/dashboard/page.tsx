import { redirect } from 'next/navigation'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { signOut } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Dashboard — OneGolf' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id))
  const balance = await getCreditBalance(user.id)

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">
          Hey, {dbUser?.fullName?.split(' ')[0] ?? 'there'} 👋
        </h1>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Credit Balance</p>
          <p className="text-5xl font-bold text-green-400">{balance}</p>
          <p className="text-white/40 text-sm mt-1 capitalize">
            {dbUser?.subscriptionTier ?? '—'} plan
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Find a Tee Time</p>
          <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/30 text-sm">
            AI booking search coming soon…
          </div>
        </div>

        <form action={signOut}>
          <button type="submit" className="text-white/30 text-sm hover:text-white/50 underline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
