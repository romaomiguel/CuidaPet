import { Outlet, Navigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { AmbientBlobs } from '@/components/ui/AmbientBlobs'

export function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    let to = '/buscar'
    if (user.role === 'admin') to = '/admin'
    if (user.role === 'petsitter') to = '/dashboard/petsitter/perfil'

    return <Navigate to={to} replace />
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <AmbientBlobs />

      {/* ── Header fixo transparente ── */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="h-20 max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo-horizontal-texto.png" alt="PetUno" className="h-20 w-auto" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary-800 transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para Home
          </Link>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center pt-20 pb-12 px-6">
        <Outlet />
      </main>
    </div>
  )
}
