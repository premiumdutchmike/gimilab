import { describe, it, expect } from 'vitest'
import { formatPrice } from '@/components/pricing-tier-card'

describe('formatPrice', () => {
  it('formats 9900 cents as "$99 / MO"', () => {
    expect(formatPrice(9900)).toBe('$99 / MO')
  })

  it('formats 14900 cents as "$149 / MO"', () => {
    expect(formatPrice(14900)).toBe('$149 / MO')
  })

  it('strips decimals — 9999 cents renders as "$99 / MO" not "$99.99"', () => {
    expect(formatPrice(9999)).toBe('$99 / MO')
  })

  it('formats 19900 cents as "$199 / MO"', () => {
    expect(formatPrice(19900)).toBe('$199 / MO')
  })
})
