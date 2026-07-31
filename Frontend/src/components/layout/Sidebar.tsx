import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  PawPrint,
  User,
  X,
  Settings,
  MessageCircle,
  ArrowLeft,
  Building2,
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
  /** Quando definido, o item troca a aba dentro do hub da conta em vez de navegar pra uma rota nova. */
  tab?: string
  /** Aba assumida quando a URL não tem `?tab=` ou tem um valor que não pertence a este nav
   * (ex.: sub-aba interna do painel de agendamentos, tipo `?tab=historico`). */
  isDefaultTab?: boolean
}

const tutorNav: NavItem[] = [
  { label: 'Buscar',         to: '/buscar',                  icon: <Search size={18} /> },
  { label: 'Meus Pets',      to: '/conta?tab=pets',          icon: <PawPrint size={18} />,      tab: 'pets' },
  { label: 'Agendamentos',   to: '/conta?tab=agendamentos',  icon: <CalendarDays size={18} />,  tab: 'agendamentos' },
  { label: 'Mensagens',      to: '/conta?tab=mensagens',     icon: <MessageCircle size={18} />, tab: 'mensagens' },
  { label: 'Meu Perfil',     to: '/conta',                   icon: <User size={18} />,          tab: 'perfil', isDefaultTab: true },
]

const petsitterNav: NavItem[] = [
  { label: 'Agendamentos',   to: '/dashboard/petsitter',                 icon: <CalendarDays size={18} />,  tab: 'agendamentos', isDefaultTab: true },
  { label: 'Mensagens',      to: '/dashboard/petsitter?tab=mensagens',   icon: <MessageCircle size={18} />, tab: 'mensagens' },
  { label: 'Meu Perfil',     to: '/dashboard/petsitter?tab=perfil',      icon: <Settings size={18} />,      tab: 'perfil' },
]

const partnerNav: NavItem[] = [
  { label: 'Meu Perfil',     to: '/dashboard/partner',                   icon: <Settings size={18} /> },
]

const HUB_PATH: Partial<Record<UserRole, string>> = {
  tutor: '/conta',
  petsitter: '/dashboard/petsitter',
  partner: '/dashboard/partner',
}

const adminNav: NavItem[] = [
  { label: 'Painel',         to: '/admin',                    icon: <LayoutDashboard size={18} /> },
  { label: 'Usuários',       to: '/admin/users',              icon: <User size={18} /> },
  { label: 'Petsitters',     to: '/admin/petsitters',         icon: <PawPrint size={18} /> },
  { label: 'Parceiros',      to: '/admin/partners',           icon: <Building2 size={18} /> },
  { label: 'Suporte',        to: '/admin/suporte',            icon: <MessageCircle size={18} /> },
]

/**
 * Sidebar — fixed on desktop, off-canvas drawer on mobile.
 * Role-aware navigation items.
 */
export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  let navItems = tutorNav
  if (role === 'petsitter') navItems = petsitterNav
  if (role === 'admin') navItems = adminNav
  if (role === 'partner') navItems = partnerNav

  const location = useLocation()
  const hubPath = HUB_PATH[role]
  const knownTabs = navItems.filter(i => i.tab).map(i => i.tab as string)
  const defaultTab = navItems.find(i => i.isDefaultTab)?.tab
  const requestedTab = new URLSearchParams(location.search).get('tab')
  const activeTab = requestedTab && knownTabs.includes(requestedTab) ? requestedTab : defaultTab

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 z-30 h-full w-72 bg-background border-r border-stroke flex flex-col',
        'transition-transform duration-300 ease-in-out',
        // Desktop: always visible
        'lg:translate-x-0',
        // Mobile: slide in/out
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between h-20 px-6 flex-shrink-0">
        <Link to="/" className="lg:hidden flex items-center flex-shrink-0">
          <img src="/logo-imagem.png" alt="PetUno" className="h-12 w-auto" />
        </Link>
        <Link to="/" className="hidden lg:flex items-center flex-shrink-0">
          <img src="/logo-horizontal-texto.png" alt="PetUno" className="h-16 w-auto max-w-[200px] object-contain" />
        </Link>

        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-full text-muted hover:text-ink hover:bg-white transition-all"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Voltar para a Home — fora da lista de navegação, não é uma opção de aba ── */}
      {(role === 'tutor' || role === 'petsitter' || role === 'partner') && (
        <div className="px-6 pb-2 flex-shrink-0">
          <Link
            to="/"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary-600 transition-colors"
          >
            <ArrowLeft size={15} /> Voltar ao início
          </Link>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide">
        {navItems.map(({ label, to, icon, tab }) => {
          const linkClass = tab
            ? (location.pathname === hubPath && activeTab === tab ? 'sidebar-link-active' : 'sidebar-link')
            : undefined

          return tab ? (
            <Link key={to} to={to} onClick={onClose} className={linkClass}>
              {icon}
              {label}
            </Link>
          ) : (
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
          )
        })}
      </nav>

      {/* ── Role badge no rodapé ── */}
      <div className="flex-shrink-0 px-4 py-4">
        <span className={clsx(
          'flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-pill w-full',
          role === 'petsitter' && 'bg-secondary-100 text-secondary-700',
          role === 'admin' && 'bg-error-50 text-error-600',
          role === 'tutor' && 'bg-primary-100 text-primary-700',
          role === 'partner' && 'bg-green-100 text-green-700',
        )}>
          {role === 'petsitter' && '🐕 Petsitter'}
          {role === 'admin' && '👑 Admin'}
          {role === 'tutor' && '🐾 Tutor'}
          {role === 'partner' && '🏪 Parceiro'}
        </span>
      </div>
    </aside>
  )
}
