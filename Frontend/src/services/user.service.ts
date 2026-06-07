import api from '@/lib/axios'
import type { User } from '@/types'

export const userService = {
  // Admin only
  async findAll(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users')
    return data
  },

  // Admin only
  async changeStatus(id: string, isActive: boolean): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}/status`, { isActive })
    return data
  }
}
