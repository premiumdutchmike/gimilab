const PLACES_BASE = 'https://places.googleapis.com/v1'
const GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode/json'

export interface PlaceResult {
  googlePlaceId: string
  courseName: string
  formattedAddress: string
  websiteUrl: string | null
  phone: string | null
}

export async function geocodeLocation(location: string): Promise<{ lat: number; lng: number }> {
  const url = new URL(GEOCODE_BASE)
  url.searchParams.set('address', location)
  url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY!)

  const res = await fetch(url.toString())
  const data = await res.json() as {
    status: string
    results: Array<{ geometry: { location: { lat: number; lng: number } } }>
  }

  if (data.status !== 'OK' || !data.results[0]) {
    throw new Error(`Geocoding failed for "${location}": ${data.status}`)
  }

  return data.results[0].geometry.location
}

interface RawPlace {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  websiteUri?: string
  nationalPhoneNumber?: string
}

export async function searchGolfCourses(
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<PlaceResult[]> {
  const radiusMeters = Math.min(radiusMiles * 1609.34, 50000) // Places API max 50km
  const seen = new Set<string>()
  const results: PlaceResult[] = []
  let pageToken: string | undefined

  do {
    const body: Record<string, unknown> = {
      includedTypes: ['golf_course'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    }
    if (pageToken) body.pageToken = pageToken

    const res = await fetch(`${PLACES_BASE}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,nextPageToken',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json() as { places?: RawPlace[]; nextPageToken?: string }
    pageToken = data.nextPageToken

    for (const p of data.places ?? []) {
      if (seen.has(p.id)) continue
      seen.add(p.id)
      results.push({
        googlePlaceId: p.id,
        courseName: p.displayName?.text ?? '',
        formattedAddress: p.formattedAddress ?? '',
        websiteUrl: p.websiteUri ?? null,
        phone: p.nationalPhoneNumber ?? null,
      })
    }
  } while (pageToken)

  return results
}
