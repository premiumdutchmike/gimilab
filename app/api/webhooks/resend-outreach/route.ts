import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { outreachEmails, outreachProspects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body as { type?: string; data?: { email_id?: string } }
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
