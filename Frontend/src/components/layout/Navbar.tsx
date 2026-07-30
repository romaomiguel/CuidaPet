import { Link, useNavigate } from 'react-router-dom'
import { Menu, LogOut, User, ChevronDown, Search, MessageCircle, CalendarDays } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { authService }  from '@/services/auth.service'
import { avatarUrl }    from '@/utils'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import toast from 'react-hot-toast'

interface NavbarProps {
  onMenuClick: () => void
}

/**
 * Top navbar for the dashboard layout.
 * Contains: hamburger (mobile), logo, user dropdown, notifications placeholder.
 */
export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } finally {
      storeLogout()
      toast.success('Até logo!')
      navigate('/login')
    }
  }

  if (!user) return null

  const isPetsitter = user.role === 'petsitter'
  const profileHref = isPetsitter ? '/dashboard/petsitter?tab=perfil' : '/conta'
  const messagesHref = isPetsitter ? '/dashboard/petsitter?tab=mensagens' : '/conta?tab=mensagens'

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stroke">
      <div className="flex items-center justify-between h-20 px-4 sm:px-6 gap-4">

        {/* Left — hamburger + busca */}
        <div className="flex items-center gap-3 flex-1">
          <button
            id="sidebar-toggle"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-full text-muted hover:text-ink hover:bg-background transition-all flex-shrink-0"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/" className="lg:hidden flex items-center flex-shrink-0">
            <img src="/logo-horizontal-texto.png" alt="PetUno" className="h-14 w-auto" />
          </Link>

          <Link
            to="/buscar"
            className="hidden md:flex items-center gap-2 bg-background rounded-pill px-4 py-2.5 w-full max-w-sm text-sm text-muted hover:bg-stroke/60 transition-colors"
          >
            <Search size={16} /> Buscar cuidadores ou serviços...
          </Link>
        </div>

        {/* Right — actions + user */}
        <div className="flex items-center gap-2 flex-shrink-0">

          <NotificationDropdown />

          {/* User dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              id="user-menu-button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-pill hover:bg-background transition-all"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <img
                src={avatarUrl(user.name, user.avatarUrl ?? undefined)}
                alt={user.name}
                className="avatar-framed w-8 h-8"
              />
              <span className="hidden sm:block text-sm font-semibold text-ink max-w-[120px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <ChevronDown
                size={14}
                className={`text-muted transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-card-hover border border-stroke py-1.5 animate-scale-in z-50">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-stroke">
                  <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                  <span className="mt-1 inline-block badge badge-blue capitalize">
                    {user.role === 'petsitter' ? 'Petsitter' : 'Tutor'}
                  </span>
                </div>

                {isPetsitter && (
                  <Link
                    to="/dashboard/petsitter"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:bg-background transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <CalendarDays size={15} className="text-muted" />
                    Agendamentos
                  </Link>
                )}

                <Link
                  to={profileHref}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:bg-background transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={15} className="text-muted" />
                  Meu perfil
                </Link>

                {user.role !== 'admin' && (
                  <Link
                    to={messagesHref}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:bg-background transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <MessageCircle size={15} className="text-muted" />
                    Mensagens
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error-500 hover:bg-error-50 transition-colors rounded-b-2xl"
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
