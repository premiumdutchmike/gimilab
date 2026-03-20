export interface SlotSummary {
  id: string
  teeTime: string
  creditCost: number
  availableSpots: number
  courseName: string
}

export type BookingStatus = 'BOOKED' | 'CANCELLED' | 'COMPLETED'

export interface BookingSummary {
  id: string
  courseName: string
  teeTime: string
  creditCost: number
  status: BookingStatus
}
