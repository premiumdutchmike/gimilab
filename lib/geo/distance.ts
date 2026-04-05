/**
 * Minimal Haversine + zip geocoding helpers for the courses filter.
 *
 * We use the free `api.zippopotam.us` endpoint (no key, no rate limit to
 * speak of for a user-typed zip). Results are cached client-side for the
 * session so changing the radius doesn't re-fetch.
 */

const EARTH_RADIUS_MILES = 3958.8

export interface LatLng {
  lat: number
  lng: number
}

/** Great-circle distance between two points in miles. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

// Session cache so we don't refetch the same zip repeatedly
const zipCache = new Map<string, LatLng | null>()

/**
 * Resolve a US zip code to lat/lng via api.zippopotam.us. Returns null if
 * the zip is invalid or the network call fails.
 */
export async function geocodeZip(zip: string): Promise<LatLng | null> {
  const clean = zip.trim()
  if (!/^\d{5}$/.test(clean)) return null

  if (zipCache.has(clean)) return zipCache.get(clean) ?? null

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${clean}`, {
      // Cache aggressively — a zip's coords never change
      cache: 'force-cache',
    })
    if (!res.ok) {
      zipCache.set(clean, null)
      return null
    }
    const json = (await res.json()) as {
      places?: Array<{ latitude: string; longitude: string }>
    }
    const place = json.places?.[0]
    if (!place) {
      zipCache.set(clean, null)
      return null
    }
    const coords = {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
    }
    zipCache.set(clean, coords)
    return coords
  } catch {
    zipCache.set(clean, null)
    return null
  }
}
