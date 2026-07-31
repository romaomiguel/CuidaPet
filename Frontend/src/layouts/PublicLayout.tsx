import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, Search, LogOut, User, CalendarDays, PawPrint, LayoutDashboard, MessageCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { authService }  from '@/services/auth.service'
import { chatService }  from '@/services/chat.service'
import { avatarUrl }    from '@/utils'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export function PublicLayout() {
  const { isAuthenticated, user, logout: storeLogout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Badge de não lidas — vive no layout (não só na página de chat) pois o link "Chats" e o
  // indicador no avatar aparecem em qualquer tela logada. Admin não tem chat.
  const chatEnabled = isAuthenticated && user?.role !== 'admin'
  const { data: unread } = useQuery({
    queryKey: ['chat', 'unread-count'],
    queryFn: () => chatService.getUnreadCount(true),
    refetchInterval: 30000,
    enabled: chatEnabled,
  })
  const unreadCount = chatEnabled ? unread?.count ?? 0 : 0

  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    try { await authService.logout() } finally {
      storeLogout()
      toast.success('Até logo!')
      navigate('/login')
    }
  }

  const chatBadge = unreadCount > 0 ? unreadCount : undefined

  // Pets e agendamentos agora vivem como abas dentro de "Minha conta" — não precisam de
  // entrada própria aqui. Chat ganha atalho direto porque é a ação mais frequente.
  const tutorLinks = [
    { to: '/conta',                icon: <User size={15} />,          label: 'Minha conta' },
    { to: '/conta?tab=mensagens',  icon: <MessageCircle size={15} />, label: 'Chat', badge: chatBadge },
  ]
  // Painel/Agendamentos e Perfil agora vivem no mesmo hub — mesma ideia do tutor.
  const petsitterLinks = [
    { to: '/dashboard/petsitter',                icon: <CalendarDays size={15} />,    label: 'Agendamentos' },
    { to: '/dashboard/petsitter?tab=mensagens',  icon: <MessageCircle size={15} />,   label: 'Chat', badge: chatBadge },
    { to: '/dashboard/petsitter?tab=perfil',     icon: <User size={15} />,            label: 'Minha conta' },
  ]
  const adminLinks: typeof tutorLinks = [
    { to: '/admin',            icon: <LayoutDashboard size={15} />, label: 'Painel Admin', badge: undefined },
    { to: '/admin/users',      icon: <User size={15} />,            label: 'Usuários',     badge: undefined },
    { to: '/admin/petsitters', icon: <PawPrint size={15} />,        label: 'Petsitters',   badge: undefined },
  ]
  const partnerLinks: typeof tutorLinks = [
    { to: '/dashboard/partner', icon: <User size={15} />, label: 'Minha conta' },
  ]
  const accountLinks =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'petsitter' ? petsitterLinks :
    user?.role === 'partner' ? partnerLinks :
    tutorLinks

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ─── Navbar ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white border-b border-stroke shadow-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* ─── Área Esquerda: Logo ─── */}
            <div className="flex items-center min-w-max">
              <Link to="/" className="flex items-center flex-shrink-0 group">
                <img
                  src="/logo-horizontal-texto.png"
                  alt="PetUno"
                  className="h-20 w-auto group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              </Link>
            </div>

            {/* ─── Área Central: Navegação ─── */}
            <nav className="hidden md:flex flex-1 justify-center items-center gap-6 lg:gap-10">
              <Link to="/buscar" className="text-base font-medium text-muted hover:text-secondary-500 transition-colors whitespace-nowrap">
                Encontrar petsitter
              </Link>
              <Link to="/" className="text-base font-medium text-muted hover:text-secondary-500 transition-colors whitespace-nowrap" onClick={() => window.scrollTo(0, 1000)}>
                Como funciona
              </Link>
              <Link to="/ajuda" className="text-base font-medium text-muted hover:text-secondary-500 transition-colors whitespace-nowrap">
                Ajuda
              </Link>
              <Link to="/cadastro" className="text-base font-medium text-muted hover:text-secondary-500 transition-colors whitespace-nowrap">
                Quero ser Petsitter
              </Link>
            </nav>

              {/* ─── Área Direita: Autenticação ─── */}
            <div className="flex items-center justify-end min-w-max gap-2">
              {chatEnabled && <NotificationDropdown />}
              {isAuthenticated && user ? (
                <div ref={dropdownRef} className="relative">
                  <button
                    id="user-menu"
                    onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-background transition-all"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={avatarUrl(user.name, user.avatarUrl ?? undefined)}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100"
                      />
                      {!dropdownOpen && unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary-500 ring-2 ring-white" />
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-semibold text-ink truncate max-w-[100px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className={clsx('text-muted transition-transform duration-200', dropdownOpen && 'rotate-180')} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-stroke py-1.5 animate-scale-in z-50">
                      <div className="px-4 py-2.5 border-b border-stroke">
                        <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                        <p className="text-xs text-muted truncate">{user.email}</p>
                        <span className="mt-1 inline-block badge badge-blue">
                          {user.role === 'petsitter' ? 'Petsitter' : user.role === 'partner' ? 'Parceiro' : user.role === 'admin' ? 'Admin' : 'Tutor'}
                        </span>
                      </div>
                      {accountLinks.map(({ to, icon, label, badge }) => (
                        <Link
                          key={to} to={to}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-gray-900 hover:bg-background transition-colors"
                        >
                          <span className="text-muted">{icon}</span>
                          <span className="flex-1">{label}</span>
                          {badge ? (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-secondary-500 text-white text-[11px] font-bold flex items-center justify-center">
                              {badge > 9 ? '9+' : badge}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                      <div className="border-t border-stroke mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-b-2xl"
                        >
                          <LogOut size={15} /> Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-base font-medium text-muted hover:text-primary-600 transition-colors"
                >
                  Criar conta ou entrar
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(v => !v)}
                className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-all ml-1"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-stroke shadow-card animate-slide-up">
            <div className="px-4 py-3 space-y-1">
              <Link to="/buscar" className="flex items-center gap-2 px-4 py-3 rounded-xl text-muted hover:bg-background font-medium text-sm">
                <Search size={16} /> Buscar petsitters
              </Link>
              {isAuthenticated && accountLinks.map(({ to, icon, label, badge }) => (
                <Link key={to} to={to} className="flex items-center gap-2 px-4 py-3 rounded-xl text-muted hover:bg-background font-medium text-sm">
                  <span className="text-muted">{icon}</span>
                  <span className="flex-1">{label}</span>
                  {badge ? (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-secondary-500 text-white text-[11px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  ) : null}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link to="/login" className="flex items-center gap-2 px-4 py-3 rounded-xl text-muted hover:bg-background font-medium text-sm">Entrar</Link>
              )}
              {isAuthenticated && (
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium text-sm">
                  <LogOut size={16} /> Sair
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-20"><Outlet /></main>

      <footer className="bg-white border-t border-stroke py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <img src="/logo-imagem.png" alt="PetUno" className="h-9 w-auto" onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }} />
            <span>— Cuidado para seu melhor amigo</span>
          </div>
          <p>© {new Date().getFullYear()} PetUno. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
