import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { TOUCH_TEMPLATES, TemplateVars } from './templates'

export interface GeneratedEmail {
  subject: string
  body: string
}

const EmailSchema = z.object({
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Plain text email body'),
})

export async function generateTouchEmail(
  touchNumber: 1 | 2 | 3,
  vars: TemplateVars,
): Promise<GeneratedEmail> {
  const template = TOUCH_TEMPLATES[touchNumber]
  if (!template) throw new Error(`Invalid touch number: ${touchNumber}`)

  const greeting = vars.gmName ? `Hi ${vars.gmName.split(' ')[0]},` : 'Hi there,'

  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: EmailSchema,
    prompt: `You are writing a cold outreach email on behalf of Dutch, founder of Gimmelab.

Gimmelab is a credit-based golf tee time subscription platform launching in the Philadelphia metro area. Partner courses list their off-peak tee times, members book with credits, and courses receive monthly payouts with no setup fee or monthly cost.

Email details:
- Touch number: ${touchNumber} of 3
- Greeting: ${greeting}
- Course name: ${vars.courseName}
- GM name: ${vars.gmName ?? 'unknown'}
- Est. monthly earnings: ${vars.estimatedMonthlyEarn ? `$${vars.estimatedMonthlyEarn.toLocaleString()}` : 'unknown'}
- Avg rack rate: ${vars.rackRateAvg ? `$${vars.rackRateAvg}` : 'unknown'}
- Personalisation hook: ${vars.hook ?? 'none'}

Subject guidance: ${template.subjectHint}
Body guidance: ${template.bodyHint}

Write the email now. Use the greeting above. End every email with:
— Dutch
Gimmelab · gimmelab.com`,
  })

  return object as GeneratedEmail
}
