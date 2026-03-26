import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { outreachProspects, outreachEmails } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import ProspectDetail from './prospect-detail'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ prospectId: string }> }): Promise<Metadata> {
  const { prospectId } = await params
  const [p] = await db.select({ courseName: outreachProspects.courseName }).from(outreachProspects).where(eq(outreachProspects.id, prospectId))
  return { title: `${p?.courseName ?? 'Prospect'} — Gimmelab Admin` }
}

export default async function ProspectDetailPage({ params }: { params: Promise<{ prospectId: string }> }) {
  const { prospectId } = await params

  const [prospect] = await db
    .select()
    .from(outreachProspects)
    .where(eq(outreachProspects.id, prospectId))

  if (!prospect) notFound()

  const emails = await db
    .select({
      id: outreachEmails.id,
      touchNumber: outreachEmails.touchNumber,
      subject: outreachEmails.subject,
      body: outreachEmails.body,
      status: outreachEmails.status,
      sentAt: outreachEmails.sentAt,
      openedAt: outreachEmails.openedAt,
      scheduledSendAt: outreachEmails.scheduledSendAt,
    })
    .from(outreachEmails)
    .where(eq(outreachEmails.prospectId, prospectId))

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <a href="/admin/outreach/prospects" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>
          &larr; Prospects
        </a>
      </div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
          {prospect.courseName}
        </h1>
        <p style={{ fontSize: 14, color: '#888' }}>
          {prospect.courseType ?? 'type unknown'} · {prospect.holes ? `${prospect.holes} holes` : 'holes unknown'} · {prospect.tier}
        </p>
      </div>
      <ProspectDetail prospect={prospect} emails={emails} />
    </div>
  )
}
