'use client'

export default function CarouselArrows({ selector }: { selector: string }) {
  function scroll(dir: 'prev' | 'next') {
    const carousel = document.querySelector(selector) as HTMLElement | null
    if (!carousel) return
    const card = carousel.querySelector('[data-card]') as HTMLElement | null
    const amount = card ? card.offsetWidth + 16 : 400
    carousel.scrollBy({ left: dir === 'next' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <div className="carousel-arrows">
      <button className="carousel-arrow" aria-label="Previous courses" onClick={() => scroll('prev')}>←</button>
      <button className="carousel-arrow" aria-label="Next courses" onClick={() => scroll('next')}>→</button>
    </div>
  )
}
