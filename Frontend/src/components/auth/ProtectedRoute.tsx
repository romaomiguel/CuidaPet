import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types'
import { Spinner } from '@/components/ui/Spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

/**
 * Guards private routes.
 * - Redirects unauthenticated users to /login
 * - Redirects authenticated users that don't match the required role to /404
 * - Shows a full-page spinner while the session is loading
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-2xl">🐾</span>
          </div>
          <Spinner size="md" />
          <p className="text-sm text-muted">Verificando sessão…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Authenticated but wrong role — send to their own dashboard
    const fallback = user.role === 'petsitter' ? '/dashboard/petsitter' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
