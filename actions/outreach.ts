'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { outreachProspects, outreachEmails } from '@/lib/db/schema'
import { eq, and, lte, inArray, count } from 'drizzle-orm'
import { Resend } from 'resend'
import { geocodeLocation, searchGolfCourses, PlaceResult } from '@/lib/outreach/places'
import { scrapeCourseSite } from '@/lib/outreach/scraper'
import { classifyCourse } from '@/lib/outreach/classifier'
import { generateTouchEmail } from '@/lib/outreach/email-writer'

const resend = new Resend(process.env.RESEND_API_KEY)
const OUTREACH_FROM = 'Dutch @ Gimmelab <outreach@gimmelab.com>'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('NOT_AUTHENTICATED')
  if (user.user_metadata?.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}

// ─── 1. Discover golf courses via Google Places ──────────────────────────────

export async function discoverCourses(
  location: string,
  radiusMiles: number,
): Promise<{ results: PlaceResult[]; error?: string }> {
  try {
    await requireAdmin()
    const { lat, lng } = await geocodeLocation(location)
    const results = await searchGolfCourses(lat, lng, radiusMiles)
    return { results }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { results: [], error: 'Not authorized.' }
    return { results: [], error: msg || 'Discovery failed.' }
  }
}

// ─── 2. Add selected prospects ───────────────────────────────────────────────

export async function addProspects(
  places: PlaceResult[],
): Promise<{ added: number; skipped: number; error?: string }> {
  try {
    await requireAdmin()

    const existing = await db
      .select({ googlePlaceId: outreachProspects.googlePlaceId })
      .from(outreachProspects)
      .where(
        inArray(
          outreachProspects.googlePlaceId,
          places.map(p => p.googlePlaceId),
        ),
      )

    const existingIds = new Set(existing.map(e => e.googlePlaceId))
    const newPlaces = places.filter(p => !existingIds.has(p.googlePlaceId))

    if (newPlaces.length > 0) {
      await db.insert(outreachProspects).values(
        newPlaces.map(p => ({
          courseName: p.courseName,
          phone: p.phone,
          websiteUrl: p.websiteUrl ?? '',
          googlePlaceId: p.googlePlaceId,
          status: 'new' as const,
          tier: 'tier1' as const,
        })),
      )
    }

    revalidatePath('/admin/outreach/prospects')
    return { added: newPlaces.length, skipped: places.length - newPlaces.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { added: 0, skipped: 0, error: 'Not authorized.' }
    return { added: 0, skipped: 0, error: 'Failed to add prospects.' }
  }
}

// ─── 3. Enrich a prospect ────────────────────────────────────────────────────

export async function enrichProspect(
  prospectId: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin()

    const [prospect] = await db
      .select()
      .from(outreachProspects)
      .where(eq(outreachProspects.id, prospectId))

    if (!prospect) return { error: 'Prospect not found.' }
    if (!prospect.websiteUrl) return { error: 'No website URL to scrape.' }

    const scraped = await scrapeCourseSite(prospect.websiteUrl)

    const classification = await classifyCourse(
      prospect.courseName,
      scraped.bodyText,
      prospect.courseName,
    )

    if (scraped.isDrivingRange || classification.isDrivingRange) {
      await db
        .update(outreachProspects)
        .set({
          status: 'skipped',
          skipReason: classification.skipReason ?? 'Driving range or no tee times detected',
          updatedAt: new Date(),
        })
        .where(eq(outreachProspects.id, prospectId))
      revalidatePath('/admin/outreach/prospects')
      return {}
    }

    const tierMap: Record<string, string> = {
      municipal: 'tier1',
      semi_private: 'tier1',
      public: 'tier1',
      resort: 'tier2',
      private: 'tier3',
    }
    const tier = (classification.courseType ? tierMap[classification.courseType] : 'tier1') ?? 'tier1'

    let estimatedMonthlyEarn: number | null = null
    if (scraped.rackRateMin !== null && scraped.rackRateMax !== null) {
      const avg = (scraped.rackRateMin + scraped.rackRateMax) / 2
      estimatedMonthlyEarn = Math.floor(avg * 30 * 0.85)
    }

    await db
      .update(outreachProspects)
      .set({
        gmName: scraped.gmName ?? prospect.gmName,
        rackRateMin: scraped.rackRateMin,
        rackRateMax: scraped.rackRateMax,
        golfnowUrl: scraped.golfnowUrl,
        estimatedMonthlyEarn,
        courseType: classification.courseType,
        holes: classification.holes,
        tier,
        notes: classification.hook ?? prospect.notes,
        status: 'enriched',
        updatedAt: new Date(),
      })
      .where(eq(outreachProspects.id, prospectId))

    revalidatePath('/admin/outreach/prospects')
    revalidatePath(`/admin/outreach/${prospectId}`)
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: `Enrichment failed: ${msg}` }
  }
}

// ─── 4. Generate 3-touch emails for enriched prospects ───────────────────────

export async function generateProspectEmails(
  prospectIds: string[],
): Promise<{ generated: number; error?: string }> {
  try {
    await requireAdmin()

    const prospects = await db
      .select()
      .from(outreachProspects)
      .where(
        and(
          inArray(outreachProspects.id, prospectIds),
          eq(outreachProspects.status, 'enriched'),
        ),
      )

    let generated = 0

    for (const prospect of prospects) {
      const existing = await db
        .select({ id: outreachEmails.id })
        .from(outreachEmails)
        .where(
          and(
            eq(outreachEmails.prospectId, prospect.id),
            eq(outreachEmails.touchNumber, 1),
          ),
        )
      if (existing.length > 0) continue

      const rackRateAvg =
        prospect.rackRateMin !== null && prospect.rackRateMax !== null
          ? Math.round((prospect.rackRateMin + prospect.rackRateMax) / 2)
          : null

      const vars = {
        gmName: prospect.gmName,
        courseName: prospect.courseName,
        estimatedMonthlyEarn: prospect.estimatedMonthlyEarn,
        hook: prospect.notes,
        rackRateAvg,
      }

      const touch1 = await generateTouchEmail(1, vars)
      const touch2 = await generateTouchEmail(2, vars)
      const touch3 = await generateTouchEmail(3, vars)

      const now = new Date()
      const day4 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)
      const day10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)

      await db.insert(outreachEmails).values([
        { prospectId: prospect.id, touchNumber: 1, ...touch1, status: 'draft', scheduledSendAt: now },
        { prospectId: prospect.id, touchNumber: 2, ...touch2, status: 'draft', scheduledSendAt: day4 },
        { prospectId: prospect.id, touchNumber: 3, ...touch3, status: 'draft', scheduledSendAt: day10 },
      ])

      await db
        .update(outreachProspects)
        .set({ status: 'queued', updatedAt: new Date() })
        .where(eq(outreachProspects.id, prospect.id))

      generated++
    }

    revalidatePath('/admin/outreach/queue')
    revalidatePath('/admin/outreach/prospects')
    return { generated }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { generated: 0, error: 'Not authorized.' }
    return { generated: 0, error: `Email generation failed: ${msg}` }
  }
}

// ─── 5. Approve + send an email ──────────────────────────────────────────────

export async function approveAndSendEmail(
  emailId: string,
  overrides?: { subject?: string; body?: string },
): Promise<{ error?: string }> {
  try {
    await requireAdmin()

    const [email] = await db
      .select()
      .from(outreachEmails)
      .where(eq(outreachEmails.id, emailId))

    if (!email) return { error: 'Email not found.' }

    const [prospect] = await db
      .select()
      .from(outreachProspects)
      .where(eq(outreachProspects.id, email.prospectId))

    if (!prospect?.email) return { error: 'Prospect has no email address.' }

    if (!process.env.RESEND_API_KEY?.startsWith('re_placeholder')) {
      const { data, error } = await resend.emails.send({
        from: OUTREACH_FROM,
        to: prospect.email,
        subject: overrides?.subject ?? email.subject,
        text: overrides?.body ?? email.body,
      })

      if (error) return { error: `Resend error: ${error.message}` }

      await db
        .update(outreachEmails)
        .set({
          status: 'sent',
          sentAt: new Date(),
          resendEmailId: data?.id ?? null,
        })
        .where(eq(outreachEmails.id, emailId))
    } else {
      await db
        .update(outreachEmails)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(outreachEmails.id, emailId))
    }

    if (email.touchNumber === 1) {
      await db
        .update(outreachProspects)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(outreachProspects.id, email.prospectId))
    }

    revalidatePath('/admin/outreach/queue')
    revalidatePath(`/admin/outreach/${email.prospectId}`)
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: `Send failed: ${msg}` }
  }
}

// ─── 6. Update prospect status / notes ───────────────────────────────────────

export async function updateProspect(
  prospectId: string,
  updates: {
    status?: string
    gmName?: string
    email?: string
    courseType?: string
    holes?: string
    tier?: string
    notes?: string
  },
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await db
      .update(outreachProspects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(outreachProspects.id, prospectId))
    revalidatePath(`/admin/outreach/${prospectId}`)
    revalidatePath('/admin/outreach/prospects')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Update failed.' }
  }
}

// ─── 7. Skip a draft email (delay 1 day) ─────────────────────────────────────

export async function skipEmail(emailId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const [email] = await db
      .select()
      .from(outreachEmails)
      .where(eq(outreachEmails.id, emailId))

    if (!email) return { error: 'Email not found.' }

    const newDate = new Date(email.scheduledSendAt.getTime() + 24 * 60 * 60 * 1000)
    await db
      .update(outreachEmails)
      .set({ scheduledSendAt: newDate })
      .where(eq(outreachEmails.id, emailId))

    revalidatePath('/admin/outreach/queue')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Skip failed.' }
  }
}
