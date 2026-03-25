// app/(admin)/admin/courses/[id]/course-sidebar.tsx
'use client'
import { setCourseStatus } from '@/actions/admin/update-course'

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'payouts',  label: 'Payouts' },
  { key: 'settings', label: 'Settings' },
]

export function CourseSidebar({
  courseId,
  currentSection,
  courseStatus,
}: {
  courseId: string
  currentSection: string
  courseStatus: string
}) {
  const isSuspended = courseStatus === 'suspended'

  return (
    <div style={{
      width: 160, flexShrink: 0, background: '#fafafa',
      borderRight: '1px solid #e8e8e8', padding: '24px 0',
      display: 'flex', flexDirection: 'column', minHeight: '100%',
    }}>
      {SECTIONS.map(s => (
        <a
          key={s.key}
          href={`/admin/courses/${courseId}?section=${s.key}`}
          style={{
            display: 'block', padding: '8px 20px',
            fontSize: 13, fontWeight: currentSection === s.key ? 700 : 400,
            color: currentSection === s.key ? '#111' : 'rgba(0,0,0,0.5)',
            background: currentSection === s.key ? '#f0f0f0' : 'transparent',
            textDecoration: 'none',
            borderLeft: currentSection === s.key ? '3px solid #111' : '3px solid transparent',
          }}
        >
          {s.label}
        </a>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '0 12px 16px' }}>
        <form action={async () => { await setCourseStatus(courseId, isSuspended ? 'active' : 'suspended') }}>
          <button
            type="submit"
            style={{
              display: 'block', width: '100%', textAlign: 'center', padding: '7px 12px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: isSuspended ? '#16a34a' : '#dc2626',
              background: isSuspended ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
              border: `1px solid ${isSuspended ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
              borderRadius: 2, cursor: 'pointer',
            }}
          >
            {isSuspended ? 'Activate' : 'Suspend'}
          </button>
        </form>
      </div>
    </div>
  )
}
