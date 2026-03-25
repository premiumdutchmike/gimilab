import { getAllCourses } from '@/lib/admin/queries'
import CourseActions from './course-actions'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Courses — Gimmelab Admin' }

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  active:    { label: 'Active',    color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  suspended: { label: 'Suspended', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
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
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', lineHeight: 1 }}>
          Courses
        </h1>
        {pending.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#d97706', background: 'rgba(217,119,6,0.08)',
            border: '1px solid rgba(217,119,6,0.2)',
            padding: '4px 12px', borderRadius: 2,
          }}>
            {pending.length} pending approval
          </span>
        )}
      </div>

      {/* Pending — shown first */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d97706', marginBottom: 12 }}>
            Awaiting approval
          </p>
          <div style={{ background: '#fff', border: '1px solid rgba(217,119,6,0.2)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 200px',
              padding: '10px 20px', borderBottom: '1px solid #f0f0f0',
              background: '#fafafa',
            }}>
              {['Course', 'Partner', 'Holes', 'Base cost', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>
                  {h}
                </span>
              ))}
            </div>
            {pending.map((c, i) => (
              <div key={c.courseId} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 200px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < pending.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}>
                <a href={`/admin/courses/${c.courseId}`} style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{c.courseName}</div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{c.address}</div>
                </a>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>{c.businessName}</span>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>{c.holes}</span>
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
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>
            All courses
          </p>
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 110px 120px',
              padding: '10px 20px', borderBottom: '1px solid #f0f0f0',
              background: '#fafafa',
            }}>
              {['Course', 'Partner', 'Holes', 'Base cost', 'Status', 'Payout %'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>
                  {h}
                </span>
              ))}
            </div>
            {rest.map((c, i) => {
              const s = STATUS_STYLE[c.courseStatus] ?? { label: c.courseStatus, color: '#111', bg: 'transparent' }
              return (
                <div key={c.courseId} style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px 110px 120px',
                  padding: '13px 20px', alignItems: 'center',
                  borderBottom: i < rest.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}>
                  <a href={`/admin/courses/${c.courseId}`} style={{ textDecoration: 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{c.courseName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{c.address}</div>
                  </a>
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>{c.businessName}</span>
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>{c.holes}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{c.baseCreditCost} cr</span>
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 2,
                  }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>
                    {c.payoutRate ? `${Math.round(Number(c.payoutRate) * 100)}%` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.3)' }}>No courses yet.</p>
        </div>
      )}
    </div>
  )
}
