import api, { uploadFile } from '@/lib/axios'
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
  },

  /** Upload do avatar do usuário logado — vai pro backend (nunca direto pro Storage). */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData()
    form.append('avatar', file)
    return uploadFile<{ avatarUrl: string }>('/users/me/avatar', form)
  },
}
