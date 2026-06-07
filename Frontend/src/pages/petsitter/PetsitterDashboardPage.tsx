import { useQuery } from '@tanstack/react-query'
import { bookingService } from '@/services/booking.service'
import { petsitterService } from '@/services/petsitter.service'
import { useAuthStore } from '@/store/auth.store'
import { formatCurrency } from '@/utils'
import { LayoutDashboard, Calendar, Star, TrendingUp, Clock, CheckCheck, XCircle, Hourglass, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PetsitterDashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({ queryKey: ['bookings'], queryFn: bookingService.list })
  const { data: ps } = useQuery({ queryKey: ['petsitter', 'me'], queryFn: petsitterService.getMyProfile })

  const bookings = data?.data ?? []
  const now = new Date()
  const thisMonth = bookings.filter(b => {
    const d = new Date(b.startDate)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const pending   = bookings.filter(b => b.status === 'pending').length
  const accepted  = bookings.filter(b => b.status === 'accepted').length
  const completed = bookings.filter(b => b.status === 'completed').length
  const cancelled = bookings.filter(b => b.status === 'cancelled').length

  const monthRevenue = thisMonth
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0)

  const nextBookings = bookings
    .filter(b => b.status === 'accepted' && new Date(b.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3)

  const stats = [
    { icon: <Hourglass size={20} />,  label: 'Pendentes',  value: pending,   color: 'text-amber-600 bg-amber-50  border-amber-200' },
    { icon: <CheckCheck size={20} />, label: 'Aceitos',    value: accepted,  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { icon: <Star size={20} />,       label: 'Concluídos', value: completed, color: 'text-sky-600  bg-sky-50    border-sky-200' },
    { icon: <XCircle size={20} />,    label: 'Cancelados', value: cancelled, color: 'text-rose-500  bg-rose-50   border-rose-200' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {ps?.status === 'pending' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-4 shadow-sm animate-pulse">
          <AlertTriangle size={24} className="flex-shrink-0 text-amber-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-amber-900">Sua conta está pendente de aprovação!</h3>
            <p className="mt-1 text-sm opacity-90">
              Você ainda não aparece nas buscas. Acesse a tela de <strong>Perfil</strong> e envie seus documentos na aba "Documentos" caso ainda não tenha feito.
            </p>
            <Link to="/dashboard/petsitter/perfil" className="mt-2 inline-block font-semibold text-amber-700 hover:underline text-sm">
              Ir para o Perfil →
            </Link>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard size={24} className="text-primary-500" /> Painel
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">Olá, {user?.name?.split(' ')[0]}! Aqui está o resumo do seu mês.</p>
        </div>
        <Link to="/dashboard/petsitter/agendamentos" className="btn-primary text-sm">
          <Calendar size={15} /> Ver agendamentos
        </Link>
      </div>

      {/* ── Cards de status ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 flex flex-col items-center gap-1 ${s.color}`}>
            {s.icon}
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Receita do mês ── */}
      <div className="card flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={26} className="text-primary-600" />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Receita do mês</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(monthRevenue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{thisMonth.filter(b => b.status === 'completed').length} serviços concluídos</p>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <p className="text-xs text-gray-400">Avaliação</p>
          <p className="text-2xl font-bold text-amber-500">⭐ {ps?.rating?.toFixed(1) ?? '—'}</p>
          <p className="text-xs text-gray-400">{ps?.totalReviews ?? 0} avaliações</p>
        </div>
      </div>

      {/* ── Próximos agendamentos aceitos ── */}
      {nextBookings.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-primary-500" /> Próximos serviços
          </h2>
          <div className="space-y-3">
            {nextBookings.map(b => (
              <div key={b.id} className="card flex items-center gap-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-lg flex-shrink-0">🐾</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{b.tutor?.name}</p>
                  <p className="text-xs text-gray-400">{b.pets?.[0]?.name || 'Pet'} · {b.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary-600">
                    {new Date(b.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(b.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-semibold text-gray-700">Nenhum agendamento ainda</h3>
          <p className="text-sm text-gray-400 mt-1">Complete seu perfil para aparecer nas buscas.</p>
          <Link to="/dashboard/petsitter/perfil" className="btn-primary mt-4 text-sm">Completar perfil</Link>
        </div>
      )}
    </div>
  )
}
