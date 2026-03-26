import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeCourseSite } from '../scraper'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => vi.clearAllMocks())

function mockHtml(html: string) {
  mockFetch.mockResolvedValueOnce({ ok: true, text: async () => html })
}

describe('scrapeCourseSite', () => {
  it('extracts green fee prices from text', async () => {
    mockHtml(`
      <html><body>
        <p>Weekday green fees: $45 - $75</p>
        <p>Weekend rates from $85</p>
      </body></html>
    `)
    const result = await scrapeCourseSite('https://example.com')
    expect(result.rackRateMin).toBe(45)
    expect(result.rackRateMax).toBe(85)
  })

  it('extracts GM name from staff page link', async () => {
    mockHtml(`
      <html><body>
        <h3>General Manager</h3>
        <p>John Brady</p>
      </body></html>
    `)
    const result = await scrapeCourseSite('https://example.com')
    expect(result.gmName).toBe('John Brady')
  })

  it('detects GolfNow link', async () => {
    mockHtml(`
      <html><body>
        <a href="https://www.golfnow.com/courses/123">Book on GolfNow</a>
      </body></html>
    `)
    const result = await scrapeCourseSite('https://example.com')
    expect(result.golfnowUrl).toBe('https://www.golfnow.com/courses/123')
  })

  it('flags driving range when no green fee language found', async () => {
    mockHtml(`
      <html><body>
        <h1>Top Driving Range</h1>
        <p>Bucket of balls: $12</p>
      </body></html>
    `)
    const result = await scrapeCourseSite('https://example.com')
    expect(result.isDrivingRange).toBe(true)
  })

  it('returns null prices when none found', async () => {
    mockHtml(`<html><body><p>Welcome to our course</p></body></html>`)
    const result = await scrapeCourseSite('https://example.com')
    expect(result.rackRateMin).toBeNull()
    expect(result.rackRateMax).toBeNull()
  })

  it('returns empty ScrapedData on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, text: async () => '' })
    const result = await scrapeCourseSite('https://example.com')
    expect(result.rackRateMin).toBeNull()
    expect(result.bodyText).toBe('')
  })
})
