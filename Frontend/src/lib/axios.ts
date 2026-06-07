import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request: injeta o Bearer Token JWT em toda requisição ─────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lê o token do sessionStorage onde o zustand persiste o estado
    try {
      const raw = localStorage.getItem('cuidapet-auth')
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { token?: string } }
        const token = parsed?.state?.token
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`)
        }
      }
    } catch {
      // Silencioso — se não conseguir ler, segue sem o token
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response ──────────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    // Sessão expirada — redireciona para login
    if (error.response?.status === 401) {
      const publicPaths = ['/login', '/cadastro', '/', '/buscar']
      const isOnPublicPage = publicPaths.some(p => window.location.pathname.startsWith(p))
      if (!isOnPublicPage) {
        // Limpa o token expirado do sessionStorage
        try {
          const raw = localStorage.getItem('cuidapet-auth')
          if (raw) {
            const parsed = JSON.parse(raw) as { state?: object }
            if (parsed?.state) {
              localStorage.setItem('cuidapet-auth', JSON.stringify({
                ...parsed,
                state: { ...parsed.state, token: null, isAuthenticated: false, user: null },
              }))
            }
          }
        } catch { /* ignora */ }
        window.location.href = '/'
      }
      return Promise.reject(error)
    }

    // Erro de rede / CORS / backend offline
    if (!error.response) {
      toast.error(
        'Não foi possível conectar ao servidor. ' +
        'Verifique se a API está rodando em localhost:3000.',
        { id: 'network-error', duration: 5000 }
      )
      return Promise.reject(error)
    }

    // Erros de validação (422) — tratados pelo formulário
    if (error.response.status === 422) {
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

export default api
