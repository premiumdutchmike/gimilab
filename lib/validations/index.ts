import { z } from 'zod'

// ─── Booking ──────────────────────────────────────────────────────────────────
export const bookTeeTimeSchema = z.object({
  slotId: z.string().uuid(),
})

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().max(500).optional(),
})

// ─── Partner / Course ─────────────────────────────────────────────────────────
export const createCourseSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  address: z.string().min(5),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  holes: z.enum(['9', '18']).transform(Number),
  baseCreditCost: z.number().int().min(10).max(500),
  amenities: z.array(z.string()).optional(),
})

export const createTeeTimeBlockSchema = z.object({
  courseId: z.string().uuid(),
  dayOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotsPerInterval: z.number().int().min(1).max(10).default(1),
  creditOverride: z.number().int().min(10).max(500).optional(),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// ─── AI Booking Search ────────────────────────────────────────────────────────
export const aiSearchInputSchema = z.object({
  query: z.string().min(1).max(500),
})

// Structured output from AI intent extraction
export const aiSearchIntentSchema = z.object({
  dateRange: z
    .object({
      start: z.string().describe('ISO date YYYY-MM-DD'),
      end: z.string().describe('ISO date YYYY-MM-DD'),
    })
    .optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'any']).optional(),
  maxCredits: z.number().int().positive().optional(),
  holes: z.union([z.literal(9), z.literal(18)]).optional(),
  maxDistanceMiles: z.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
})

export type AiSearchIntent = z.infer<typeof aiSearchIntentSchema>

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminCreditAdjustmentSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(-10000).max(10000),
  notes: z.string().min(5).max(500),
})

export const approvePartnerSchema = z.object({
  partnerId: z.string().uuid(),
  payoutRate: z.number().min(0.1).max(1.0).default(0.65),
})

// ─── Auth / Onboarding ────────────────────────────────────────────────────────
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
})

export const subscriptionTierSchema = z.enum(['casual', 'core', 'heavy'])

// ─── Rating ───────────────────────────────────────────────────────────────────
export const createRatingSchema = z.object({
  bookingId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})
