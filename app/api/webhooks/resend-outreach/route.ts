import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'
import { outreachEmails, outreachProspects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[resend-outreach] RESEND_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const rawBody = await request.text()

  const wh = new Webhook(webhookSecret)
  let event: { type?: string; data?: { email_id?: string } }

  try {
    event = wh.verify(rawBody, {
      'svix-id': request.headers.get('svix-id') ?? '',
      'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
      'svix-signature': request.headers.get('svix-signature') ?? '',
    }) as { type?: string; data?: { email_id?: string } }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const resendEmailId = event.data?.email_id

  if (!resendEmailId) {
    return NextResponse.json({ ok: true })
  }

  if (event.type === 'email.opened') {
    await db
      .update(outreachEmails)
      .set({ openedAt: new Date() })
      .where(eq(outreachEmails.resendEmailId, resendEmailId))
  }

  if (event.type === 'email.bounced') {
    const [email] = await db
      .update(outreachEmails)
      .set({ status: 'bounced' })
      .where(eq(outreachEmails.resendEmailId, resendEmailId))
      .returning({ prospectId: outreachEmails.prospectId })

    if (email?.prospectId) {
      await db
        .update(outreachProspects)
        .set({ status: 'bounced', updatedAt: new Date() })
        .where(eq(outreachProspects.id, email.prospectId))
    }
  }

  return NextResponse.json({ ok: true })
}
