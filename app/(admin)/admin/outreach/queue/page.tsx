import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { outreachEmails, outreachProspects } from '@/lib/db/schema'
import { eq, and, lte } from 'drizzle-orm'
import QueueCard from './queue-card'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Queue — Gimmelab Admin' }

export default async function QueuePage() {
  const now = new Date()

  const emails = await db
    .select({
      id: outreachEmails.id,
      touchNumber: outreachEmails.touchNumber,
      subject: outreachEmails.subject,
      body: outreachEmails.body,
      scheduledSendAt: outreachEmails.scheduledSendAt,
      prospectId: outreachEmails.prospectId,
      courseName: outreachProspects.courseName,
    })
    .from(outreachEmails)
    .innerJoin(outreachProspects, eq(outreachEmails.prospectId, outreachProspects.id))
    .where(
      and(
        eq(outreachEmails.status, 'draft'),
        lte(outreachEmails.scheduledSendAt, now),
      ),
    )
    .limit(5)

  return (
    <div style={{ padding: '32px 28px', maxWidth: 780, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--linen)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>
          Approval Queue
        </h1>
        <p style={{ fontSize: 14, color: 'var(--stone)' }}>
          {emails.length === 0
            ? 'No emails ready — check back tomorrow or generate new ones.'
            : `${emails.length} email${emails.length === 1 ? '' : 's'} ready for review.`}
        </p>
      </div>

      {emails.map(email => (
        <QueueCard key={email.id} email={email} onDone={() => {}} />
      ))}
    </div>
  )
}
