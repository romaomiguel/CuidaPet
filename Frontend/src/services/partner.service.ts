import api, { uploadFile } from '@/lib/axios'
import type { PartnerProfile, PublicPartnerProfile, CreatePartnerPayload, UpdatePartnerPayload, PartnerType, ServiceType } from '@/types'

interface PaginatedPartners {
  data: PartnerProfile[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const partnerService = {
  // Admin only
  async create(payload: CreatePartnerPayload): Promise<PartnerProfile> {
    const { data } = await api.post<PartnerProfile>('/partners', payload)
    return data
  },

  // Admin only
  async findAllForAdmin(filters: { type?: PartnerType; city?: string; page?: number; limit?: number } = {}): Promise<PaginatedPartners> {
    const { data } = await api.get<PaginatedPartners>('/partners/admin/list', { params: filters })
    return data
  },

  async findMe(): Promise<PartnerProfile> {
    const { data } = await api.get<PartnerProfile>('/partners/me')
    return data
  },

  async updateMe(payload: UpdatePartnerPayload): Promise<PartnerProfile> {
    const { data } = await api.patch<PartnerProfile>('/partners/me', payload)
    return data
  },

  async getById(id: string): Promise<PublicPartnerProfile> {
    const { data } = await api.get<PublicPartnerProfile>(`/partners/${id}`)
    return data
  },

  async addPhoto(file: File): Promise<{ photos: string[] }> {
    const form = new FormData()
    form.append('photo', file)
    return uploadFile<{ photos: string[] }>('/partners/me/photos', form)
  },

  /** `index` é a posição da foto no array — mesma razão do `petsitterService.removePhoto`. */
  async removePhoto(index: number): Promise<{ photos: string[] }> {
    const { data } = await api.delete<{ photos: string[] }>(`/partners/me/photos/${index}`)
    return data
  },

  /** Listagem pública — usada pela SearchPage (aba Clínicas/Petshops) e pelo MatchResults. */
  async list(filters: { type?: PartnerType; service?: ServiceType; city?: string; page?: number; limit?: number } = {}): Promise<{
    data: PublicPartnerProfile[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const { data } = await api.get('/partners', { params: filters })
    return data
  },
}
