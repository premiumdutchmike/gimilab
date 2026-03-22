import { getAllCourses } from '@/lib/admin/queries'
import CourseActions from './course-actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Courses — Gimmelab Admin' }

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
  active:    { label: 'Active',    color: '#4ade80', bg: 'rgba(74,222,128,0.10)' },
  suspended: { label: 'Suspended', color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminCoursesPage() {
  const courses = await getAllCourses()
  const pending = courses.filter(c => c.courseStatus === 'pending')
  const rest    = courses.filter(c => c.courseStatus !== 'pending')

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>

      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
          Courses
        </h1>
        {pending.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#fbbf24', background: 'rgba(251,191,36,0.10)',
            border: '1px solid rgba(251,191,36,0.25)',
            padding: '4px 12px', borderRadius: 2,
          }}>
            {pending.length} pending approval
          </span>
        )}
      </div>

      {/* Pending — shown first */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fbbf24', marginBottom: 12 }}>
            Awaiting approval
          </p>
          <div style={{ background: '#141414', border: '1px solid rgba(251,191,36,0.2)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 200px',
              padding: '10px 20px', borderBottom: '1px solid #1f1f1f',
            }}>
              {['Course', 'Partner', 'Holes', 'Base cost', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                  {h}
                </span>
              ))}
            </div>
            {pending.map((c, i) => (
              <div key={c.courseId} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 200px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < pending.length - 1 ? '1px solid #1f1f1f' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{c.courseName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{c.address}</div>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{c.businessName}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{c.holes}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{c.baseCreditCost} cr</span>
                <CourseActions courseId={c.courseId} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All other courses */}
      {rest.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
            All courses
          </p>
          <div style={{ background: '#141414', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 110px 110px',
              padding: '10px 20px', borderBottom: '1px solid #1f1f1f',
            }}>
              {['Course', 'Partner', 'Holes', 'Base cost', 'Status', 'Added'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                  {h}
                </span>
              ))}
            </div>
            {rest.map((c, i) => {
              const s = STATUS_STYLE[c.courseStatus] ?? { label: c.courseStatus, color: '#fff', bg: 'transparent' }
              return (
                <div key={c.courseId} style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 110px 110px',
                  padding: '13px 20px', alignItems: 'center',
                  borderBottom: i < rest.length - 1 ? '1px solid #1f1f1f' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{c.courseName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{c.address}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{c.businessName}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{c.holes}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{c.baseCreditCost} cr</span>
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 2,
                  }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{formatDate(c.createdAt)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No courses yet.</p>
        </div>
      )}
    </div>
  )
}
