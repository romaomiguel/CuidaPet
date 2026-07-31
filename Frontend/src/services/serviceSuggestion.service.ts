import api from '@/lib/axios'
import type { ServiceSuggestion } from '@/types'

interface PaginatedSuggestions {
  data: ServiceSuggestion[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const serviceSuggestionService = {
  /** Petsitter ou Parceiro logado sugerindo um serviço novo. */
  async create(description: string): Promise<ServiceSuggestion> {
    const { data } = await api.post<ServiceSuggestion>('/service-suggestions', { description })
    return data
  },

  // Admin only
  async adminList(filters: { status?: string; page?: number; limit?: number } = {}): Promise<PaginatedSuggestions> {
    const { data } = await api.get<PaginatedSuggestions>('/service-suggestions', { params: filters })
    return data
  },

  // Admin only
  async markReviewed(id: string): Promise<ServiceSuggestion> {
    const { data } = await api.patch<ServiceSuggestion>(`/service-suggestions/${id}/status`, { status: 'reviewed' })
    return data
  },
}
