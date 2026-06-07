import api from '@/lib/axios'
import type { Booking, BookingPayload } from '@/types'

export const bookingService = {
  async list(): Promise<{ data: Booking[] }> {
    const { data } = await api.get<{ data: Booking[] }>('/bookings')
    return data
  },

  async getBusySlots(petsitterId: string): Promise<{ startDate: string, endDate: string }[]> {
    const { data } = await api.get<{ startDate: string, endDate: string }[]>(`/bookings/petsitter/${petsitterId}/busy-slots`)
    return data
  },

  async create(payload: BookingPayload): Promise<Booking> {
    const { data } = await api.post<Booking>('/bookings', payload)
    return data
  },

  async cancel(id: string): Promise<void> {
    await api.patch(`/bookings/${id}/cancel`)
  },

  async accept(id: string): Promise<void> {
    await api.patch(`/bookings/${id}/accept`)
  },

  async decline(id: string): Promise<void> {
    await api.patch(`/bookings/${id}/decline`)
  },

  async complete(id: string): Promise<void> {
    await api.patch(`/bookings/${id}/complete`)
  },
}
