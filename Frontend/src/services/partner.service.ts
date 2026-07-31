import api from '@/lib/axios'
import type { PartnerProfile, CreatePartnerPayload, UpdatePartnerPayload, PartnerType } from '@/types'

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
}
