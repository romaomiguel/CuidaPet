import api from '@/lib/axios'
import type { SupportMessage, SupportMessagePayload } from '@/types'

export const supportMessageService = {
  async create(payload: SupportMessagePayload): Promise<SupportMessage> {
    const { data } = await api.post<SupportMessage>('/support-messages', payload)
    return data
  },

  async findAll(): Promise<SupportMessage[]> {
    const { data } = await api.get<SupportMessage[]>('/support-messages')
    return data
  },

  async setResolved(id: string, resolved: boolean): Promise<SupportMessage> {
    const { data } = await api.patch<SupportMessage>(`/support-messages/${id}`, { resolved })
    return data
  },
}
