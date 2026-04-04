'use client'

import { useEffect } from 'react'

/**
 * Cinematic scroll effect for the hero title.
 * As the user scrolls, the h1.hero-title scales up, blurs, and fades out.
 * Inspired by easemize/cinematic-landing-hero on 21st.dev.
 */
export default function HeroScrollEffect() {
  useEffect(() => {
    const title = document.querySelector<HTMLElement>('h1.hero-title')
    if (!title) return

    let ticking = false

    function update() {
      ticking = false
      const y = window.scrollY
      // Max effect reached after scrolling ~600px
      const progress = Math.min(y / 600, 1)

      const scale = 1 + progress * 0.15     // 1 → 1.15
      const blur = progress * 20             // 0 → 20px
      const opacity = 1 - progress           // 1 → 0

      title!.style.setProperty('--hero-scale', String(scale))
      title!.style.setProperty('--hero-blur', `${blur}px`)
      title!.style.setProperty('--hero-opacity', String(opacity))
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
