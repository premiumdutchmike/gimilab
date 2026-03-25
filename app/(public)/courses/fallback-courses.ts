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
  { id: 'f1', name: 'Torrey Pines — South Course', address: 'La Jolla, CA', holes: 18, baseCreditCost: 85, photos: ['https://www.torreypines.com/wp-content/uploads/2024/10/Torrey-Pines-Golden-Hour-Aerial.jpg'], slug: 'torrey-pines-south', type: 'Public', tags: ['18 Holes', 'Par 72', 'Championship'] },
  { id: 'f2', name: 'Aviara Golf Club', address: 'Carlsbad, CA', holes: 18, baseCreditCost: 95, photos: ['https://www.sandiegogolf.com/wp-content/uploads/2020/07/Aviara-Golf-1-scaled.jpg'], slug: 'aviara', type: 'Public', tags: ['18 Holes', 'Par 72', 'Arnold Palmer'] },
  { id: 'f3', name: 'La Jolla Country Club', address: 'La Jolla, CA', holes: 18, baseCreditCost: 85, photos: ['https://golf-pass-brightspot.s3.amazonaws.com/2c/0a/aeb4828006693037a1c886876cfc/90610.jpg'], slug: 'la-jolla-cc', type: 'Public', tags: ['18 Holes', 'Par 71', 'Coastal'] },
  { id: 'f4', name: 'Pelican Hill — North', address: 'Newport Coast, CA', holes: 18, baseCreditCost: 95, photos: ['https://visitnewportbeach.com/wp-content/uploads/2013/06/GS_VNB_PelicanHillGC.jpg'], slug: 'pelican-hill-north', type: 'Public', tags: ['18 Holes', 'Par 70', 'Ocean Views'] },
  { id: 'f5', name: 'Rancho Bernardo Inn', address: 'San Diego, CA', holes: 18, baseCreditCost: 85, photos: ['https://symphony.cdn.tambourine.com/rancho-bernado-inn/media/ranchobernardoinn-golf-header-65ba5d1c9bb02.webp'], slug: 'rancho-bernardo', type: 'Public', tags: ['18 Holes', 'Par 72', 'Parkland'] },
  { id: 'f6', name: 'Balboa Park Golf Course', address: 'San Diego, CA', holes: 18, baseCreditCost: 85, photos: ['https://alwaystimefor9.com/wp-content/uploads/2019/12/BalboaParkGC6-800x599.jpg'], slug: 'balboa-park', type: 'Public', tags: ['18 Holes', 'Par 72', 'City Views'] },
  { id: 'f7', name: 'Pala Mesa Resort', address: 'Fallbrook, CA', holes: 18, baseCreditCost: 85, photos: ['https://www.torreypines.com/wp-content/uploads/2017/11/pala_mesa_1_lightbox.jpg'], slug: 'pala-mesa', type: 'Public', tags: ['18 Holes', 'Par 72', 'Valley Views'] },
  { id: 'f8', name: 'Steele Canyon Golf Club', address: 'Jamul, CA', holes: 27, baseCreditCost: 95, photos: ['https://www.steelecanyon.com/wp-content/uploads/sites/8414/2022/01/Canyon-overhead2.jpg'], slug: 'steele-canyon', type: 'Public', tags: ['27 Holes', 'Par 71', 'Canyon'] },
  { id: 'f9', name: 'Morgan Run Resort', address: 'Rancho Santa Fe, CA', holes: 18, baseCreditCost: 85, photos: ['https://lavallecoastalclub.com/wp-content/uploads/la_valle_coastal_resort_golf_1578.jpg'], slug: 'morgan-run', type: 'Public', tags: ['18 Holes', 'Par 71', 'Parkland'] },
]
