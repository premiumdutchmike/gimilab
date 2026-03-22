'use client'

import { useState, useTransition } from 'react'
import { approveCourse, rejectCourse } from '@/actions/admin'

export default function CourseActions({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handle(action: 'approve' | 'reject') {
    setError(null)
    startTransition(async () => {
      const result = action === 'approve'
        ? await approveCourse(courseId)
        : await rejectCourse(courseId)
      if (result.error) { setError(result.error); return }
      setDone(action === 'approve' ? 'approved' : 'rejected')
    })
  }

  if (done) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: done === 'approved' ? '#4ade80' : '#f87171',
        background: done === 'approved' ? 'rgba(74,222,128,0.10)' : 'rgba(248,113,113,0.10)',
        padding: '4px 10px', borderRadius: 2,
      }}>
        {done}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        onClick={() => handle('approve')}
        disabled={isPending}
        style={{
          background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: 2, padding: '6px 14px', cursor: isPending ? 'default' : 'pointer',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          color: '#4ade80', textTransform: 'uppercase', fontFamily: 'inherit',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        Approve
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={isPending}
        style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2, padding: '6px 14px', cursor: isPending ? 'default' : 'pointer',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontFamily: 'inherit',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        Reject
      </button>
      {error && <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>}
    </div>
  )
}
