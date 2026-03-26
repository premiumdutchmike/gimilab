import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { outreachProspects } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import ProspectsTable from './prospects-table'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Prospects — Gimmelab Admin' }

export default async function ProspectsPage() {
  const prospects = await db
    .select({
      id: outreachProspects.id,
      courseName: outreachProspects.courseName,
      courseType: outreachProspects.courseType,
      holes: outreachProspects.holes,
      tier: outreachProspects.tier,
      status: outreachProspects.status,
      rackRateMin: outreachProspects.rackRateMin,
      rackRateMax: outreachProspects.rackRateMax,
      estimatedMonthlyEarn: outreachProspects.estimatedMonthlyEarn,
      email: outreachProspects.email,
      gmName: outreachProspects.gmName,
    })
    .from(outreachProspects)
    .orderBy(desc(outreachProspects.createdAt))

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>
            Prospects
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>
            {prospects.length} total · Select to enrich or generate emails
          </p>
        </div>
        <a href="/admin/outreach/discover" style={{ background: '#a855f7', color: '#fff', textDecoration: 'none', padding: '8px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 2 }}>
          + Discover
        </a>
      </div>
      <ProspectsTable prospects={prospects} />
    </div>
  )
}
