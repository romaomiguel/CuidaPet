import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types'

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    useAuthStore.getState().setToken(data.access_token)
    return data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    // Cria o usuário
    await api.post<User>('/auth/register', payload)
    // Faz login automático para obter o token
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email: payload.email,
      password: payload.password,
    })
    useAuthStore.getState().setToken(data.access_token)
    return data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch {
      // logout no servidor é opcional
    } finally {
      useAuthStore.getState().setToken(null)
    }
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  async updateProfile(payload: Partial<User>): Promise<User> {
    const { data } = await api.patch<User>('/auth/profile', payload)
    return data
  },
}
