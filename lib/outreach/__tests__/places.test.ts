import { describe, it, expect, vi, beforeEach } from 'vitest'
import { geocodeLocation, searchGolfCourses } from '../places'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
  process.env.GOOGLE_PLACES_API_KEY = 'test-key'
})

describe('geocodeLocation', () => {
  it('returns lat/lng for a valid location', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        status: 'OK',
        results: [{ geometry: { location: { lat: 39.9526, lng: -75.1652 } } }],
      }),
    })

    const result = await geocodeLocation('Philadelphia, PA')
    expect(result).toEqual({ lat: 39.9526, lng: -75.1652 })
  })

  it('throws when geocoding fails', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
    })

    await expect(geocodeLocation('zzz invalid')).rejects.toThrow('Geocoding failed')
  })
})

describe('searchGolfCourses', () => {
  it('returns mapped PlaceResult array', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({
        places: [
          {
            id: 'place123',
            displayName: { text: 'Fox Hollow Golf Club' },
            formattedAddress: '2020 New Falls Rd, Levittown, PA',
            websiteUri: 'https://foxhollowgolf.com',
            nationalPhoneNumber: '(215) 949-1900',
          },
        ],
      }),
    })

    const results = await searchGolfCourses(39.95, -75.16, 30)
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({
      googlePlaceId: 'place123',
      courseName: 'Fox Hollow Golf Club',
      formattedAddress: '2020 New Falls Rd, Levittown, PA',
      websiteUrl: 'https://foxhollowgolf.com',
      phone: '(215) 949-1900',
    })
  })

  it('returns empty array when no places returned', async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({}) })
    const results = await searchGolfCourses(39.95, -75.16, 30)
    expect(results).toEqual([])
  })

  it('fetches multiple pages and deduplicates', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          places: [{ id: 'p1', displayName: { text: 'Course A' }, formattedAddress: '', websiteUri: null, nationalPhoneNumber: null }],
          nextPageToken: 'tok1',
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          places: [
            { id: 'p2', displayName: { text: 'Course B' }, formattedAddress: '', websiteUri: null, nationalPhoneNumber: null },
            { id: 'p1', displayName: { text: 'Course A' }, formattedAddress: '', websiteUri: null, nationalPhoneNumber: null },
          ],
        }),
      })

    const results = await searchGolfCourses(39.95, -75.16, 30)
    expect(results).toHaveLength(2)
    expect(results.map(r => r.googlePlaceId)).toEqual(['p1', 'p2'])
  })
})
