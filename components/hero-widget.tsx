'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

interface Course {
  name: string
  loc: string
  credits: number
  rack: number
  img: string
}

const TIERS = {
  casual: { name: 'Casual', label: 'Birdie',    icon: '🐦', price: 99,  credits: 100, sub: '100 credits/mo' },
  core:   { name: 'Core',   label: 'Eagle',     icon: '🦅', price: 149, credits: 150, sub: '150 credits/mo' },
  heavy:  { name: 'Heavy',  label: 'Albatross', icon: '🕊️', price: 199, credits: 210, sub: '210 credits/mo' },
} as const

type TierKey = keyof typeof TIERS

function buildScenes(courseCount: number): { tier: TierKey; a: number; b: number }[] {
  if (courseCount < 2) return [{ tier: 'core', a: 0, b: 0 }]
  const tiers: TierKey[] = ['casual', 'core', 'heavy']
  const scenes: { tier: TierKey; a: number; b: number }[] = []
  for (let i = 0; i < courseCount && scenes.length < 6; i += 2) {
    if (i + 1 < courseCount) {
      scenes.push({ tier: tiers[scenes.length % tiers.length], a: i, b: i + 1 })
    }
  }
  if (scenes.length < 6 && courseCount >= 4)
    scenes.push({ tier: 'core', a: 0, b: courseCount - 1 })
  if (scenes.length < 6 && courseCount >= 3)
    scenes.push({ tier: 'heavy', a: 1, b: courseCount - 1 })
  if (scenes.length < 6 && courseCount >= 3)
    scenes.push({ tier: 'casual', a: 2, b: courseCount - 2 })
  return scenes.length > 0 ? scenes : [{ tier: 'core', a: 0, b: Math.min(1, courseCount - 1) }]
}

const FALLBACK_COURSES: Course[] = [
  { name: 'Walnut Lane GC',       loc: 'Philadelphia, PA',     credits: 36,  rack: 52,  img: '/imagery/course-1.jpeg' },
  { name: 'Cobbs Creek GC',       loc: 'W. Philadelphia, PA',  credits: 45,  rack: 68,  img: '/imagery/course-2.png' },
  { name: 'Torresdale-Frankford', loc: 'NE Philadelphia, PA',  credits: 55,  rack: 85,  img: '/imagery/course-3.jpeg' },
  { name: 'Westchase GC',         loc: 'Tampa Bay, FL',        credits: 90,  rack: 125, img: '/imagery/course-4.png' },
  { name: 'Bayou Oaks',           loc: 'New Orleans, LA',      credits: 75,  rack: 95,  img: '/imagery/course-5.png' },
  { name: 'Palm Harbor GC',       loc: 'Palm Harbor, FL',      credits: 110, rack: 145, img: '/imagery/course-6.jpeg' },
]

export default function HeroWidget({ courses }: { courses?: Course[] }) {
  const resolved = courses && courses.length >= 2 ? courses : FALLBACK_COURSES
  const scenes = buildScenes(resolved.length)

  const [sceneIndex, setSceneIndex] = useState(0)
  const [phase, setPhase] = useState<'hidden' | 'specA' | 'specB' | 'active' | 'readout'>('hidden')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [savingsDisplay, setSavingsDisplay] = useState(0)
  const [creditsDisplay, setCreditsDisplay] = useState(0)
  const [rateDisplay, setRateDisplay] = useState(0)
  const [readoutPulse, setReadoutPulse] = useState(false)
  const [tierGlow, setTierGlow] = useState(false)

  const scene = scenes[sceneIndex]
  const tier = TIERS[scene.tier]
  const cA = resolved[scene.a]
  const cB = resolved[scene.b]

  const totalCredits = cA.credits + cB.credits
  const totalRack = cA.rack + cB.rack
  const fraction = Math.min(totalCredits / tier.credits, 1)
  const effectiveCost = Math.round(fraction * tier.price)
  const savings = totalRack - effectiveCost
  const pct = Math.round((savings / totalRack) * 100)
  const perRound = Math.round(effectiveCost / 2)

  const advanceScene = useCallback((index?: number) => {
    const next = index !== undefined ? index : (sceneIndex + 1) % scenes.length
    setPhase('hidden')
    setSavingsDisplay(0)
    setCreditsDisplay(0)
    setRateDisplay(0)
    setReadoutPulse(false)
    setTierGlow(false)

    setTimeout(() => {
      setSceneIndex(next)
      setPhase('specA')
    }, 120)
  }, [sceneIndex, scenes.length])

  useEffect(() => {
    if (phase === 'hidden') return
    const timers: ReturnType<typeof setTimeout>[] = []

    if (phase === 'specA') {
      timers.push(setTimeout(() => setPhase('specB'), 200))
    } else if (phase === 'specB') {
      timers.push(setTimeout(() => setPhase('active'), 300))
    } else if (phase === 'active') {
      timers.push(setTimeout(() => setPhase('readout'), 300))
    } else if (phase === 'readout') {
      const duration = 450
      const startTime = performance.now()
      function step(now: number) {
        const p = Math.min((now - startTime) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setSavingsDisplay(Math.round(savings * ease))
        setCreditsDisplay(Math.round(totalCredits * ease))
        setRateDisplay(Math.round(perRound * ease))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
      setReadoutPulse(true)
      setTierGlow(true)
      timers.push(setTimeout(() => { setReadoutPulse(false); setTierGlow(false) }, 1600))
    }

    return () => timers.forEach(clearTimeout)
  }, [phase, savings, totalCredits, perRound])

  useEffect(() => {
    intervalRef.current = setInterval(() => advanceScene(), 4000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [advanceScene])

  useEffect(() => { setPhase('specA') }, [])

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => advanceScene(), 4000)
  }

  const specAVisible = phase !== 'hidden'
  const specBVisible = phase === 'specB' || phase === 'active' || phase === 'readout'
  const isActive = phase === 'active' || phase === 'readout'
  const readoutVisible = phase === 'readout'

  return (
    <div
      className="hl-lab"
      onMouseEnter={() => { if (intervalRef.current) clearInterval(intervalRef.current) }}
      onMouseLeave={resetInterval}
    >
      <div className="hl-header">
        <div className="hl-header-left">
          <div className="hl-dot hl-live" />
          <div className="hl-header-title">Pricing Engine</div>
        </div>
        <div className="hl-header-id">EXP-{String(sceneIndex + 1).padStart(3, '0')}</div>
      </div>

      <div className="hl-body">
        <div className="hl-section-label">Courses</div>

        <div className="hl-specimens">
          <div className={`hl-spec${specAVisible ? ' hl-visible' : ''}${isActive ? ' hl-active' : ''}`}>
            <div className="hl-spec-thumb">
              <Image src={cA.img} alt={cA.name} className="hl-spec-img" width={80} height={80} />
              <div className="hl-spec-id">{String(scene.a + 1).padStart(2, '0')}</div>
            </div>
            <div className="hl-spec-body">
              <div className="hl-spec-name">{cA.name}</div>
              <div className="hl-spec-loc">{cA.loc}</div>
              <div className="hl-spec-data">
                <div className="hl-spec-rack">${cA.rack}</div>
                <div className="hl-spec-credits">{cA.credits} cr</div>
              </div>
            </div>
          </div>

          <div className={`hl-connector${isActive ? ' hl-visible' : ''}`}>
            <div className="hl-connector-ring">+</div>
          </div>

          <div className={`hl-spec${specBVisible ? ' hl-visible' : ''}${isActive ? ' hl-active' : ''}`}>
            <div className="hl-spec-thumb">
              <Image src={cB.img} alt={cB.name} className="hl-spec-img" width={80} height={80} />
              <div className="hl-spec-id">{String(scene.b + 1).padStart(2, '0')}</div>
            </div>
            <div className="hl-spec-body">
              <div className="hl-spec-name">{cB.name}</div>
              <div className="hl-spec-loc">{cB.loc}</div>
              <div className="hl-spec-data">
                <div className="hl-spec-rack">${cB.rack}</div>
                <div className="hl-spec-credits">{cB.credits} cr</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hl-section-label">Analysis</div>
        <div className="hl-readout">
          <div className={`hl-readout-cell${readoutPulse ? ' hl-pulse' : ''}`}>
            <div className="hl-readout-label">Savings</div>
            <div className="hl-readout-value hl-green">${readoutVisible ? savingsDisplay : 0}</div>
            <div className="hl-readout-unit">{readoutVisible ? `−${pct}%` : '-'}</div>
          </div>
          <div className="hl-readout-cell">
            <div className="hl-readout-label">Credits</div>
            <div className="hl-readout-value hl-amber">{readoutVisible ? creditsDisplay : 0}</div>
            <div className="hl-readout-unit">of {tier.credits}</div>
          </div>
          <div className="hl-readout-cell">
            <div className="hl-readout-label">$/Round</div>
            <div className="hl-readout-value hl-white">${readoutVisible ? rateDisplay : 0}</div>
            <div className="hl-readout-unit">with gimmelab</div>
          </div>
        </div>

        <div className="hl-section-label">Package</div>
        <div className={`hl-tier${tierGlow ? ' hl-glow' : ''}`}>
          <div className="hl-tier-badge">{tier.icon}</div>
          <div className="hl-tier-text">
            <div className="hl-tier-name">{tier.label} · {tier.name}</div>
            <div className="hl-tier-sub">{tier.sub}</div>
          </div>
          <div className="hl-tier-price">${tier.price}<span>/mo</span></div>
        </div>
      </div>

      <div className="hl-track">
        {scenes.map((_, i) => (
          <button
            key={i}
            className={`hl-track-seg${i === sceneIndex ? ' hl-track-active' : ''}${i < sceneIndex ? ' hl-track-done' : ''}`}
            onClick={() => { advanceScene(i); resetInterval() }}
            aria-label={`Scene ${i + 1}`}
          >
            <div className="hl-track-fill" />
          </button>
        ))}
      </div>
    </div>
  )
}
