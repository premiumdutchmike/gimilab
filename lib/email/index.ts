import { Resend } from 'resend'
import type { ReactElement } from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Gimmelab <noreply@gimmelab.com>'

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: ReactElement
}): Promise<void> {
  // Silently skip in dev if no API key set
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_placeholder')) {
    console.log(`[email] skipped (no key): "${subject}" → ${to}`)
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, react })
  } catch (err) {
    // Never fail the caller over an email
    console.error('[email] send failed:', err)
  }
}
