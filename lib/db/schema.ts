import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  decimal,
  date,
  time,
  timestamp,
  jsonb,
  check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ─── Subscription Tiers (static config) ────────────────────────────────────
export const subscriptionTiers = pgTable('subscription_tiers', {
  id: text('id').primaryKey(), // 'casual' | 'core' | 'heavy'
  name: text('name').notNull(),
  monthlyPriceCents: integer('monthly_price_cents').notNull(),
  monthlyCredits: integer('monthly_credits').notNull(),
  stripePriceId: text('stripe_price_id').notNull(),
})

// ─── Users ──────────────────────────────────────────────────────────────────
// id matches Supabase Auth user id
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // = Supabase Auth user id
  email: text('email').unique().notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  subscriptionTier: text('subscription_tier'), // 'casual' | 'core' | 'heavy' | null
  subscriptionStatus: text('subscription_status'), // 'active' | 'cancelled' | 'past_due'
  stripeSubscriptionId: text('stripe_subscription_id'),
  homeZip: text('home_zip'),
  notificationPrefs: jsonb('notification_prefs').$type<{
    email: boolean
    push: boolean
    sms: boolean
  }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Partners ───────────────────────────────────────────────────────────────
export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id).notNull(),
  businessName: text('business_name').notNull(),
  stripeConnectId: text('stripe_connect_id').unique(),
  stripeConnectStatus: text('stripe_connect_status'), // 'pending' | 'active' | 'restricted'
  status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'suspended'
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by'), // admin user id
  onboardingComplete:     boolean('onboarding_complete').default(false).notNull(),
  stripeConnectAccountId: text('stripe_connect_account_id'),
  tierVerifiedAt:         timestamp('tier_verified_at', { withTimezone: true }),
  verificationStatus:     text('verification_status').default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Payout Transfers (batched Stripe transfers to partners) ─────────────────
export const payoutTransfers = pgTable('payout_transfers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  stripeTransferId: text('stripe_transfer_id').unique(), // null until Stripe confirms
  amountCents: integer('amount_cents').notNull(),
  bookingCount: integer('booking_count').notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'COMPLETED' | 'FAILED'
  failedReason: text('failed_reason'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Courses ─────────────────────────────────────────────────────────────────
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  address: text('address').notNull(),
  lat: decimal('lat', { precision: 9, scale: 6 }),
  lng: decimal('lng', { precision: 9, scale: 6 }),
  holes: integer('holes').default(18),
  baseCreditCost: integer('base_credit_cost').notNull(),
  creditFloor: integer('credit_floor'),    // admin-set minimum
  creditCeiling: integer('credit_ceiling'), // admin-set maximum
  photos: text('photos').array(),
  amenities: text('amenities').array(),
  avgRating: decimal('avg_rating', { precision: 3, scale: 2 }),
  status: text('status').default('pending').notNull(), // 'pending' | 'active' | 'suspended'
  payoutRate: decimal('payout_rate', { precision: 4, scale: 3 }), // e.g. 0.65
  rackRateCents:     integer('rack_rate_cents'),    // partner's walk-up price (self-reported)
  gimmelabRateCents: integer('gimmelab_rate_cents'), // our price (must be ≥10% off rack)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Tee Time Blocks (partner-defined recurring inventory rules) ─────────────
export const teeTimeBlocks = pgTable('tee_time_blocks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  dayOfWeek: integer('day_of_week').array().notNull(), // [0=Sun, 1=Mon, ...]
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  slotsPerInterval: integer('slots_per_interval').default(1),
  creditOverride: integer('credit_override'), // overrides course base credit cost if set
  validFrom: date('valid_from').notNull(),
  validUntil: date('valid_until'), // null = ongoing
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Tee Time Slots (materialized individual bookable slots) ─────────────────
export const teeTimeSlots = pgTable('tee_time_slots', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  blockId: uuid('block_id').references(() => teeTimeBlocks.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id).notNull(), // denormalized
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  status: text('status').default('AVAILABLE').notNull(), // 'AVAILABLE' | 'BOOKED' | 'RELEASED' | 'EXPIRED'
  creditCost: integer('credit_cost').notNull(), // calculated at slot generation time
  bookingId: uuid('booking_id'), // set when booked (self-referential via bookings)
  releaseAt: timestamp('release_at', { withTimezone: true }).notNull(), // = slot datetime - 48 hours
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id).notNull(),
  slotId: uuid('slot_id').references(() => teeTimeSlots.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id).notNull(), // denormalized
  creditCost: integer('credit_cost').notNull(), // snapshot at booking time
  status: text('status').notNull(), // 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancellationReason: text('cancellation_reason'),
  refundAmount: integer('refund_amount'), // credits refunded on cancellation
  qrCode: text('qr_code'), // unique check-in code
  payoutStatus: text('payout_status').default('PENDING'), // 'PENDING' | 'PROCESSED' | 'HELD'
  payoutAmountCents: integer('payout_amount_cents'), // actual $ paid to course
  partnerEarningsCents: integer('partner_earnings_cents'), // snapshotted at booking time
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }), // set when partner scans QR
  payoutTransferId: uuid('payout_transfer_id').references(() => payoutTransfers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Credit Ledger (immutable — NEVER update rows) ───────────────────────────
export const creditLedger = pgTable('credit_ledger', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(), // positive = credit, negative = debit
  type: text('type').notNull(), // SUBSCRIPTION_GRANT | BOOKING_DEBIT | TOP_UP_PURCHASE | BOOKING_REFUND | ADMIN_ADJUSTMENT | CREDIT_EXPIRY | BONUS_GRANT
  referenceId: text('reference_id'), // booking_id, subscription_id, or Stripe invoice ID
  notes: text('notes'), // required for ADMIN_ADJUSTMENT
  expiresAt: timestamp('expires_at', { withTimezone: true }), // null = never expires
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  // DO NOT add updatedAt — ledger rows are immutable
})

// ─── Ratings ─────────────────────────────────────────────────────────────────
export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid('booking_id').references(() => bookings.id).unique().notNull(), // one rating per booking
  userId: uuid('user_id').references(() => users.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id).notNull(), // denormalized
  score: integer('score').notNull(), // 1-5
  comment: text('comment'),
  aiSummary: text('ai_summary'), // AI-generated insight
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Verification Queue ──────────────────────────────────────────────────────
export const verificationQueue = pgTable('verification_queue', {
  id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  courseId:  uuid('course_id').references(() => courses.id).notNull(),
  reason:    text('reason').notNull(), // 'gimmelab_rate_above_cap' | 'rack_rate_discrepancy' | 'low_rack_rate'
  status:    text('status').default('open').notNull(), // 'open' | 'resolved'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Relations ───────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  partner: one(partners, { fields: [users.id], references: [partners.userId] }),
  bookings: many(bookings),
  creditLedger: many(creditLedger),
  ratings: many(ratings),
}))

export const partnersRelations = relations(partners, ({ one, many }) => ({
  user: one(users, { fields: [partners.userId], references: [users.id] }),
  courses: many(courses),
  payoutTransfers: many(payoutTransfers),
}))

export const payoutTransfersRelations = relations(payoutTransfers, ({ one, many }) => ({
  partner: one(partners, { fields: [payoutTransfers.partnerId], references: [partners.id] }),
  bookings: many(bookings),
}))

export const coursesRelations = relations(courses, ({ one, many }) => ({
  partner: one(partners, { fields: [courses.partnerId], references: [partners.id] }),
  teeTimeBlocks: many(teeTimeBlocks),
  teeTimeSlots: many(teeTimeSlots),
  bookings: many(bookings),
  ratings: many(ratings),
}))

export const teeTimeBlocksRelations = relations(teeTimeBlocks, ({ one, many }) => ({
  course: one(courses, { fields: [teeTimeBlocks.courseId], references: [courses.id] }),
  slots: many(teeTimeSlots),
}))

export const teeTImeSlotsRelations = relations(teeTimeSlots, ({ one }) => ({
  block: one(teeTimeBlocks, { fields: [teeTimeSlots.blockId], references: [teeTimeBlocks.id] }),
  course: one(courses, { fields: [teeTimeSlots.courseId], references: [courses.id] }),
  booking: one(bookings, { fields: [teeTimeSlots.bookingId], references: [bookings.id] }),
}))

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  slot: one(teeTimeSlots, { fields: [bookings.slotId], references: [teeTimeSlots.id] }),
  course: one(courses, { fields: [bookings.courseId], references: [courses.id] }),
  rating: one(ratings, { fields: [bookings.id], references: [ratings.bookingId] }),
  payoutTransfer: one(payoutTransfers, { fields: [bookings.payoutTransferId], references: [payoutTransfers.id] }),
}))

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  user: one(users, { fields: [creditLedger.userId], references: [users.id] }),
}))

export const ratingsRelations = relations(ratings, ({ one }) => ({
  booking: one(bookings, { fields: [ratings.bookingId], references: [bookings.id] }),
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
  course: one(courses, { fields: [ratings.courseId], references: [courses.id] }),
}))

export const verificationQueueRelations = relations(verificationQueue, ({ one }) => ({
  course: one(courses, { fields: [verificationQueue.courseId], references: [courses.id] }),
}))

// ─── TypeScript Types ─────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Partner = typeof partners.$inferSelect
export type NewPartner = typeof partners.$inferInsert
export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert
export type TeeTimeBlock = typeof teeTimeBlocks.$inferSelect
export type NewTeeTimeBlock = typeof teeTimeBlocks.$inferInsert
export type TeeTimeSlot = typeof teeTimeSlots.$inferSelect
export type NewTeeTimeSlot = typeof teeTimeSlots.$inferInsert
export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
export type CreditLedgerEntry = typeof creditLedger.$inferSelect
export type NewCreditLedgerEntry = typeof creditLedger.$inferInsert
export type Rating = typeof ratings.$inferSelect
export type NewRating = typeof ratings.$inferInsert
export type PayoutTransfer = typeof payoutTransfers.$inferSelect
export type NewPayoutTransfer = typeof payoutTransfers.$inferInsert
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect
export type VerificationQueue = typeof verificationQueue.$inferSelect
export type NewVerificationQueue = typeof verificationQueue.$inferInsert
export type VerificationStatus = 'pending' | 'verified' | 'flagged'

export type LedgerEntryType =
  | 'SUBSCRIPTION_GRANT'
  | 'BOOKING_DEBIT'
  | 'BOOKING_REFUND'
  | 'TOP_UP_PURCHASE'
  | 'ADMIN_ADJUSTMENT'
  | 'CREDIT_EXPIRY'
  | 'BONUS_GRANT'

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'RELEASED' | 'EXPIRED'
export type CourseStatus = 'pending' | 'active' | 'suspended'
export type PartnerStatus = 'pending' | 'approved' | 'suspended'
export type SubscriptionTierKey = 'casual' | 'core' | 'heavy'
