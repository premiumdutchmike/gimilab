import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance, getLedgerHistory } from '@/lib/credits/ledger'
import { LedgerTable } from '@/components/ledger-table'

export const metadata = { title: 'Credits — OneGolf' }

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Note: getCreditBalance excludes expired credits (expires_at < NOW()).
  // The balance and ledger history will reconcile correctly only when
  // the expire-credits cron (/api/cron/expire-credits) inserts CREDIT_EXPIRY
  // debit rows. Without those rows, expired grants would show in history but
  // not reduce the balance.
  const [balance, ledgerEntries] = await Promise.all([
    getCreditBalance(user.id),
    getLedgerHistory(user.id, 50),
  ])

  const entries = ledgerEntries.map((e) => ({
    id: e.id,
    type: e.type,
    amount: e.amount,
    description: e.notes,
    createdAt: e.createdAt,
    expiresAt: e.expiresAt,
  }))

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Credits</h1>

        {/* Balance summary card */}
        <div
          className="rounded-xl border border-white/10 p-6 mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ background: '#0f1923' }}
        >
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">
              Available Balance
            </p>
            <p
              className="text-6xl font-bold leading-none"
              style={{ color: '#4ade80', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {balance}
            </p>
            <p className="text-white/40 text-sm mt-2">credits available</p>
          </div>

          <Link
            href="/credits/topup"
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
            style={{ background: '#4ade80', color: '#090f1a' }}
          >
            Top Up Credits
          </Link>
        </div>

        {/* Transaction history */}
        <h2 className="text-lg font-semibold text-white mb-4">Transaction History</h2>

        {entries.length === 0 ? (
          <div
            className="rounded-xl border border-white/10 p-10 text-center"
            style={{ background: '#0f1923' }}
          >
            <p className="text-white/40 text-sm">No transactions yet.</p>
            <p className="text-white/25 text-xs mt-1">
              Credits will appear here once your subscription activates.
            </p>
          </div>
        ) : (
          <LedgerTable entries={entries} />
        )}
      </div>
    </main>
  )
}
