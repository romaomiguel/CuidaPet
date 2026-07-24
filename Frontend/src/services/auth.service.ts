import api, { refreshAccessToken, csrfHeaders } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types'

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    useAuthStore.getState().setToken(data.access_token)
    return data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    // Backend agora cria o usuário e já devolve os tokens numa chamada só.
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    useAuthStore.getState().setToken(data.access_token)
    return data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout', undefined, { headers: csrfHeaders() })
    } catch (err) {
      // Revogação no servidor falhou (refresh token pode continuar válido no banco) — ainda
      // assim limpamos o estado local pra não travar o usuário numa UI presa. Logamos pra
      // não mascarar silenciosamente uma sessão que não foi revogada de verdade.
      console.error('[auth] Falha ao revogar sessão no servidor durante logout:', err)
    } finally {
      useAuthStore.getState().setToken(null)
    }
  },

  /** Usado no boot da app (main.tsx) e pelo interceptor de 401 em lib/axios.ts. */
  async refresh(timeoutMs?: number): Promise<string> {
    return refreshAccessToken(timeoutMs)
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
