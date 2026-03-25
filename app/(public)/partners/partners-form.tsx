'use client'

import { useState } from 'react'

export default function PartnerForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    title: '',
    course: '',
    email: '',
    phone: '',
    message: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // TODO: wire to Server Action / Resend email
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="pf-success">
        <div className="pf-success-icon">✓</div>
        <div className="pf-success-hl">We'll be in touch soon.</div>
        <p className="pf-success-sub">Expect a call or email within one business day. We keep it short — 15 minutes, no pressure.</p>
      </div>
    )
  }

  return (
    <form className="pf-form" onSubmit={handleSubmit}>
      <div className="pf-row">
        <div className="pf-field">
          <label className="pf-label">Your name</label>
          <input className="pf-input" name="name" value={form.name} onChange={handleChange} placeholder="Mike Johnson" required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Title</label>
          <input className="pf-input" name="title" value={form.title} onChange={handleChange} placeholder="Head Pro / GM / Owner" />
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Course name</label>
        <input className="pf-input" name="course" value={form.course} onChange={handleChange} placeholder="Walnut Lane Golf Club" required />
      </div>
      <div className="pf-row">
        <div className="pf-field">
          <label className="pf-label">Email</label>
          <input className="pf-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@yourcourse.com" required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Phone</label>
          <input className="pf-input" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(215) 555-0100" />
        </div>
      </div>
      <div className="pf-field">
        <label className="pf-label">Anything else? <span className="pf-optional">(optional)</span></label>
        <textarea className="pf-input pf-textarea" name="message" value={form.message} onChange={handleChange} placeholder="Tell us about your course, current booking setup, or any questions." rows={3} />
      </div>
      <button className="pf-submit" type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Request a conversation →'}
      </button>
      <p className="pf-fine">No commitment. We respond within one business day.</p>
    </form>
  )
}
