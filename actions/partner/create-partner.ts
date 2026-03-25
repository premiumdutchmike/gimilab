'use server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, partners } from '@/lib/db/schema'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import PartnerWelcome from '@/emails/partner-welcome'

const schema = z.object({
  fullName: z.string().min(2, 'Name required'),
  email:    z.string().email('Valid email required'),
  password: z.string().min(8, 'Minimum 8 characters'),
})

export async function createPartnerAccount(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse({
    fullName: formData.get('fullName'),
    email:    formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { fullName, email, password } = parsed.data

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'partner' } },
  })
  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Signup failed. Try a different email.' }
  }

  await db.insert(users).values({ id: authData.user.id, email, fullName }).onConflictDoNothing()
  await db.insert(partners).values({
    userId: authData.user.id,
    businessName: fullName,
    onboardingComplete: false,
  })

  // Fire-and-forget welcome email
  sendEmail({
    to: email,
    subject: "Welcome to Gimmelab Partner — let's get you listed",
    react: PartnerWelcome({ partnerName: fullName, courseName: '' }),
  })

  redirect('/partner/onboarding/course')
}
