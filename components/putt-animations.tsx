'use client'

import { useEffect } from 'react'

type Cfg = { draw: number; hold: number; fade: number; delay: number; op: number }

const cfgs: Record<string, Cfg> = {
  pl1: { draw: 2800, hold: 1800, fade: 1400, delay: 0,    op: 0.38 },
  pl2: { draw: 2400, hold: 1600, fade: 1200, delay: 1200, op: 0.30 },
  pl3: { draw: 2000, hold: 1400, fade: 1100, delay: 2600, op: 0.25 },
  pl4: { draw: 1600, hold: 1200, fade: 1000, delay: 3600, op: 0.32 },
  pl5: { draw: 3000, hold: 2000, fade: 1400, delay: 800,  op: 0.20 },
}

export default function PuttAnimations() {
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []

    function animLine(el: SVGPathElement, cfg: Cfg) {
      const len = el.getTotalLength()
      el.style.strokeDasharray = String(len)
      el.style.strokeDashoffset = String(len)
      el.style.opacity = '0'

      function run() {
        el.style.transition = 'none'
        el.style.strokeDashoffset = String(len)
        el.style.opacity = '0'
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = `stroke-dashoffset ${cfg.draw}ms cubic-bezier(0.4,0,0.6,1), opacity ${cfg.draw * 0.3}ms ease`
          el.style.strokeDashoffset = '0'
          el.style.opacity = String(cfg.op)
          timeouts.push(setTimeout(() => {
            el.style.transition = `opacity ${cfg.fade}ms ease, stroke-dashoffset ${cfg.fade * 0.6}ms ease`
            el.style.opacity = '0'
            el.style.strokeDashoffset = String(-len * 0.12)
            timeouts.push(setTimeout(run, cfg.fade + 1200))
          }, cfg.draw + cfg.hold))
        }))
      }
      timeouts.push(setTimeout(run, cfg.delay))
    }

    Object.entries(cfgs).forEach(([id, cfg]) => {
      const el = document.getElementById(id) as unknown as SVGPathElement | null
      if (el) animLine(el, cfg)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return null
}
