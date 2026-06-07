import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

import App from './App'
import { authService }  from './services/auth.service'
import { useAuthStore } from './store/auth.store'
import './index.css'

// ─── Session check ao iniciar o app ──────────────────────────────────────────
function SessionInit() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    // Verifica se existe token salvo antes de chamar /auth/me
    let hasToken = false
    try {
      const raw = sessionStorage.getItem('cuidapet-auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        hasToken = !!parsed?.state?.token
      }
    } catch { /* ignora */ }

    if (!hasToken) {
      setLoading(false)
      return
    }

    setLoading(true)
    authService
      .me()
      .then(user => setUser(user))
      .catch(() => useAuthStore.getState().logout())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000,
      gcTime:    5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionInit />
        <App />

        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            },
            success: { iconTheme: { primary: '#1B6EB5', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />

        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
