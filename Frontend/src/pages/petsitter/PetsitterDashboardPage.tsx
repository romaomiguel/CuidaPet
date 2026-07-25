import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/services/booking.service'
import { petsitterService } from '@/services/petsitter.service'
import { locationService } from '@/services/location.service'
import { useAuthStore } from '@/store/auth.store'
import { SkeletonList } from '@/components/ui/Skeleton'
import { formatCurrency, bookingStatusConfig, serviceLabels, avatarUrl } from '@/utils'
import {
  LayoutDashboard, Star, TrendingUp, CheckCheck, XCircle, Hourglass,
  AlertTriangle, Check, X, MapPin, ChevronDown, ToggleLeft, ToggleRight,
  Clock,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import type { Booking, BookingStatus } from '@/types'

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Seu navegador não suporta compartilhamento de localização.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    })
  })
}

// GeolocationPositionError não é um Error nativo — mapeia o `code` pra uma mensagem
// que o petsitter entenda (permissão negada é o caso mais comum).
function geolocationErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  const geoError = error as GeolocationPositionError
  switch (geoError.code) {
    case 1: return 'Permissão de localização negada. Ative o acesso à localização nas configurações do navegador.'
    case 2: return 'Não foi possível obter sua localização. Verifique se o GPS está ativado e tente novamente.'
    case 3: return 'Tempo esgotado ao tentar obter sua localização. Tente novamente.'
    default: return 'Não foi possível compartilhar sua localização.'
  }
}

function isHappeningNow(booking: Booking): boolean {
  const now = Date.now()
  return now >= new Date(booking.startDate).getTime() && now <= new Date(booking.endDate).getTime()
}

type Tab = 'overview' | 'agendamentos'
type HistoryFilter = 'todos' | BookingStatus

const HISTORY_FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'todos',     label: 'Todos'      },
  { key: 'pending',   label: 'Pendentes'  },
  { key: 'accepted',  label: 'Aceitos'    },
  { key: 'completed', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
]

export function PetsitterDashboardPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab: Tab = searchParams.get('tab') === 'agendamentos' ? 'agendamentos' : 'overview'
  const setTab = (next: Tab) => setSearchParams(next === 'overview' ? {} : { tab: next }, { replace: true })

  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('todos')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['bookings'], queryFn: bookingService.list })
  const { data: ps } = useQuery({ queryKey: ['petsitter', 'me'], queryFn: petsitterService.getMyProfile })

  const bookings = data?.data ?? []
  const now = new Date()
  const thisMonth = bookings.filter(b => {
    const d = new Date(b.startDate)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const pendingBookings = bookings
    .filter(b => b.status === 'pending')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const acceptedBookings = bookings
    .filter(b => b.status === 'accepted')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  const pending   = pendingBookings.length
  const accepted  = acceptedBookings.length
  const completed = bookings.filter(b => b.status === 'completed').length
  const cancelled = bookings.filter(b => b.status === 'cancelled').length

  const monthRevenue = thisMonth
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0)

  const stats = [
    { icon: <Hourglass size={20} />,  label: 'Pendentes',  value: pending,   color: 'text-amber-600 bg-amber-50  border-amber-200' },
    { icon: <CheckCheck size={20} />, label: 'Aceitos',    value: accepted,  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { icon: <Star size={20} />,       label: 'Concluídos', value: completed, color: 'text-sky-600  bg-sky-50    border-sky-200' },
    { icon: <XCircle size={20} />,    label: 'Cancelados', value: cancelled, color: 'text-rose-500  bg-rose-50   border-rose-200' },
  ]

  const invalidateBookings = () => queryClient.invalidateQueries({ queryKey: ['bookings'] })

  const accept   = useMutation({ mutationFn: bookingService.accept,   onSuccess: () => { invalidateBookings(); toast.success('Agendamento aceito! 🎉') } })
  const decline  = useMutation({ mutationFn: bookingService.decline,  onSuccess: () => { invalidateBookings(); toast.success('Agendamento recusado') } })
  const complete = useMutation({ mutationFn: bookingService.complete, onSuccess: () => { invalidateBookings(); toast.success('Serviço concluído! ✅') } })

  const checkIn = useMutation({
    mutationFn: async (bookingId: string) => {
      const position = await getCurrentPosition()
      return locationService.sendCheckIn(bookingId, position.coords.latitude, position.coords.longitude)
    },
    onSuccess: () => toast.success('Localização compartilhada!'),
    onError: (error) => toast.error(geolocationErrorMessage(error)),
  })

  const availability = useMutation({
    mutationFn: (next: boolean) => petsitterService.updateProfile({ isAvailable: next }),
    onSuccess: (_data, next) => {
      queryClient.invalidateQueries({ queryKey: ['petsitter', 'me'] })
      toast.success(next ? 'Você está disponível para novos agendamentos!' : 'Você ficou indisponível temporariamente.')
    },
    onError: () => toast.error('Não foi possível atualizar sua disponibilidade.'),
  })

  const historyFiltered = historyFilter === 'todos' ? bookings : bookings.filter(b => b.status === historyFilter)
  const historySorted = [...historyFiltered].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

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

      {/* ── Header + toggle de disponibilidade ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard size={24} className="text-primary-500" /> Painel
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">Olá, {user?.name?.split(' ')[0]}! Aqui está o resumo do seu mês.</p>
        </div>

        {ps && (
          <button
            onClick={() => availability.mutate(!ps.isAvailable)}
            disabled={availability.isPending}
            className={clsx(
              'flex items-center gap-2.5 rounded-2xl px-4 py-2.5 border transition-all disabled:opacity-60',
              ps.isAvailable ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200',
            )}
          >
            {ps.isAvailable ? <ToggleRight size={26} className="text-emerald-500" /> : <ToggleLeft size={26} className="text-gray-400" />}
            <span className="text-left">
              <span className={clsx('block text-sm font-semibold', ps.isAvailable ? 'text-emerald-700' : 'text-gray-500')}>
                {ps.isAvailable ? 'Disponível' : 'Indisponível'}
              </span>
              <span className="block text-xs text-gray-400">para novos agendamentos</span>
            </span>
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-white rounded-2xl shadow-card p-1 gap-1 w-fit">
        <button
          onClick={() => setTab('overview')}
          className={clsx('px-5 py-2.5 rounded-xl text-sm font-semibold transition-all', tab === 'overview' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          Visão geral
        </button>
        <button
          onClick={() => setTab('agendamentos')}
          className={clsx('px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2', tab === 'agendamentos' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          Agendamentos
          {pending > 0 && (
            <span className={clsx('px-1.5 py-0.5 text-xs font-bold rounded-full', tab === 'agendamentos' ? 'bg-white/25 text-white' : 'bg-amber-400 text-white')}>
              {pending}
            </span>
          )}
        </button>
      </div>

      {isLoading && <SkeletonList count={3} component="booking" />}

      {/* ══════════════ VISÃO GERAL ══════════════ */}
      {!isLoading && tab === 'overview' && (
        <div className="space-y-6">

          {/* ── Widget: Solicitações pendentes (top priority) ── */}
          {pendingBookings.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Hourglass size={16} className="text-amber-500" /> Solicitações pendentes
                <span className="badge badge-yellow">{pendingBookings.length}</span>
              </h2>
              <div className="space-y-3">
                {pendingBookings.map(b => (
                  <div key={b.id} className="card flex flex-wrap items-center gap-4 py-3 border-l-4 border-l-amber-400">
                    <img
                      src={avatarUrl(b.tutor?.name ?? 'T', b.tutor?.avatarUrl ?? undefined)}
                      alt={b.tutor?.name}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-2 ring-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{b.tutor?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{serviceLabels[b.service]} · {b.pets?.[0]?.name || 'Pet'} · {new Date(b.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => decline.mutate(b.id)}
                        disabled={decline.isPending || accept.isPending}
                        className="btn-ghost text-red-500 hover:bg-red-50 text-sm"
                      >
                        <X size={14} /> Recusar
                      </button>
                      <button
                        onClick={() => accept.mutate(b.id)}
                        disabled={accept.isPending || decline.isPending}
                        className="btn-primary text-sm"
                      >
                        <Check size={14} /> Aceitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Widget: Serviços aceitos / em andamento ── */}
          {acceptedBookings.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-emerald-500" /> Serviços aceitos
              </h2>
              <div className="space-y-3">
                {acceptedBookings.map(b => {
                  const active = isHappeningNow(b)
                  return (
                    <div key={b.id} className={clsx('card py-3', active && 'border-l-4 border-l-emerald-400 bg-emerald-50/40')}>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-lg flex-shrink-0">🐾</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm flex items-center gap-2 truncate">
                            {b.tutor?.name}
                            {active && <span className="badge badge-green flex-shrink-0">Em andamento</span>}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{b.pets?.[0]?.name || 'Pet'} · {serviceLabels[b.service]}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-primary-600">
                            {new Date(b.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(b.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => checkIn.mutate(b.id)}
                          disabled={checkIn.isPending}
                          className="btn-ghost text-primary-600 hover:bg-primary-50 text-sm"
                        >
                          <MapPin size={14} /> {checkIn.isPending ? 'Compartilhando…' : '📍 Enviar localização agora'}
                        </button>
                        <button
                          onClick={() => complete.mutate(b.id)}
                          disabled={complete.isPending}
                          className="btn-primary text-sm bg-emerald-500 hover:bg-emerald-600 border-emerald-500"
                        >
                          <CheckCheck size={14} /> Concluir
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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

          {bookings.length === 0 && (
            <div className="card flex flex-col items-center py-16 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="font-semibold text-gray-700">Nenhum agendamento ainda</h3>
              <p className="text-sm text-gray-400 mt-1">Complete seu perfil para aparecer nas buscas.</p>
              <Link to="/dashboard/petsitter/perfil" className="btn-primary mt-4 text-sm">Completar perfil</Link>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ AGENDAMENTOS (histórico completo) ══════════════ */}
      {!isLoading && tab === 'agendamentos' && (
        <div className="space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {HISTORY_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setHistoryFilter(f.key)}
                className={clsx(
                  'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
                  historyFilter === f.key
                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300',
                )}
              >
                {f.label}
                {f.key !== 'todos' && (
                  <span className="ml-1.5 text-xs opacity-75">
                    ({bookings.filter(b => b.status === f.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {historySorted.length === 0 && (
            <div className="card flex flex-col items-center py-16 text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="font-semibold text-gray-700">Nenhum agendamento</h3>
              <p className="text-sm text-gray-400 mt-1">
                {historyFilter === 'todos' ? 'Os agendamentos dos tutores aparecerão aqui.' : `Sem agendamentos "${HISTORY_FILTERS.find(f => f.key === historyFilter)?.label.toLowerCase()}".`}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {historySorted.map(b => {
              const cfg = bookingStatusConfig[b.status as BookingStatus]
              const isExpanded = expanded === b.id
              const start = new Date(b.startDate)
              const end   = new Date(b.endDate)
              const isAllDay = (end.getTime() - start.getTime()) / (1000 * 60 * 60) >= 23

              return (
                <div key={b.id} className="card overflow-hidden transition-shadow hover:shadow-md">
                  <div className={clsx('h-1 -mx-6 -mt-6 mb-4', {
                    'bg-amber-400':   b.status === 'pending',
                    'bg-emerald-400': b.status === 'accepted',
                    'bg-sky-400':     b.status === 'completed',
                    'bg-rose-300':    b.status === 'cancelled' || b.status === 'declined',
                  })} />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={avatarUrl(b.tutor?.name ?? 'T', b.tutor?.avatarUrl ?? undefined)}
                        alt={b.tutor?.name}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-2 ring-gray-100"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{b.tutor?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{serviceLabels[b.service]} · {b.pets?.[0]?.name || 'Pet'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={clsx('badge', cfg.badgeClass)}>{cfg.label}</span>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : b.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all"
                      >
                        <ChevronDown size={16} className={clsx('transition-transform', isExpanded && 'rotate-180')} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} /> {isAllDay ? 'Entrada' : 'Início'}</p>
                      <p className="font-medium">
                        {start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {!isAllDay && <span className="text-primary-500 ml-1">{start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-xs text-gray-400">Valor total</p>
                      <p className="font-semibold text-primary-600">{formatCurrency(b.totalPrice)}</p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-fade-in">
                      {isAllDay && (
                        <div className="bg-gray-50 rounded-xl p-2.5 text-sm">
                          <p className="text-xs text-gray-400">Saída</p>
                          <p className="font-medium">{end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                      )}
                      {b.notes && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                          <p className="font-medium text-xs uppercase tracking-wide mb-1">Observações do tutor</p>
                          {b.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {b.status === 'pending' && (
                    <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-gray-100">
                      <button onClick={() => decline.mutate(b.id)} disabled={decline.isPending} className="btn-ghost text-red-500 hover:bg-red-50 text-sm">
                        <X size={14} /> Recusar
                      </button>
                      <button onClick={() => accept.mutate(b.id)} disabled={accept.isPending} className="btn-primary text-sm">
                        <Check size={14} /> Aceitar
                      </button>
                    </div>
                  )}
                  {b.status === 'accepted' && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => checkIn.mutate(b.id)} disabled={checkIn.isPending} className="btn-ghost text-primary-600 hover:bg-primary-50 text-sm">
                          <MapPin size={14} /> {checkIn.isPending ? 'Compartilhando…' : 'Compartilhar localização agora'}
                        </button>
                        <button onClick={() => complete.mutate(b.id)} disabled={complete.isPending} className="btn-primary text-sm bg-emerald-500 hover:bg-emerald-600 border-emerald-500">
                          <CheckCheck size={14} /> Marcar como concluído
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 text-right">
                        Cada check-in fica salvo no histórico do tutor, mesmo depois do serviço terminar.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
