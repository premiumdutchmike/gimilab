import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, TIER_CREDITS } from '@/lib/stripe/client'
import { db } from '@/lib/db'
import { users, creditLedger } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// Stripe requires the raw body for signature verification
export const runtime = 'nodejs'

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const subscriptionId = (invoice as unknown as { subscription: string }).subscription

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))

  if (!user) {
    // Fallback: look up by userId in invoice metadata
    const invoiceObj = invoice as unknown as { metadata?: { userId?: string } }
    const userId = invoiceObj.metadata?.userId
    if (!userId) {
      console.error(`No user found for Stripe customer ${customerId}`)
      return
    }
    // retry lookup by userId
    const [userById] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId as unknown as typeof users.id))
    if (!userById) {
      console.error(`No user found for userId ${userId}`)
      return
    }
    return handleInvoicePaidForUser(userById, invoice, subscriptionId)
  }

  return handleInvoicePaidForUser(user, invoice, subscriptionId)
}

async function handleInvoicePaidForUser(
  user: typeof users.$inferSelect,
  invoice: Stripe.Invoice,
  subscriptionId: string
) {
  // Idempotency: skip if this invoice was already processed
  const existing = await db
    .select({ id: creditLedger.id })
    .from(creditLedger)
    .where(and(eq(creditLedger.userId, user.id), eq(creditLedger.referenceId, invoice.id)))
    .limit(1)

  if (existing.length > 0) {
    console.log(`invoice.paid ${invoice.id} already processed for user ${user.id} — skipping`)
    return
  }

  const lineItem = invoice.lines?.data?.[0]
  const priceId = (lineItem as unknown as { price?: { id: string } })?.price?.id
  const tier = Object.entries({
    casual: process.env.STRIPE_CASUAL_PRICE_ID,
    core: process.env.STRIPE_CORE_PRICE_ID,
    heavy: process.env.STRIPE_HEAVY_PRICE_ID,
  }).find(([, id]) => id === priceId)?.[0] as keyof typeof TIER_CREDITS | undefined

  const credits = tier ? TIER_CREDITS[tier] : 100

  await db.transaction(async (tx) => {
    await tx.insert(creditLedger).values({
      userId: user.id,
      amount: credits,
      type: 'SUBSCRIPTION_GRANT',
      referenceId: invoice.id,
      notes: `Monthly grant for ${tier ?? 'unknown'} tier — invoice ${invoice.id}`,
      expiresAt: null,
    })

    if (tier) {
      await tx
        .update(users)
        .set({
          subscriptionTier: tier,
          subscriptionStatus: 'active',
          stripeSubscriptionId: subscriptionId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
    }
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const status = subscription.status

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))

  if (!user) return

  const mappedStatus =
    status === 'active' ? 'active'
    : status === 'canceled' ? 'cancelled'
    : status === 'past_due' ? 'past_due'
    : status

  await db
    .update(users)
    .set({ subscriptionStatus: mappedStatus, updatedAt: new Date() })
    .where(eq(users.id, user.id))
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))

  if (!user) return

  await db
    .update(users)
    .set({
      subscriptionStatus: 'cancelled',
      subscriptionTier: null,
      stripeSubscriptionId: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))

  if (!user) return

  await db
    .update(users)
    .set({
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed': {
        // Update subscription status to past_due via customer ID
        const failedInvoice = event.data.object as Stripe.Invoice
        const customerId = failedInvoice.customer as string
        await db
          .update(users)
          .set({ subscriptionStatus: 'past_due', updatedAt: new Date() })
          .where(eq(users.stripeCustomerId, customerId))
        break
      }
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      default:
        // Unhandled event type — not an error
        break
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
