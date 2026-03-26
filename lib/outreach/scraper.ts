import * as cheerio from 'cheerio'

export interface ScrapedData {
  rackRateMin: number | null
  rackRateMax: number | null
  gmName: string | null
  email: string | null
  golfnowUrl: string | null
  isDrivingRange: boolean
  bodyText: string
}

const GM_LABELS = ['general manager', 'gm', 'head professional', 'head pro', 'director of golf', 'golf director', 'club manager', 'course manager']
const GREEN_FEE_TERMS = ['green fee', 'greens fee', 'tee time', 'rack rate', 'weekday', 'weekend rate']
const RANGE_TERMS = ['driving range', 'bucket of balls', 'range balls', 'topgolf', 'top golf']

// Sub-pages most likely to have staff/contact info — tried in order
const CONTACT_PATHS = ['/contact', '/contact-us', '/about', '/staff', '/our-staff', '/team', '/our-team', '/management', '/about-us', '/info']

// Emails to ignore (booking platforms, generic noise)
const EMAIL_BLOCKLIST = ['noreply', 'no-reply', 'donotreply', 'support@', 'info@golfnow', 'teetimes@', 'bookings@']

function normaliseBase(url: string): string {
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.host}`
  } catch {
    return url
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Gimmelab-Outreach/1.0' },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function extractPrices(text: string): { min: number | null; max: number | null } {
  const matches = [...text.matchAll(/\$(\d{2,3})(?:\.\d{2})?/g)]
  const prices = matches
    .map(m => parseInt(m[1], 10))
    .filter(p => p >= 20 && p <= 500)

  if (prices.length === 0) return { min: null, max: null }
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

function extractEmails($: cheerio.CheerioAPI, bodyText: string): string | null {
  // 1. Prefer mailto: links — most reliable
  const mailtos: string[] = []
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const addr = href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase()
    if (addr && addr.includes('@') && !EMAIL_BLOCKLIST.some(b => addr.includes(b))) {
      mailtos.push(addr)
    }
  })
  if (mailtos.length > 0) {
    // Prefer addresses that look management-related
    const mgmt = mailtos.find(e =>
      /gm@|manager@|director@|pro@|golf@|head@/.test(e)
    )
    return mgmt ?? mailtos[0]
  }

  // 2. Fall back to regex scan of body text
  const emailRegex = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g
  const found = [...bodyText.matchAll(emailRegex)]
    .map(m => m[0].toLowerCase())
    .filter(e => !EMAIL_BLOCKLIST.some(b => e.includes(b)))

  if (found.length === 0) return null
  const mgmt = found.find(e => /gm@|manager@|director@|pro@|golf@|head@/.test(e))
  return mgmt ?? found[0]
}

function extractGmName($: cheerio.CheerioAPI, bodyText: string): string | null {
  // Strategy 1: find a GM label element and read its sibling/neighbour text
  for (const label of GM_LABELS) {
    const elements = $('*').filter((_, el) => {
      const text = $(el).text().toLowerCase().trim()
      return text === label || text.startsWith(label + ':') || text.startsWith(label + ' -')
    })

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]
      const parent = $(el).parent()
      // Check next sibling
      const siblings = parent.children()
      const idx = siblings.index(el)
      const next = siblings.eq(idx + 1)
      const candidate = next.text().trim()
      if (/^[A-Z][a-z]+(?: [A-Z][a-z.]+){1,3}$/.test(candidate)) return candidate

      // Check parent's next sibling
      const parentSibling = parent.next().text().trim()
      if (/^[A-Z][a-z]+(?: [A-Z][a-z.]+){1,3}$/.test(parentSibling)) return parentSibling
    }
  }

  // Strategy 2: scan raw text for "General Manager: John Smith" or "John Smith, General Manager"
  for (const label of GM_LABELS) {
    // "Label: Name" or "Label - Name"
    const after = new RegExp(`${label}[:\\s\\-]+([A-Z][a-z]+(?: [A-Z][a-z.]+){1,2})`, 'i')
    const matchAfter = bodyText.match(after)
    if (matchAfter) return matchAfter[1]

    // "Name, Label" or "Name | Label"
    const before = new RegExp(`([A-Z][a-z]+(?: [A-Z][a-z.]+){1,2})[,|]\\s*${label}`, 'i')
    const matchBefore = bodyText.match(before)
    if (matchBefore) return matchBefore[1]
  }

  return null
}

function parsePage(html: string): {
  bodyText: string
  gmName: string | null
  email: string | null
  golfnowUrl: string | null
  isDrivingRange: boolean
  prices: { min: number | null; max: number | null }
} {
  const $ = cheerio.load(html)
  $('script, style, nav, footer, header').remove()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const bodyLower = bodyText.toLowerCase()

  const isDrivingRange =
    RANGE_TERMS.some(t => bodyLower.includes(t)) &&
    !GREEN_FEE_TERMS.some(t => bodyLower.includes(t))

  const prices = extractPrices(bodyLower)
  const gmName = extractGmName($, bodyText)
  const email = extractEmails($, bodyText)

  let golfnowUrl: string | null = null
  $('a[href*="golfnow.com"]').each((_, el) => {
    if (!golfnowUrl) golfnowUrl = $(el).attr('href') ?? null
  })

  return { bodyText, gmName, email, golfnowUrl, isDrivingRange, prices }
}

export async function scrapeCourseSite(url: string): Promise<ScrapedData> {
  const empty: ScrapedData = {
    rackRateMin: null,
    rackRateMax: null,
    gmName: null,
    email: null,
    golfnowUrl: null,
    isDrivingRange: false,
    bodyText: '',
  }

  try {
    // ── 1. Scrape homepage ───────────────────────────────────────────────────
    const homeHtml = await fetchPage(url)
    if (!homeHtml) return empty

    const home = parsePage(homeHtml)

    let gmName = home.gmName
    let email = home.email
    let golfnowUrl = home.golfnowUrl
    let { min: rackMin, max: rackMax } = home.prices
    const allBodyText = [home.bodyText]

    // ── 2. Try contact/staff sub-pages until we have both gmName and email ──
    if (!gmName || !email) {
      const base = normaliseBase(url)
      for (const path of CONTACT_PATHS) {
        if (gmName && email) break
        const subHtml = await fetchPage(base + path)
        if (!subHtml) continue

        const sub = parsePage(subHtml)
        allBodyText.push(sub.bodyText)
        if (!gmName && sub.gmName) gmName = sub.gmName
        if (!email && sub.email) email = sub.email
        if (!golfnowUrl && sub.golfnowUrl) golfnowUrl = sub.golfnowUrl
        if (rackMin === null && sub.prices.min !== null) rackMin = sub.prices.min
        if (rackMax === null && sub.prices.max !== null) rackMax = sub.prices.max
      }
    }

    return {
      rackRateMin: rackMin,
      rackRateMax: rackMax,
      gmName,
      email,
      golfnowUrl,
      isDrivingRange: home.isDrivingRange,
      bodyText: allBodyText.join(' ').slice(0, 8000), // cap for classifier
    }
  } catch {
    return empty
  }
}
