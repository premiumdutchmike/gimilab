import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { outreachEmails } from '@/lib/db/schema'
import { eq, and, lte, count } from 'drizzle-orm'
import { Resend } from 'resend'

// Runs daily at 07:00 UTC: 0 7 * * *
// Notifies Dutch of emails ready for approval in the queue
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const [result] = await db
    .select({ count: count() })
    .from(outreachEmails)
    .where(
      and(
        eq(outreachEmails.status, 'draft'),
        lte(outreachEmails.scheduledSendAt, now),
      ),
    )

  const queueCount = result?.count ?? 0

  if (queueCount > 0) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const adminEmail = process.env.ADMIN_EMAIL ?? 'info@dutchmike.com'

    await resend.emails.send({
      from: 'Gimmelab System <noreply@gimmelab.com>',
      to: adminEmail,
      subject: `${queueCount} outreach email${queueCount === 1 ? '' : 's'} ready for approval`,
      text: `You have ${queueCount} partner outreach email${queueCount === 1 ? '' : 's'} waiting in the approval queue.\n\nReview them at: https://gimmelab.com/admin/outreach/queue`,
    })
  }

  return NextResponse.json({ queueCount, timestamp: now.toISOString() })
}
