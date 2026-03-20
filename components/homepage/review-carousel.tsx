'use client'

import { useEffect, useRef, useState } from 'react'

interface Review {
  id: number
  quote: string
  author: string
  meta: string
  avatarUrl: string
}

const REVIEWS: Review[] = [
  {
    id: 1,
    quote: 'I used to spend $300 a month on green fees alone. Now I pay $149 and play just as much. The savings basically paid for a new putter.',
    author: 'James T.',
    meta: 'Core Member · 8 months',
    avatarUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    quote: "Booking used to mean calling the pro shop and hoping they had a spot. Now I open the app, pick a time, done. I've played six new courses this year.",
    author: 'Marcus W.',
    meta: 'Heavy Member · 1 year',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    quote: "I bought the Casual plan to try it. Upgraded to Core after two weeks. The QR check-in is seamless — show your phone and you're on the tee.",
    author: 'Daniel R.',
    meta: 'Core Member · 5 months',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    quote: "As someone who plays 3–4 times a month, the Heavy plan just makes sense. Credits roll over too — I've never lost a single one.",
    author: 'Sarah K.',
    meta: 'Heavy Member · 6 months',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 5,
    quote: "Tried it for one month out of curiosity. Haven't gone back to booking the old way. Every partner course accepts the QR without any issues.",
    author: 'Ryan M.',
    meta: 'Casual Member · 3 months',
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80',
  },
]

const VISIBLE = 3
const MAX_IDX = REVIEWS.length - VISIBLE  // 2

export function ReviewCarousel() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = (idx: number) => setCurrent(Math.max(0, Math.min(idx, MAX_IDX)))

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev < MAX_IDX ? prev + 1 : 0))
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const navigate = (idx: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    goTo(idx)
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev < MAX_IDX ? prev + 1 : 0))
    }, 5000)
  }

  return (
    <section style={{ background: '#0d0d0d', padding: '100px 60px', position: 'relative', overflow: 'hidden' }}>
      {/* Green glows */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(26,92,56,.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(26,92,56,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 56, position: 'relative', zIndex: 1 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#4ade80', marginBottom: 10 }}>
            Member reviews
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-2px', color: '#fff', textTransform: 'uppercase' }}>
            Golfers love it.
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(current - 1)}
            disabled={current === 0}
            aria-label="Previous reviews"
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, cursor: current === 0 ? 'default' : 'pointer', opacity: current === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ←
          </button>
          <button
            onClick={() => navigate(current + 1)}
            disabled={current === MAX_IDX}
            aria-label="Next reviews"
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 16, cursor: current === MAX_IDX ? 'default' : 'pointer', opacity: current === MAX_IDX ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            →
          </button>
        </div>
      </div>

      {/* Track */}
      <div style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            gap: 20,
            transition: 'transform 0.4s cubic-bezier(.25,.46,.45,.94)',
            transform: `translateX(calc(-${current} * (33.333% + 7px)))`,
          }}
        >
          {REVIEWS.map(r => (
            <div
              key={r.id}
              style={{
                flexShrink: 0,
                width: 'calc(33.333% - 14px)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: 36,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.transform = 'translateY(-4px)'
                el.style.borderColor = 'rgba(74,222,128,.3)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.transform = ''
                el.style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              <div style={{ fontSize: 13, color: '#4ade80', letterSpacing: 3, marginBottom: 20 }}>★ ★ ★ ★ ★</div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, flex: 1 }}>{r.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.avatarUrl} alt={r.author} width={42} height={42} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{r.author}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{r.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 32, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        {Array.from({ length: MAX_IDX + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => navigate(i)}
            aria-label={`Go to review set ${i + 1}`}
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === current ? '#4ade80' : 'rgba(255,255,255,0.15)',
              border: 'none',
              cursor: 'pointer',
              transition: 'width 0.2s, background 0.2s',
              padding: 0,
            }}
          />
        ))}
      </div>
    </section>
  )
}
