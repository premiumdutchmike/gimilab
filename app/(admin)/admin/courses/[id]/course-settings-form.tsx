// app/(admin)/admin/courses/[id]/course-settings-form.tsx
'use client'
import { useState, useTransition } from 'react'
import { updateCourseFields } from '@/actions/admin/update-course'

export function CourseSettingsForm({ course }: {
  course: {
    courseId: string
    courseName: string
    description: string | null
    address: string
    holes: number | null
    baseCreditCost: number
    payoutRate: string | null
  }
}) {
  const [name, setName] = useState(course.courseName)
  const [description, setDescription] = useState(course.description ?? '')
  const [address, setAddress] = useState(course.address)
  const [holes, setHoles] = useState(String(course.holes ?? 18))
  const [baseCreditCost, setBaseCreditCost] = useState(String(course.baseCreditCost))
  const [payoutRate, setPayoutRate] = useState(
    course.payoutRate ? String(Math.round(Number(course.payoutRate) * 100)) : '85'
  )
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #e8e8e8',
    borderRadius: 2, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', display: 'block', marginBottom: 4,
  }

  function handleSave() {
    setError('')
    setSaved(false)
    const holesNum = parseInt(holes)
    const creditNum = parseInt(baseCreditCost)
    const rateNum = parseInt(payoutRate)
    if (isNaN(holesNum) || isNaN(creditNum) || isNaN(rateNum)) {
      setError('Holes, base credits, and payout % must be valid numbers')
      return
    }
    if (rateNum < 1 || rateNum > 100) {
      setError('Payout % must be between 1 and 100')
      return
    }
    if (creditNum < 1) {
      setError('Base credits must be at least 1')
      return
    }
    startTransition(async () => {
      const result = await updateCourseFields(course.courseId, {
        name,
        description,
        address,
        holes: holesNum,
        baseCreditCost: creditNum,
        payoutRate: (rateNum / 100).toFixed(3),
      })
      if (result.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      <div><label style={labelStyle}>Course Name</label>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></div>
      <div><label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }}
          value={description} onChange={e => setDescription(e.target.value)} /></div>
      <div><label style={labelStyle}>Address</label>
        <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>Holes</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={holes} onChange={e => setHoles(e.target.value)}>
            {['9', '18', '27', '36'].map(h => <option key={h} value={h}>{h}</option>)}
          </select></div>
        <div><label style={labelStyle}>Base Credits</label>
          <input style={inputStyle} type="number" min={1} value={baseCreditCost}
            onChange={e => setBaseCreditCost(e.target.value)} /></div>
        <div><label style={labelStyle}>Payout %</label>
          <input style={inputStyle} type="number" min={1} max={100} value={payoutRate}
            onChange={e => setPayoutRate(e.target.value)} /></div>
      </div>
      {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
      {saved && <p style={{ fontSize: 12, color: '#16a34a' }}>Saved.</p>}
      <button
        onClick={handleSave}
        disabled={pending}
        style={{
          alignSelf: 'flex-start', padding: '8px 20px', background: '#111',
          color: '#fff', border: 'none', borderRadius: 2, fontSize: 13,
          fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
