import api from '@/lib/axios'
import type { PaginatedResponse, PetsitterFilters, PetsitterProfile } from '@/types'

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
  async adminListPending(): Promise<PaginatedResponse<PetsitterProfile>> {
    // Para o admin, buscamos todos para gerenciar (pending, approved, rejected)
    const { data } = await api.get<PaginatedResponse<PetsitterProfile>>('/petsitters', {
      params: { limit: 100, status: 'all' },
    })
    return data
  },

  async changeStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<PetsitterProfile> {
    const { data } = await api.patch<PetsitterProfile>(`/petsitters/${id}/status`, { status })
    return data
  },
}
