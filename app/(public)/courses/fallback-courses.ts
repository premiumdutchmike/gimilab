export type CourseItem = {
  id: string
  name: string
  address: string
  holes: number
  baseCreditCost: number
  photos: string[]
  slug: string
  type: string
  tags: string[]
}

export const FALLBACK_COURSES: CourseItem[] = [
  { id: 'f1', name: 'Torrey Pines — South Course', address: 'La Jolla, CA', holes: 18, baseCreditCost: 85, photos: ['/imagery/ec840ae06489fb0b720fce0607e3ffcd-1.jpg'], slug: 'torrey-pines-south', type: 'Public', tags: ['18 Holes', 'Par 72', 'Championship'] },
  { id: 'f2', name: 'Aviara Golf Club', address: 'Carlsbad, CA', holes: 18, baseCreditCost: 95, photos: ['/imagery/a4df4bce650ee0f665e64ba92eec3369.jpg'], slug: 'aviara', type: 'Resort', tags: ['18 Holes', 'Par 72', 'Arnold Palmer'] },
  { id: 'f3', name: 'La Jolla Country Club', address: 'La Jolla, CA', holes: 18, baseCreditCost: 85, photos: ['/imagery/6a924e48c7592bc8363c0ed6eadb310b.jpg'], slug: 'la-jolla-cc', type: 'Semi-Private', tags: ['18 Holes', 'Par 71', 'Coastal'] },
  { id: 'f4', name: 'Pelican Hill — North', address: 'Newport Coast, CA', holes: 18, baseCreditCost: 95, photos: ['/imagery/2fdc936959c288273a196478300e6258.jpg'], slug: 'pelican-hill-north', type: 'Resort', tags: ['18 Holes', 'Par 70', 'Ocean Views'] },
  { id: 'f5', name: 'Rancho Bernardo Inn', address: 'San Diego, CA', holes: 18, baseCreditCost: 85, photos: ['/imagery/7022f820197cf708eaefee7b717ca4f4.jpg'], slug: 'rancho-bernardo', type: 'Resort', tags: ['18 Holes', 'Par 72', 'Parkland'] },
  { id: 'f6', name: 'Balboa Park Golf Course', address: 'San Diego, CA', holes: 18, baseCreditCost: 85, photos: ['/imagery/0f48feb5aa1180d23e1b094a568d4bbb.jpg'], slug: 'balboa-park', type: 'Public', tags: ['18 Holes', 'Par 72', 'City Views'] },
  { id: 'f7', name: 'Pala Mesa Resort', address: 'Fallbrook, CA', holes: 18, baseCreditCost: 85, photos: ['/imagery/8657ae739d96c61623e10a50294f04ea.jpg'], slug: 'pala-mesa', type: 'Resort', tags: ['18 Holes', 'Par 72', 'Valley Views'] },
  { id: 'f8', name: 'Steele Canyon Golf Club', address: 'Jamul, CA', holes: 27, baseCreditCost: 95, photos: ['/imagery/a7ad9f79924f885fe8c6a8c3b35bded2.jpg'], slug: 'steele-canyon', type: 'Semi-Private', tags: ['27 Holes', 'Par 71', 'Canyon'] },
  { id: 'f9', name: 'Morgan Run Resort', address: 'Rancho Santa Fe, CA', holes: 18, baseCreditCost: 85, photos: ['/imagery/21d4fdcfc2f31a89f9581a849acd240b.jpg'], slug: 'morgan-run', type: 'Resort', tags: ['18 Holes', 'Par 71', 'Parkland'] },
]
