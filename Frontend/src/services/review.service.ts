import api from '@/lib/axios'
import type { Review, ReviewPayload } from '@/types'

export const reviewService = {
  async create(payload: ReviewPayload): Promise<Review> {
    const { data } = await api.post<Review>('/reviews', payload)
    return data
  },

  async listByPetsitter(petsitterId: string): Promise<Review[]> {
    const { data } = await api.get<Review[]>(`/reviews/petsitter/${petsitterId}`)
    return data
  },
}
