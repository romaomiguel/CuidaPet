import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { ShieldCheck, CalendarDays, HeartHandshake } from 'lucide-react'

export function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    let to = '/buscar'
    if (user.role === 'admin') to = '/admin'
    if (user.role === 'petsitter') to = '/dashboard/petsitter/perfil'
    
    return <Navigate to={to} replace />
  }

  return (
    <div className="min-h-screen flex bg-background w-full overflow-hidden">
      {/* ── Painel esquerdo (Branding) ── */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-primary flex-col justify-center overflow-hidden border-r border-primary-600">
        
        {/* Fundo com as cores padrões */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-bl-full opacity-5" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary-400 rounded-tr-full opacity-20" />

        <div className="relative z-10 p-12 max-w-md mx-auto">
          {/* Logo (Dentro de um card branco para destacar o texto escuro da logo) */}
          <div className="flex justify-start mb-10">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-lg border border-white/20 inline-block">
              <img
                src="/logo__2_-removebg-preview.png"
                alt="CuidaPet Logo"
                className="h-16 w-auto"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Cuida<span className="text-secondary-400">Pet</span>
          </h1>
          <p className="text-primary-100 text-lg mb-10 leading-relaxed font-medium">
            Conectando tutores e petsitters com segurança, praticidade e muito carinho.
          </p>

          {/* Benefícios */}
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white shadow-sm border border-white/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Perfis Verificados</h3>
                <p className="text-primary-100 text-sm mt-1">Análise rigorosa de antecedentes e experiência de todos os cuidadores.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-secondary-400 shadow-sm border border-white/20">
                <CalendarDays size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Agendamento Fácil</h3>
                <p className="text-primary-100 text-sm mt-1">Encontre profissionais disponíveis nas datas e horários que você precisa.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-red-300 shadow-sm border border-white/20">
                <HeartHandshake size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Muito Carinho</h3>
                <p className="text-primary-100 text-sm mt-1">Profissionais apaixonados por pets para cuidar do seu melhor amigo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulário direito (Conteúdo Principal) ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 lg:p-12 relative w-full lg:w-7/12">
        
        {/* Logo mobile */}
        <div className="lg:hidden flex flex-col items-center gap-3 mb-10 w-full animate-fade-in">
          <img
            src="/logo__2_-removebg-preview.png"
            alt="CuidaPet"
            className="h-16 w-auto"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>

        {/* Container do Formulário */}
        <div className="w-full max-w-md animate-slide-up">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
