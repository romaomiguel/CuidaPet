import api from '@/lib/axios'
import type { LocationCheckIn } from '@/types'

export const locationService = {
  async sendCheckIn(bookingId: string, latitude: number, longitude: number): Promise<LocationCheckIn> {
    const { data } = await api.post<LocationCheckIn>(`/bookings/${bookingId}/location-checkins`, {
      latitude,
      longitude,
    })
    return data
  },

  async listCheckIns(bookingId: string): Promise<LocationCheckIn[]> {
    const { data } = await api.get<LocationCheckIn[]>(`/bookings/${bookingId}/location-checkins`)
    return data
  },
}
