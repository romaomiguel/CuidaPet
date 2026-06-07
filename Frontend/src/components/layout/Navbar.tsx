import { Link, useNavigate } from 'react-router-dom'
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { authService }  from '@/services/auth.service'
import { avatarUrl }    from '@/utils'
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

  const profileHref =
    user.role === 'petsitter'
      ? '/dashboard/petsitter/perfil'
      : '/dashboard/perfil'

  return (
    <header className="sticky top-0 z-30 glass border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">

        {/* Left — hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            id="sidebar-toggle"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          {/* Mobile-only logo */}
          <Link to="/" className="lg:hidden flex items-center gap-1.5">
            <span className="text-xl">🐾</span>
            <span className="font-bold text-gray-900">CuidaPet</span>
          </Link>
        </div>

        {/* Right — actions + user */}
        <div className="flex items-center gap-2">

          {/* Notifications (placeholder) */}
          <button
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
            aria-label="Notificações"
          >
            <Bell size={20} />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary-500" />
          </button>

          {/* User dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              id="user-menu-button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-100 transition-all"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <img
                src={avatarUrl(user.name, user.avatar)}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-200"
              />
              <span className="hidden sm:block text-sm font-semibold text-gray-800 max-w-[120px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-card-hover border border-gray-100 py-1 animate-scale-in z-50">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                  <span className="mt-1 inline-block badge badge-green capitalize">
                    {user.role === 'petsitter' ? 'Petsitter' : 'Tutor'}
                  </span>
                </div>

                <Link
                  to={profileHref}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={15} className="text-gray-400" />
                  Meu perfil
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-2xl"
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
