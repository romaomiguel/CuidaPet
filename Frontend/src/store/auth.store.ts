import { create } from 'zustand'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

// Nada aqui é persistido (sem localStorage/sessionStorage) — access token e user vivem só
// em memória. A sessão sobrevive a um F5 porque o boot da app (ver main.tsx) tenta renovar
// silenciosamente via /auth/refresh (cookie httpOnly), não porque algo ficou salvo no browser.
export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
    }),

  setToken: (token) => set({ token }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}))
