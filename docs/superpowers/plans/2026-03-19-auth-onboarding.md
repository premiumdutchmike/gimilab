# Auth + Subscription Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete sign-up-to-dashboard flow: pricing page → account creation → Stripe checkout → welcome screen → dashboard stub.

**Architecture:** Plan-first onboarding (user picks tier before signup). Supabase Auth handles email/password and Google OAuth. A Server Action creates the Stripe Customer and Checkout Session after account creation. The existing webhook handler grants credits on `invoice.paid` with an added idempotency guard.

**Tech Stack:** Next.js 16 App Router, Supabase Auth + SSR, Stripe SDK, Drizzle ORM, react-hook-form + Zod, shadcn/ui, Tailwind v4

**Spec:** `docs/superpowers/specs/2026-03-19-auth-onboarding-design.md`

---

## File Map

### Modified
- `lib/db/schema.ts` — change `credit_ledger.referenceId` from `uuid` to `text`
- `app/api/webhooks/stripe/route.ts` — add idempotency guard to `handleInvoicePaid`
- `proxy.ts` — add `/welcome` to public paths
- `app/layout.tsx` — update metadata title/description, add `dark` class to `<html>`

### Created
- `app/(public)/layout.tsx` — public route group layout (no auth required)
- `app/(public)/pricing/page.tsx` — Screen 1: stacked tier selection
- `app/(public)/signup/page.tsx` — Screen 2: create account
- `app/(public)/auth/callback/route.ts` — Google OAuth PKCE exchange + Stripe session
- `app/(public)/login/page.tsx` — returning user sign-in
- `app/(public)/welcome/page.tsx` — post-payment credit confirmation
- `app/(member)/layout.tsx` — member route group layout (auth required)
- `app/(member)/dashboard/page.tsx` — Screen 5: dashboard stub
- `actions/auth.ts` — Server Actions: signUpWithEmail, signInWithEmail, signInWithGoogle, createCheckoutSession
- `components/pricing-tier-row.tsx` — single selectable tier row
- `components/signup-form.tsx` — email/password + Google OAuth form
- `components/login-form.tsx` — email/password + Google sign-in form
- `components/welcome-credits.tsx` — client component that polls credit balance

---

## Task 1: Schema Change — referenceId uuid → text

**Why:** `handleInvoicePaid` stores Stripe invoice IDs (e.g. `in_xxx`) as `referenceId` for idempotency. Invoice IDs are strings, not UUIDs.

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Update referenceId column type**

In `lib/db/schema.ts`, find the `creditLedger` table and change:
```ts
// BEFORE
referenceId: uuid('reference_id'),

// AFTER
referenceId: text('reference_id'),
```

- [ ] **Step 2: Push schema to database**

```bash
cd /path/to/onegolf
npx drizzle-kit push
```
Expected: `[✓] Changes applied` — Supabase column type updated from uuid to text.

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "fix: change credit_ledger.reference_id to text for Stripe invoice IDs"
```

---

## Task 2: Webhook Idempotency Guard

**Why:** Stripe retries webhooks on failures. A duplicate `invoice.paid` delivery would insert a second `SUBSCRIPTION_GRANT` row and double the user's credits.

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Add idempotency check to handleInvoicePaid**

Replace the existing `handleInvoicePaid` function with:

```ts
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
```

Add `and` to the drizzle-orm import at the top:
```ts
import { eq, and } from 'drizzle-orm'
```

- [ ] **Step 2: Verify the file compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/stripe/route.ts
git commit -m "fix: add idempotency guard to handleInvoicePaid using invoice ID"
```

---

## Task 3: Update proxy.ts Public Paths

**Why:** `/welcome` must be public (accessible without role check) since users hit it right after Stripe payment before the webhook has finished setting `subscription_status`.

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Add /welcome to public paths**

In `proxy.ts`, change the `publicPaths` array:
```ts
// BEFORE
const publicPaths = ['/', '/pricing', '/about', '/partner', '/partner/apply', '/signup', '/login', '/auth']
const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith('/auth'))

// AFTER
const publicPaths = ['/', '/pricing', '/about', '/partner', '/partner/apply', '/signup', '/login', '/welcome']
const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith('/auth') || pathname.startsWith('/welcome'))
```

- [ ] **Step 2: Commit**

```bash
git add proxy.ts
git commit -m "fix: add /welcome to public paths in proxy.ts"
```

---

## Task 4: Update Root Layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update metadata and add dark class**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'OneGolf — Book Tee Times with Credits',
  description: 'Access top golf courses on a monthly credit subscription. Book tee times instantly.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "chore: update root layout metadata and enable dark mode"
```

---

## Task 5: Route Group Layouts

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(member)/layout.tsx`

- [ ] **Step 1: Create public layout**

Create `app/(public)/layout.tsx`:
```tsx
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

- [ ] **Step 2: Create member layout**

Create `app/(member)/layout.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/layout.tsx app/\(member\)/layout.tsx
git commit -m "feat: add route group layouts for public and member sections"
```

---

## Task 6: Server Actions

**Why:** All auth mutations must go through Server Actions, not client-side API calls.

**Files:**
- Create: `actions/auth.ts`

- [ ] **Step 1: Create actions/auth.ts**

```ts
'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe/client'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { signUpSchema, subscriptionTierSchema } from '@/lib/validations'
import type { SubscriptionTierKey } from '@/lib/db/schema'

export async function signUpWithEmail(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
    plan: formData.get('plan') as string,
  }

  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const tier = subscriptionTierSchema.safeParse(raw.plan).success
    ? (raw.plan as SubscriptionTierKey)
    : ('core' as SubscriptionTierKey)

  const supabase = await createSupabaseServerClient()

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: 'member',
      },
    },
  })

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      return { error: 'An account with this email already exists. Sign in instead.' }
    }
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: 'Signup failed. Please try again.' }
  }

  // Create user row
  await db.insert(users).values({
    id: authData.user.id,
    email: parsed.data.email,
    fullName: parsed.data.fullName,
  }).onConflictDoNothing()

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: parsed.data.email,
    name: parsed.data.fullName,
    metadata: { userId: authData.user.id },
  })

  // Link Stripe customer to user
  await db.update(users)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(users.id, authData.user.id))

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [{ price: STRIPE_PRICE_IDS[tier], quantity: 1 }],
    metadata: { userId: authData.user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?plan=${tier}`,
  })

  redirect(session.url!)
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  redirect('/dashboard')
}

export async function signInWithGoogle(plan: string) {
  const cookieStore = await cookies()
  const validPlan = subscriptionTierSchema.safeParse(plan).success ? plan : 'core'

  // Store chosen plan in cookie so /auth/callback can read it
  cookieStore.set('onegolf-pending-plan', validPlan, {
    maxAge: 60 * 60, // 1 hour
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return { error: 'Could not start Google sign-in. Please try again.' }
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: Verify the file compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add actions/auth.ts
git commit -m "feat: add auth server actions (signUp, signIn, Google OAuth, signOut)"
```

---

## Task 7: Auth Callback Route

**Why:** Handles the Google OAuth PKCE code exchange. Reads the pending plan cookie, creates the Stripe customer and checkout session, then redirects to Stripe.

**Files:**
- Create: `app/(public)/auth/callback/route.ts`

- [ ] **Step 1: Create the callback route handler**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe/client'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { subscriptionTierSchema } from '@/lib/validations'
import type { SubscriptionTierKey } from '@/lib/db/schema'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  const { user } = data
  const cookieStore = await cookies()

  // Set member role via admin client (service role)
  const adminSupabase = createSupabaseServiceClient()
  await adminSupabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: 'member' },
  })

  // Upsert user row
  await db.insert(users).values({
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  }).onConflictDoNothing()

  // Read pending plan from cookie
  const pendingPlan = cookieStore.get('onegolf-pending-plan')?.value
  const tier = subscriptionTierSchema.safeParse(pendingPlan).success
    ? (pendingPlan as SubscriptionTierKey)
    : ('core' as SubscriptionTierKey)

  // Get or create Stripe customer
  const [existingUser] = await db.select().from(users).where(eq(users.id, user.id))
  let customerId = existingUser?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: existingUser?.fullName ?? undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await db.update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, user.id))
  }

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: STRIPE_PRICE_IDS[tier], quantity: 1 }],
    metadata: { userId: user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?plan=${tier}`,
  })

  // Clear pending plan cookie
  cookieStore.delete('onegolf-pending-plan')

  return NextResponse.redirect(session.url!)
}
```

**Note:** `createSupabaseServiceClient` needs to be exported from `lib/supabase/server.ts`. Check the file — if it exports only `createSupabaseServerClient`, add:

```ts
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```
where `createClient` is imported from `@supabase/supabase-js`.

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/auth/callback/route.ts lib/supabase/server.ts
git commit -m "feat: add OAuth callback route with plan cookie handling and Stripe session creation"
```

---

## Task 8: Pricing Page

**Files:**
- Create: `components/pricing-tier-row.tsx`
- Create: `app/(public)/pricing/page.tsx`

- [ ] **Step 1: Create PricingTierRow component**

Create `components/pricing-tier-row.tsx`:
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface PricingTierRowProps {
  id: string
  name: string
  monthlyPriceCents: number
  monthlyCredits: number
  rolloverMax: number
  isPopular?: boolean
}

export function PricingTierRow({
  id,
  name,
  monthlyPriceCents,
  monthlyCredits,
  rolloverMax,
  isPopular,
}: PricingTierRowProps) {
  const router = useRouter()
  const price = monthlyPriceCents / 100

  return (
    <button
      onClick={() => router.push(`/signup?plan=${id}`)}
      className={`w-full flex items-center justify-between rounded-xl border p-5 text-left transition-colors hover:border-green-400/60 hover:bg-white/5 ${
        isPopular
          ? 'border-green-400 bg-green-400/5'
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="h-2 w-2 rounded-full bg-green-400" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{name}</span>
            {isPopular && (
              <Badge className="bg-green-400 text-black text-[10px] font-bold px-2 py-0.5">
                POPULAR
              </Badge>
            )}
          </div>
          <p className="text-sm text-white/50 mt-0.5">
            {monthlyCredits} credits · up to {rolloverMax} rollover
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-xl font-bold text-white">${price}</span>
        <span className="text-white/40 text-sm">/mo</span>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Create pricing page**

Create `app/(public)/pricing/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { subscriptionTiers } from '@/lib/db/schema'
import { PricingTierRow } from '@/components/pricing-tier-row'

export const metadata = {
  title: 'Plans — OneGolf',
}

export default async function PricingPage() {
  const tiers = await db.select().from(subscriptionTiers)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#090f1a' }}>
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Choose your plan
        </h1>
        <p className="text-white/50 text-center mb-10">
          Book tee times at top courses. Credits refresh monthly.
        </p>

        <div className="flex flex-col gap-3">
          {tiers
            .sort((a, b) => a.monthlyPriceCents - b.monthlyPriceCents)
            .map((tier) => (
              <PricingTierRow
                key={tier.id}
                id={tier.id}
                name={tier.name}
                monthlyPriceCents={tier.monthlyPriceCents}
                monthlyCredits={tier.monthlyCredits}
                rolloverMax={tier.rolloverMax}
                isPopular={tier.id === 'core'}
              />
            ))}
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          Cancel anytime. Credits roll over each month (up to your tier max).
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify dev server renders pricing page**

```bash
npm run dev
```
Open `http://localhost:3000/pricing` — expect 3 stacked tier rows, Core highlighted with green border.

- [ ] **Step 4: Commit**

```bash
git add components/pricing-tier-row.tsx app/\(public\)/pricing/page.tsx
git commit -m "feat: add pricing page with stacked tier rows"
```

---

## Task 9: Signup Page

**Files:**
- Create: `components/signup-form.tsx`
- Create: `app/(public)/signup/page.tsx`

- [ ] **Step 1: Create SignupForm component**

Create `components/signup-form.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpWithEmail, signInWithGoogle } from '@/actions/auth'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

export function SignupForm() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? 'core'
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', values.email)
      formData.set('password', values.password)
      formData.set('fullName', values.fullName)
      formData.set('plan', plan)
      const result = await signUpWithEmail(formData)
      if (result?.error) setServerError(result.error)
    })
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await signInWithGoogle(plan)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {serverError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <Button
        type="button"
        onClick={handleGoogle}
        disabled={isPending}
        className="w-full bg-green-400 hover:bg-green-300 text-black font-semibold"
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div>
          <Label htmlFor="fullName" className="text-white/70 text-sm mb-1.5">Full name</Label>
          <Input
            id="fullName"
            placeholder="Mike Johnson"
            {...register('fullName')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <Label htmlFor="email" className="text-white/70 text-sm mb-1.5">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="mike@example.com"
            {...register('email')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="password" className="text-white/70 text-sm mb-1.5">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="8+ characters"
            {...register('password')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 mt-1"
        >
          {isPending ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
    </div>
  )
}
```


- [ ] **Step 2: Create signup page**

Create `app/(public)/signup/page.tsx`:
```tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { SignupForm } from '@/components/signup-form'

const TIER_LABELS: Record<string, { name: string; price: string }> = {
  casual: { name: 'Casual', price: '$99/mo' },
  core: { name: 'Core', price: '$149/mo' },
  heavy: { name: 'Heavy', price: '$199/mo' },
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan = 'core' } = await searchParams
  const tier = TIER_LABELS[plan] ?? TIER_LABELS.core

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#090f1a' }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-sm text-green-400 mb-4">
            {tier.name} · {tier.price}
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-white/50 text-sm mt-1">Start booking tee times with credits</p>
        </div>

        <Suspense>
          <SignupForm />
        </Suspense>

        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-white/70 hover:text-white underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Test signup page renders**

Open `http://localhost:3000/signup?plan=core` — expect the "Core · $149/mo" chip, Google button, and email form.

- [ ] **Step 4: Commit**

```bash
git add components/signup-form.tsx app/\(public\)/signup/page.tsx
git commit -m "feat: add signup page with email/password and Google OAuth"
```

---

## Task 10: Login Page

**Files:**
- Create: `components/login-form.tsx`
- Create: `app/(public)/login/page.tsx`

- [ ] **Step 1: Create LoginForm component**

Create `components/login-form.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithEmail, signInWithGoogle } from '@/actions/auth'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
})
type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', values.email)
      formData.set('password', values.password)
      const result = await signInWithEmail(formData)
      if (result?.error) setServerError(result.error)
    })
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await signInWithGoogle('core')
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {serverError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <Button
        type="button"
        onClick={handleGoogle}
        disabled={isPending}
        className="w-full bg-green-400 hover:bg-green-300 text-black font-semibold"
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div>
          <Label htmlFor="email" className="text-white/70 text-sm mb-1.5">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="mike@example.com"
            {...register('email')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="password" className="text-white/70 text-sm mb-1.5">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Your password"
            {...register('password')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-white/40 hover:text-white/60"
            onClick={async () => {
              const email = (document.getElementById('email') as HTMLInputElement)?.value
              if (!email) return
              const { createBrowserClient } = await import('@supabase/ssr')
              const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              )
              await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
              })
              alert('Password reset email sent.')
            }}
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Create login page**

Create `app/(public)/login/page.tsx`:
```tsx
import Link from 'next/link'
import { LoginForm } from '@/components/login-form'

export const metadata = { title: 'Sign In — OneGolf' }

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#090f1a' }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-white/50 text-sm mt-1">Sign in to your OneGolf account</p>
        </div>

        <LoginForm />

        <p className="text-center text-white/40 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/pricing" className="text-white/70 hover:text-white underline">
            Get started
          </Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create password reset landing page**

Create `app/(public)/auth/reset-password/page.tsx`:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push('/dashboard')
      }
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#090f1a' }}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6">Set new password</h1>
        {message && <p className="text-red-400 text-sm mb-4">{message}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="password" className="text-white/70 text-sm mb-1.5">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8+ characters"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <Button type="submit" disabled={isPending} className="bg-green-400 text-black font-semibold hover:bg-green-300">
            {isPending ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/login-form.tsx app/\(public\)/login/page.tsx app/\(public\)/auth/reset-password/page.tsx
git commit -m "feat: add login page, Google sign-in, and password reset flow"
```

---

## Task 11: Welcome Page

**Files:**
- Create: `components/welcome-credits.tsx`
- Create: `app/(public)/welcome/page.tsx`

- [ ] **Step 1: Create WelcomeCredits polling component**

Create `components/welcome-credits.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface WelcomeCreditsProps {
  userId: string
  firstName: string
  tierName: string
  expectedCredits: number
}

export function WelcomeCredits({ userId, firstName, tierName, expectedCredits }: WelcomeCreditsProps) {
  const [credits, setCredits] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (credits !== null && credits > 0) return
    if (attempts >= 5) return // 5 attempts × 2s = 10s max

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/credits/balance')
        const data = await res.json()
        setCredits(data.balance ?? 0)
        setAttempts((a) => a + 1)
      } catch {
        setAttempts((a) => a + 1)
      }
    }, attempts === 0 ? 500 : 2000)

    return () => clearTimeout(timer)
  }, [credits, attempts, userId])

  // Set welcomed cookie so back-navigation redirects to dashboard
  useEffect(() => {
    document.cookie = 'onegolf-welcomed=1; path=/; max-age=31536000; samesite=lax'
  }, [])

  const displayCredits = credits ?? '…'
  const isLoaded = credits !== null && credits > 0
  const isDelayed = attempts >= 5 && !isLoaded

  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-6xl mb-4">⛳</div>
      <h1 className="text-3xl font-bold text-white mb-2">
        You&apos;re in{firstName ? `, ${firstName}` : ''}!
      </h1>

      <div className="my-6 flex flex-col items-center gap-1">
        <span className="text-6xl font-bold text-green-400">{displayCredits}</span>
        <span className="text-white/50">credits in your wallet</span>
        {isDelayed && (
          <span className="text-white/30 text-sm mt-1">
            Still processing…{' '}
            <button
              onClick={() => { setAttempts(0); setCredits(null) }}
              className="underline hover:text-white/50"
            >
              refresh
            </button>
          </span>
        )}
      </div>

      <div className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 p-4 mb-6 text-left">
        <p className="text-green-400 text-sm font-semibold mb-1">How credits work</p>
        <p className="text-white/50 text-sm leading-relaxed">
          Each tee time costs credits based on the course, time, and demand.
          Unused credits roll over each month — {tierName} members keep up to{' '}
          {tierName === 'Casual' ? '50' : tierName === 'Core' ? '75' : '105'}.
        </p>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full max-w-xs rounded-xl bg-green-400 hover:bg-green-300 text-black font-semibold py-3 transition-colors"
      >
        Start Booking →
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create a simple credits balance API route**

Create `app/api/credits/balance/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const balance = await getCreditBalance(user.id)
  return NextResponse.json({ balance })
}
```

- [ ] **Step 3: Create welcome page**

Create `app/(public)/welcome/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, subscriptionTiers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { WelcomeCredits } from '@/components/welcome-credits'

export const metadata = { title: 'Welcome — OneGolf' }

export default async function WelcomePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // If already welcomed before, redirect to dashboard
  const cookieStore = await cookies()
  const alreadyWelcomed = cookieStore.get('onegolf-welcomed')?.value
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id))

  if (alreadyWelcomed && dbUser?.subscriptionStatus === 'active') {
    redirect('/dashboard')
  }

  const tierName = dbUser?.subscriptionTier
    ? dbUser.subscriptionTier.charAt(0).toUpperCase() + dbUser.subscriptionTier.slice(1)
    : 'Core'

  const firstName = dbUser?.fullName?.split(' ')[0] ?? ''

  // Look up expected credits for their tier
  const [tier] = dbUser?.subscriptionTier
    ? await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, dbUser.subscriptionTier))
    : []

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#090f1a' }}>
      <WelcomeCredits
        userId={user.id}
        firstName={firstName}
        tierName={tierName}
        expectedCredits={tier?.monthlyCredits ?? 150}
      />
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/welcome-credits.tsx app/\(public\)/welcome/page.tsx app/api/credits/balance/route.ts
git commit -m "feat: add welcome page with credit polling and balance API route"
```

---

## Task 12: Dashboard Stub

**Files:**
- Create: `app/(member)/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard stub**

Create `app/(member)/dashboard/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const metadata = { title: 'Dashboard — OneGolf' }

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id))
  const balance = await getCreditBalance(user.id)

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">
          Hey, {dbUser?.fullName?.split(' ')[0] ?? 'there'} 👋
        </h1>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Credit Balance</p>
          <p className="text-5xl font-bold text-green-400">{balance}</p>
          <p className="text-white/40 text-sm mt-1 capitalize">
            {dbUser?.subscriptionTier ?? '—'} plan
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Find a Tee Time</p>
          <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/30 text-sm">
            AI booking search coming soon…
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(member\)/dashboard/page.tsx
git commit -m "feat: add dashboard stub with credit balance display"
```

---

## Task 13: End-to-End Verification

- [ ] **Step 1: Enable Google OAuth in Supabase dashboard**

In Supabase → Authentication → Providers → Google:
- Enable Google provider
- Add your Google OAuth Client ID and Secret (from Google Cloud Console)
- Add `http://localhost:3000/auth/callback` to allowed redirect URLs

- [ ] **Step 2: Set NEXT_PUBLIC_APP_URL in .env.local**

Ensure `.env.local` contains:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3: Run full email signup flow**

```bash
npm run dev
```
1. Go to `http://localhost:3000/pricing`
2. Click Core → lands on `/signup?plan=core` with "Core · $149/mo" chip
3. Fill in name, email, password → click "Create Account"
4. Redirected to Stripe Checkout (test mode)
5. Enter card `4242 4242 4242 4242`, exp `12/30`, CVC `123`
6. Click Subscribe → redirected to `/welcome`
7. Welcome page shows credit counter (150 for Core) — may take a few seconds to appear
8. Click "Start Booking" → lands on `/dashboard` showing 150 credits
9. Navigate back to `/welcome` → immediately redirected to `/dashboard`

- [ ] **Step 4: Verify database state**

In Supabase → Table Editor:
- `users` table: row with `stripe_customer_id`, `subscription_tier: 'core'`, `subscription_status: 'active'`
- `credit_ledger` table: exactly one row with `type: 'SUBSCRIPTION_GRANT'`, `amount: 150`, `reference_id: 'in_xxx'`
- Supabase Auth → Users: `user_metadata.role: 'member'`

- [ ] **Step 5: Test login flow**

1. Sign out by calling the `signOut` Server Action — temporarily add a form button to the dashboard: `<form action={signOut}><button type="submit">Sign out</button></form>`
2. Go to `/login`, enter credentials → lands on `/dashboard`
3. Go to `/dashboard` while logged out → redirected to `/login`

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete auth + subscription onboarding flow"
```
