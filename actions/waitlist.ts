'use server'

import { db } from '@/lib/db'
import { waitlist } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import WaitlistConfirmation from '@/emails/waitlist-confirmation'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'GL-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function joinWaitlist(_prev: unknown, formData: FormData) {
  const email = formData.get('email')?.toString().trim().toLowerCase()
  const name = formData.get('name')?.toString().trim()
  const ref = formData.get('ref')?.toString().trim() || null

  if (!email || !name) {
    return { error: 'Name and email are required.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  // Check if already on waitlist
  const existing = await db
    .select({ id: waitlist.id, referralCode: waitlist.referralCode })
    .from(waitlist)
    .where(eq(waitlist.email, email))
    .limit(1)

  if (existing.length > 0) {
    return { success: true, referralCode: existing[0].referralCode, alreadyExists: true }
  }

  const referralCode = generateReferralCode()

  await db.insert(waitlist).values({
    email,
    name,
    referralCode,
    referredBy: ref,
  })

  // Send confirmation email (fire-and-forget)
  const firstName = name.split(' ')[0] || name
  sendEmail({
    to: email,
    subject: "You're on the Gimmelab waitlist",
    react: WaitlistConfirmation({ firstName, referralCode }),
  })

  return { success: true, referralCode }
}

export async function completeWaitlistProfile(_prev: unknown, formData: FormData) {
  const email = formData.get('email')?.toString().trim().toLowerCase()
  const roundsPerMonth = formData.get('roundsPerMonth')?.toString()
  const city = formData.get('city')?.toString().trim()

  if (!email) return { error: 'Missing email.' }

  await db
    .update(waitlist)
    .set({
      roundsPerMonth: roundsPerMonth || null,
      city: city || null,
    })
    .where(eq(waitlist.email, email))

  return { success: true }
}
