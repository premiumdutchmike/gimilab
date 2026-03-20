import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const TYPE_LABELS: Record<string, string> = {
  SUBSCRIPTION_GRANT: 'Monthly Grant',
  BOOKING_DEBIT: 'Booking',
  BOOKING_REFUND: 'Refund',
  TOP_UP_PURCHASE: 'Top-up Purchase',
  ADMIN_ADJUSTMENT: 'Adjustment',
  CREDIT_EXPIRY: 'Expired',
  BONUS_GRANT: 'Bonus',
}

function formatDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

interface LedgerTableProps {
  entries: Array<{
    id: string
    type: string
    amount: number
    description: string | null
    createdAt: Date | string
    expiresAt: Date | string | null
  }>
}

export function LedgerTable({ entries }: LedgerTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50 text-xs uppercase tracking-widest">Date</TableHead>
              <TableHead className="text-white/50 text-xs uppercase tracking-widest">Type</TableHead>
              <TableHead className="text-white/50 text-xs uppercase tracking-widest text-right">Amount</TableHead>
              <TableHead className="text-white/50 text-xs uppercase tracking-widest">Description</TableHead>
              <TableHead className="text-white/50 text-xs uppercase tracking-widest">Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="text-white/70 font-mono text-sm">
                  {formatDate(entry.createdAt)}
                </TableCell>
                <TableCell className="text-white text-sm">
                  {TYPE_LABELS[entry.type] ?? entry.type}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className="font-mono font-semibold text-sm"
                    style={{ color: entry.amount >= 0 ? '#4ade80' : '#f87171' }}
                  >
                    {entry.amount >= 0 ? '+' : ''}{entry.amount}
                  </span>
                </TableCell>
                <TableCell className="text-white/50 text-sm max-w-xs truncate">
                  {entry.description ?? '—'}
                </TableCell>
                <TableCell className="text-white/40 font-mono text-sm">
                  {entry.expiresAt ? formatDate(entry.expiresAt) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-white/10 p-4"
            style={{ background: '#0f1923' }}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-white text-sm font-medium">
                {TYPE_LABELS[entry.type] ?? entry.type}
              </span>
              <span
                className="font-mono font-semibold text-sm"
                style={{ color: entry.amount >= 0 ? '#4ade80' : '#f87171' }}
              >
                {entry.amount >= 0 ? '+' : ''}{entry.amount}
              </span>
            </div>
            <p className="text-white/40 text-xs font-mono">{formatDate(entry.createdAt)}</p>
            {entry.description && (
              <p className="text-white/50 text-xs mt-1">{entry.description}</p>
            )}
            {entry.expiresAt && (
              <p className="text-white/30 text-xs mt-1">
                Expires {formatDate(entry.expiresAt)}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
