import api from '@/lib/axios'
import type { Pet, PetPayload } from '@/types'

export const petService = {
  async list(): Promise<Pet[]> {
    const { data } = await api.get<Pet[]>('/pets')
    return data
  },

  async getById(id: string): Promise<Pet> {
    const { data } = await api.get<Pet>(`/pets/${id}`)
    return data
  },

  async create(payload: PetPayload): Promise<Pet> {
    const { data } = await api.post<Pet>('/pets', payload)
    return data
  },

  async update(id: string, payload: Partial<PetPayload>): Promise<Pet> {
    const { data } = await api.patch<Pet>(`/pets/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/pets/${id}`)
  },
}
