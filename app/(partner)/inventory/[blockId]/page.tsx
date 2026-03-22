import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import { db } from '@/lib/db'
import { teeTimeBlocks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import BlockForm from '@/components/block-form'

export const metadata = { title: 'Edit Block — Gimmelab' }

export default async function EditBlockPage({
  params,
}: {
  params: Promise<{ blockId: string }>
}) {
  const { blockId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course/new')

  const block = await db
    .select()
    .from(teeTimeBlocks)
    .where(eq(teeTimeBlocks.id, blockId))
    .limit(1)
    .then((r) => r[0] ?? null)

  if (!block || block.courseId !== course.id) redirect('/partner/inventory')

  return (
    <div className="px-8 py-8">
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
          Inventory
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', color: '#fff', lineHeight: 1, margin: 0 }}>
          Edit block
        </h1>
      </div>
      <BlockForm
        mode="edit"
        blockId={block.id}
        initialValues={{
          dayOfWeek:        block.dayOfWeek as number[],
          startTime:        block.startTime.slice(0, 5),
          endTime:          block.endTime.slice(0, 5),
          slotsPerInterval: block.slotsPerInterval ?? 1,
          creditOverride:   block.creditOverride,
          validFrom:        block.validFrom,
          validUntil:       block.validUntil ?? null,
          isActive:         block.isActive ?? true,
        }}
      />
    </div>
  )
}
