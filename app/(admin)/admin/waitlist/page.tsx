import { getFullWaitlist, getWaitlistStats } from '@/lib/admin/queries'
import WaitlistExport from './waitlist-export'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Waitlist — Gimmelab Admin' }

export default async function AdminWaitlistPage() {
  const [entries, stats] = await Promise.all([
    getFullWaitlist(),
    getWaitlistStats(),
  ])

  // Frequency breakdown
  const freqMap: Record<string, number> = {}
  for (const e of entries) {
    const key = e.roundsPerMonth ?? 'Unknown'
    freqMap[key] = (freqMap[key] ?? 0) + 1
  }

  return (
    <div className="awl-wrap">
      {/* Header */}
      <div className="awl-header">
        <div>
          <h1 className="awl-title">Waitlist</h1>
          <p className="awl-sub">{stats.total} total signups · {stats.today} today</p>
        </div>
        <WaitlistExport entries={entries.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))} />
      </div>

      {/* Stats row */}
      <div className="awl-stats">
        <div className="awl-stat-card">
          <div className="awl-stat-label">Total</div>
          <div className="awl-stat-value">{stats.total}</div>
        </div>
        <div className="awl-stat-card">
          <div className="awl-stat-label">Today</div>
          <div className="awl-stat-value awl-amber">{stats.today}</div>
        </div>
        {Object.entries(freqMap).sort().map(([freq, count]) => (
          <div key={freq} className="awl-stat-card">
            <div className="awl-stat-label">{freq === 'Unknown' ? 'No answer' : `${freq}/mo`}</div>
            <div className="awl-stat-value">{count}</div>
          </div>
        ))}
      </div>

      {/* Top cities */}
      {stats.topCities.length > 0 && (
        <div className="awl-cities">
          <span className="awl-cities-label">Top cities:</span>
          {stats.topCities.map(c => (
            <span key={c.city} className="awl-city-tag">{c.city} ({c.count})</span>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="awl-table-card">
        <div className="awl-table-head">
          <span style={{ flex: 2 }}>Name</span>
          <span style={{ flex: 2 }}>Email</span>
          <span style={{ width: 80 }}>Plays</span>
          <span style={{ width: 130 }}>City</span>
          <span style={{ width: 100 }}>Code</span>
          <span style={{ width: 140 }}>Referred by</span>
          <span style={{ width: 50, textAlign: 'center' }}>Refs</span>
          <span style={{ width: 80, textAlign: 'right' }}>Joined</span>
        </div>
        {entries.map(w => {
          const joined = new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return (
            <div key={w.id} className="awl-table-row">
              <span style={{ flex: 2, fontWeight: 600, color: '#111' }}>{w.name}</span>
              <span style={{ flex: 2, color: 'rgba(0,0,0,0.5)', fontSize: 12 }}>{w.email}</span>
              <span style={{ width: 80 }}>{w.roundsPerMonth ?? '\u2014'}</span>
              <span style={{ width: 130 }}>{w.city ?? '\u2014'}</span>
              <span style={{ width: 100, fontSize: 11, fontFamily: 'monospace', color: 'rgba(0,0,0,0.4)' }}>{w.referralCode}</span>
              <span style={{ width: 140, fontSize: 12, color: w.referredByName ? '#BF7B2E' : 'rgba(0,0,0,0.2)' }}>
                {w.referredByName ?? '\u2014'}
              </span>
              <span style={{ width: 50, textAlign: 'center', fontWeight: w.referralCount > 0 ? 700 : 400, color: w.referralCount > 0 ? '#BF7B2E' : 'rgba(0,0,0,0.2)' }}>
                {w.referralCount}
              </span>
              <span style={{ width: 80, textAlign: 'right', color: 'rgba(0,0,0,0.4)' }}>{joined}</span>
            </div>
          )
        })}
        {entries.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'rgba(0,0,0,0.3)', fontSize: 13 }}>
            No waitlist signups yet.
          </div>
        )}
      </div>

      <style>{`
        .awl-wrap { padding: 32px 28px 48px; font-family: var(--font-inter), 'Inter', sans-serif; }
        .awl-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .awl-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; color: #111; margin: 0; }
        .awl-sub { font-size: 13px; color: rgba(0,0,0,0.4); margin-top: 4px; }

        .awl-stats { display: flex; gap: 16px; margin-bottom: 20px; }
        .awl-stat-card {
          background: #fff; border: 1px solid #e8e8e8; padding: 16px 20px; min-width: 100px;
        }
        .awl-stat-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(0,0,0,0.4); margin-bottom: 8px;
        }
        .awl-stat-value {
          font-weight: 900; font-size: 32px; letter-spacing: -0.04em; color: #111; line-height: 1;
        }
        .awl-stat-value.awl-amber { color: #BF7B2E; }

        .awl-cities { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .awl-cities-label { font-size: 11px; font-weight: 700; color: rgba(0,0,0,0.4); text-transform: uppercase; letter-spacing: 0.1em; }
        .awl-city-tag { font-size: 12px; font-weight: 600; color: #111; background: #f5f5f5; padding: 4px 12px; border-radius: 2px; }

        .awl-table-card { background: #fff; border: 1px solid #e8e8e8; }
        .awl-table-head {
          display: flex; align-items: center; padding: 12px 20px;
          border-bottom: 1px solid #e8e8e8;
          font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: rgba(0,0,0,0.35);
        }
        .awl-table-row {
          display: flex; align-items: center; padding: 12px 20px;
          border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #111;
        }
        .awl-table-row:last-child { border-bottom: none; }
        .awl-table-row:hover { background: #fafafa; }

        @media (max-width: 1100px) {
          .awl-stats { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  )
}
