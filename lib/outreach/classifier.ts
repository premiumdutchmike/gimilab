import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

export interface ClassificationResult {
  courseType: 'municipal' | 'semi_private' | 'public' | 'private' | 'resort' | null
  holes: '9' | '18' | '27' | '36' | null
  isDrivingRange: boolean
  skipReason: string | null
  hook: string | null
}

const ClassificationSchema = z.object({
  courseType: z
    .enum(['municipal', 'semi_private', 'public', 'private', 'resort'])
    .nullable()
    .describe('Type of golf course based on ownership and access model'),
  holes: z
    .enum(['9', '18', '27', '36'])
    .nullable()
    .describe('Number of holes on the course'),
  isDrivingRange: z
    .boolean()
    .describe('True if this is a driving range or practice facility with no tee times'),
  skipReason: z
    .string()
    .nullable()
    .describe('If isDrivingRange is true, brief reason to skip. Otherwise null.'),
  hook: z
    .string()
    .nullable()
    .describe(
      'One sentence personalisation hook for a cold outreach email. Reference the course by name. Null if isDrivingRange is true.',
    ),
})

export async function classifyCourse(
  courseName: string,
  bodyText: string,
  googleName: string,
): Promise<ClassificationResult> {
  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: ClassificationSchema,
    prompt: `You are classifying a golf course for a partner outreach program.

Course name: ${courseName}
Google Places name: ${googleName}
Website text excerpt (first 2000 chars):
${bodyText.slice(0, 2000)}

Classify this course. Focus on:
- courseType: municipal (city/county owned), semi_private (membership + public times), public (fully open), private (members only), resort (hotel/resort attached)
- holes: how many holes (9, 18, 27, or 36)
- isDrivingRange: true ONLY if this is a driving range or practice facility with no tee times whatsoever
- hook: a one-sentence reason why this course is a natural fit for Gimmelab (fills dead off-peak inventory). Reference the course name. Keep it factual.`,
  })

  return object as ClassificationResult
}
