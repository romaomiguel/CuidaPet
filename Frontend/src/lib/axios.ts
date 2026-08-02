import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth.store'

// Requisições de polling (chat) marcam silentError: true pra pular o toast global de erro —
// senão um backend fora do ar vira um toast novo a cada 3-5s. A UI dessas telas mostra um
// aviso inline no lugar; erros de ações explícitas do usuário continuam com toast normal.
declare module 'axios' {
  export interface AxiosRequestConfig {
    silentError?: boolean
  }
}

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'x-csrf-token'
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

// Header do double-submit CSRF (ver CsrfGuard no backend) — usado em toda requisição que
// muda estado no /auth (refresh, logout). Lê o valor atual do cookie a cada chamada, nunca cacheia.
export function csrfHeaders(): Record<string, string> {
  return { [CSRF_HEADER]: getCookie(CSRF_COOKIE) ?? '' }
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true, // necessário pra enviar/receber o cookie httpOnly do refresh token
})

// Instância separada, sem interceptors — usada só pra chamar /auth/refresh, pra não entrar
// recursivamente no interceptor de resposta do `api`.
const refreshClient = axios.create({ baseURL: BASE_URL, withCredentials: true })

// Promise compartilhada: 401s concorrentes (várias requisições em paralelo expirando ao
// mesmo tempo) esperam o MESMO refresh em vez de disparar um pra cada.
let refreshPromise: Promise<string> | null = null

export async function refreshAccessToken(timeoutMs = 15000): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ access_token: string }>(
        '/auth/refresh',
        null,
        { timeout: timeoutMs, headers: csrfHeaders() },
      )
      .then(({ data }) => {
        useAuthStore.getState().setToken(data.access_token)
        return data.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// ── Request: injeta o Bearer Token JWT (em memória) em toda requisição ────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response ──────────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const isAuthEndpoint = originalConfig?.url?.includes('/auth/refresh') || originalConfig?.url?.includes('/auth/login')

    // Access token expirado — tenta renovar UMA vez e refaz a requisição original.
    if (error.response?.status === 401 && originalConfig && !originalConfig._retry && !isAuthEndpoint) {
      originalConfig._retry = true
      try {
        const newToken = await refreshAccessToken()
        originalConfig.headers = originalConfig.headers ?? {}
        ;(originalConfig.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
        return api(originalConfig)
      } catch {
        useAuthStore.getState().logout()
        const publicPaths = ['/login', '/cadastro', '/', '/buscar']
        const isOnPublicPage = publicPaths.some(p => window.location.pathname.startsWith(p))
        if (!isOnPublicPage) {
          window.location.href = '/'
        }
        return Promise.reject(error)
      }
    }

    // Sessão realmente encerrada (refresh também falhou) — não se aplica ao 401 do
    // próprio /auth/login (senha errada): esse cai adiante e mostra o toast normal.
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const publicPaths = ['/login', '/cadastro', '/', '/buscar']
      const isOnPublicPage = publicPaths.some(p => window.location.pathname.startsWith(p))
      if (!isOnPublicPage) {
        useAuthStore.getState().logout()
        window.location.href = '/'
      }
      return Promise.reject(error)
    }

    // Erro de rede / CORS / backend offline
    if (!error.response) {
      if (!originalConfig?.silentError) {
        toast.error(
          'Não foi possível conectar ao servidor. ' +
          'Verifique se a API está rodando em localhost:3000.',
          { id: 'network-error', duration: 5000 }
        )
      }
      return Promise.reject(error)
    }

    // Erros de validação (422) — tratados pelo formulário
    if (error.response.status === 422) {
      return Promise.reject(error)
    }

    if (originalConfig?.silentError) {
      return Promise.reject(error)
    }

    // Outros erros HTTP (inclui os 400 Bad Request de validação do NestJS)
    const msgData = error.response.data?.message

    // O NestJS costuma enviar um Array de strings quando falha na validação de DTOs
    let messageToDisplay = 'Ocorreu um erro inesperado'
    if (Array.isArray(msgData) && msgData.length > 0) {
      messageToDisplay = msgData[0] // Mostra o primeiro erro de forma limpa
    } else if (typeof msgData === 'string') {
      messageToDisplay = msgData
    }

    toast.error(messageToDisplay)

    return Promise.reject(error)
  },
)

// Uploads passam por conexões mais lentas e (no Render free tier) podem coincidir com
// o wake-up do backend hibernado — mesma razão do BOOT_REFRESH_TIMEOUT_MS no boot.
const UPLOAD_TIMEOUT_MS = 45000

/**
 * POST multipart pro backend. NUNCA setar 'Content-Type': 'multipart/form-data' manualmente
 * — isso quebra o boundary. Aqui removemos o header default (json) do `api` e deixamos o
 * browser gerar o Content-Type correto (com boundary) sozinho ao ver um FormData.
 */
export async function uploadFile<T>(url: string, formData: FormData): Promise<T> {
  const { data } = await api.post<T>(url, formData, {
    headers: { 'Content-Type': undefined },
    timeout: UPLOAD_TIMEOUT_MS,
  })
  return data
}

export default api
