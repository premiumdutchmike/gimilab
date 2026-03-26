import * as cheerio from 'cheerio'

export interface ScrapedData {
  rackRateMin: number | null
  rackRateMax: number | null
  gmName: string | null
  golfnowUrl: string | null
  isDrivingRange: boolean
  bodyText: string
}

const GM_LABELS = ['general manager', 'gm', 'head professional', 'head pro', 'director of golf']
const GREEN_FEE_TERMS = ['green fee', 'greens fee', 'tee time', 'rack rate', 'weekday', 'weekend rate']
const RANGE_TERMS = ['driving range', 'bucket of balls', 'range balls', 'topgolf', 'top golf']

function extractPrices(text: string): { min: number | null; max: number | null } {
  const matches = [...text.matchAll(/\$(\d{2,3})(?:\.\d{2})?/g)]
  const prices = matches
    .map(m => parseInt(m[1], 10))
    .filter(p => p >= 20 && p <= 500)

  if (prices.length === 0) return { min: null, max: null }
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

function extractGmName($: cheerio.CheerioAPI): string | null {
  for (const label of GM_LABELS) {
    const elements = $('*').filter((_, el) => {
      const text = $(el).text().toLowerCase().trim()
      return text === label || text.startsWith(label + ':')
    })

    for (let i = 0; i < elements.length; i++) {
      const parent = $(elements[i]).parent()
      const siblings = parent.children()
      const idx = siblings.index(elements[i])
      const next = siblings.eq(idx + 1)
      const candidate = next.text().trim()
      if (/^[A-Z][a-z]+(?: [A-Z][a-z.]+){1,3}$/.test(candidate)) {
        return candidate
      }
    }
  }
  return null
}

export async function scrapeCourseSite(url: string): Promise<ScrapedData> {
  const empty: ScrapedData = {
    rackRateMin: null,
    rackRateMax: null,
    gmName: null,
    golfnowUrl: null,
    isDrivingRange: false,
    bodyText: '',
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Gimmelab-Outreach/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return empty

    const html = await res.text()
    const $ = cheerio.load(html)

    $('script, style, nav, footer, header').remove()
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().toLowerCase()

    const isDrivingRange =
      RANGE_TERMS.some(t => bodyText.includes(t)) &&
      !GREEN_FEE_TERMS.some(t => bodyText.includes(t))

    const { min, max } = extractPrices(bodyText)

    const gmName = extractGmName($)

    let golfnowUrl: string | null = null
    $('a[href*="golfnow.com"]').each((_, el) => {
      if (!golfnowUrl) golfnowUrl = $(el).attr('href') ?? null
    })

    return { rackRateMin: min, rackRateMax: max, gmName, golfnowUrl, isDrivingRange, bodyText }
  } catch {
    return empty
  }
}
