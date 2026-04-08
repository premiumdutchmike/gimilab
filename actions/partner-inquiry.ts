'use server'

import { db } from '@/lib/db'
import { partnerInquiries } from '@/lib/db/schema'
import { sendEmail } from '@/lib/email'
import PartnerInquiryConfirmation from '@/emails/partner-inquiry-confirmation'
import PartnerInquiryNotification from '@/emails/partner-inquiry-notification'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  course: z.string().min(1, 'Course name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  message: z.string().optional(),
})

export async function submitPartnerInquiry(data: {
  name: string
  title: string
  course: string
  email: string
  phone: string
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { name, title, course, email, phone, message } = parsed.data

  try {
    // Save to DB
    await db.insert(partnerInquiries).values({
      name,
      title: title || null,
      courseName: course,
      email,
      phone: phone || null,
      message: message || null,
    })

    // Send confirmation email to the course contact
    await sendEmail({
      to: email,
      subject: `We got your inquiry, ${name.split(' ')[0]} — next steps`,
      react: PartnerInquiryConfirmation({ name, courseName: course }),
    })

    // Notify the Gimmelab team
    const teamEmail = process.env.TEAM_NOTIFICATION_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? 'team@gimmelab.com'
    await sendEmail({
      to: teamEmail,
      subject: `New partner inquiry: ${course}`,
      react: PartnerInquiryNotification({ name, title, courseName: course, email, phone, message }),
    })

    return { success: true }
  } catch (err) {
    console.error('[partner-inquiry] failed:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
