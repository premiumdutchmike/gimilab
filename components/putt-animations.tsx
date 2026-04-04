'use client'

import { useEffect } from 'react'

type Cfg = { draw: number; hold: number; fade: number; delay: number; op: number }

const cfgs: Record<string, Cfg> = {
  pl1: { draw: 2800, hold: 1800, fade: 1400, delay: 0,    op: 0.38 },
  pl2: { draw: 3200, hold: 1600, fade: 1200, delay: 900,  op: 0.28 },
  pl3: { draw: 2400, hold: 2000, fade: 1600, delay: 1800, op: 0.22 },
  pl4: { draw: 3600, hold: 1400, fade: 1000, delay: 2600, op: 0.32 },
  pl5: { draw: 2600, hold: 2200, fade: 1400, delay: 3400, op: 0.25 },
}

export default function PuttAnimations() {
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []

    function animLine(el: SVGPathElement, cfg: Cfg) {
      const len = el.getTotalLength()
      el.style.strokeDasharray = String(len)
      el.style.strokeDashoffset = String(len)

      function run() {
        el.style.transition = 'none'
        el.style.strokeDashoffset = String(len)
        el.style.opacity = '0'
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = `stroke-dashoffset ${cfg.draw}ms cubic-bezier(0.25,0.1,0.25,1), opacity 400ms ease`
          el.style.strokeDashoffset = '0'
          el.style.opacity = String(cfg.op)
          timeouts.push(setTimeout(() => {
            el.style.transition = `opacity ${cfg.fade}ms ease`
            el.style.opacity = '0'
            timeouts.push(setTimeout(run, cfg.fade + 1200))
          }, cfg.draw + cfg.hold))
        }))
      }
      timeouts.push(setTimeout(run, cfg.delay))
    }

    document.querySelectorAll<SVGPathElement>('.putt-path').forEach((el) => {
      const cfg = cfgs[el.id]
      if (cfg) animLine(el, cfg)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return null
}
