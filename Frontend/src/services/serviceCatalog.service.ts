import api from '@/lib/axios'
import type { Service } from '@/types'

export const serviceCatalogService = {
  /** Sem filtro nenhum, devolve TODOS os serviços (ativos e inativos) — quem consome
   * decide se filtra por isActive/audience no cliente (ver useServiceCatalog). */
  async list(filters: { audience?: string; isActive?: boolean } = {}): Promise<Service[]> {
    const { data } = await api.get<Service[]>('/services', { params: filters })
    return data
  },

  // Admin only
  async create(payload: { name: string; emoji: string; description: string; audience: string }): Promise<Service> {
    const { data } = await api.post<Service>('/services', payload)
    return data
  },

  // Admin only
  async update(id: string, payload: Partial<{ name: string; emoji: string; description: string; audience: string; isActive: boolean }>): Promise<Service> {
    const { data } = await api.patch<Service>(`/services/${id}`, payload)
    return data
  },
}
