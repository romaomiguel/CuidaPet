import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  PawPrint,
  User,
  X,
  Settings,
} from 'lucide-react'
import clsx from 'clsx'
import type { UserRole } from '@/types'

interface SidebarProps {
  role: UserRole
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

const tutorNav: NavItem[] = [
  { label: 'Painel',         to: '/dashboard',                  icon: <LayoutDashboard size={18} /> },
  { label: 'Buscar',         to: '/dashboard/buscar',           icon: <Search size={18} /> },
  { label: 'Agendamentos',   to: '/dashboard/agendamentos',     icon: <CalendarDays size={18} /> },
  { label: 'Meus Pets',      to: '/dashboard/pets',             icon: <PawPrint size={18} /> },
  { label: 'Perfil',         to: '/dashboard/perfil',           icon: <User size={18} /> },
]

const petsitterNav: NavItem[] = [
  { label: 'Painel',         to: '/dashboard/petsitter',                    icon: <LayoutDashboard size={18} /> },
  { label: 'Agendamentos',   to: '/dashboard/petsitter/agendamentos',       icon: <CalendarDays size={18} /> },
  { label: 'Meu Perfil',     to: '/dashboard/petsitter/perfil',             icon: <Settings size={18} /> },
]

const adminNav: NavItem[] = [
  { label: 'Painel',         to: '/admin',                    icon: <LayoutDashboard size={18} /> },
  { label: 'Usuários',       to: '/admin/users',              icon: <User size={18} /> },
  { label: 'Petsitters',     to: '/admin/petsitters',         icon: <PawPrint size={18} /> },
]

/**
 * Sidebar — fixed on desktop, off-canvas drawer on mobile.
 * Role-aware navigation items.
 */
export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  let navItems = tutorNav
  if (role === 'petsitter') navItems = petsitterNav
  if (role === 'admin') navItems = adminNav

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-100 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        // Desktop: always visible
        'lg:translate-x-0',
        // Mobile: slide in/out
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2" onClick={onClose}>
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-bold text-gray-900 tracking-tight">CuidaPet</span>
        </Link>

        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Role badge ── */}
      <div className="px-5 pt-4 pb-2">
        <span className={clsx(
          'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full',
          role === 'petsitter' && 'bg-secondary-50 text-secondary-700',
          role === 'admin' && 'bg-red-50 text-red-700',
          role === 'tutor' && 'bg-primary-50 text-primary-700',
        )}>
          {role === 'petsitter' && '🐕 Petsitter'}
          {role === 'admin' && '👑 Admin'}
          {role === 'tutor' && '👤 Tutor'}
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-hide">
        {navItems.map(({ label, to, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer branding ── */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-muted text-center">
          CuidaPet © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}
