import api, { uploadFile } from '@/lib/axios'
import type { AdminPetsitterProfile, PaginatedResponse, PetsitterFilters, PetsitterProfile } from '@/types'

export type DocumentField = 'identity-proof' | 'address-proof'

export interface MatchParams {
  service: string
  species: string
  city: string
  neighborhood?: string
  date?: string
  startTime?: string
  endTime?: string
  endDate?: string
  maxPrice?: number
  petId?: string
  needsAirConditioning?: boolean
  needsBackyard?: boolean
  preferredWalkSchedule?: 'manha' | 'noite'
  preferredHomeType?: 'casa' | 'apartamento'
}

export type MatchResult = PetsitterProfile & {
  matchScore: number
  matchReasons: string[]
}

export const petsitterService = {
  async getMatches(params: MatchParams): Promise<MatchResult[]> {
    const { data } = await api.post<MatchResult[]>('/petsitters/match', params)
    return data
  },

  async list(filters?: PetsitterFilters): Promise<PaginatedResponse<PetsitterProfile>> {
    const { data } = await api.get<PaginatedResponse<PetsitterProfile>>('/petsitters', {
      params: filters,
    })
    return data
  },

  async getById(id: string): Promise<PetsitterProfile> {
    const { data } = await api.get<PetsitterProfile>(`/petsitters/${id}`)
    return data
  },

  async getCities(): Promise<string[]> {
    const { data } = await api.get<string[]>('/petsitters/cities')
    return data
  },

  async getMyProfile(): Promise<PetsitterProfile> {
    const { data } = await api.get<PetsitterProfile>('/petsitters/me')
    return data
  },

  async updateProfile(payload: Partial<PetsitterProfile>): Promise<PetsitterProfile> {
    const { data } = await api.patch<PetsitterProfile>('/petsitters/me', payload)
    return data
  },

  // ── Admin ────────────────────────────────────────────────────────────────────
  /** Usada só pra contagem/estatística no dashboard admin — sem dados de documento. */
  async adminListPending(): Promise<PaginatedResponse<PetsitterProfile>> {
    const { data } = await api.get<PaginatedResponse<PetsitterProfile>>('/petsitters', {
      params: { limit: 100, status: 'all' },
    })
    return data
  },

  /** Listagem do painel de revisão — endpoint próprio de admin, com indicador de documento. */
  async adminList(): Promise<PaginatedResponse<AdminPetsitterProfile>> {
    const { data } = await api.get<PaginatedResponse<AdminPetsitterProfile>>('/petsitters/admin/list', {
      params: { limit: 100, status: 'all' },
    })
    return data
  },

  async changeStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<PetsitterProfile> {
    const { data } = await api.patch<PetsitterProfile>(`/petsitters/${id}/status`, { status })
    return data
  },

  /** Signed URL (5min) do documento de QUALQUER petsitter — admin only no backend. */
  async getDocumentUrl(profileId: string, field: DocumentField): Promise<{ url: string }> {
    const { data } = await api.get<{ url: string }>(`/petsitters/${profileId}/documents/${field}/url`)
    return data
  },

  // ── Upload de documentos (dono) ─────────────────────────────────────────────
  /** Upload de identity-proof/address-proof — vai pro backend (nunca direto pro Storage). */
  async uploadDocument(field: DocumentField, file: File): Promise<{ url: string }> {
    const form = new FormData()
    form.append('file', file)
    return uploadFile<{ url: string }>(`/petsitters/me/${field}`, form)
  },

  /** Signed URL (5min) do PRÓPRIO documento já enviado. */
  async getMyDocumentUrl(field: DocumentField): Promise<{ url: string }> {
    const { data } = await api.get<{ url: string }>(`/petsitters/me/documents/${field}/url`)
    return data
  },
}
