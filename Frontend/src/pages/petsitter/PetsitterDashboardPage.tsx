import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/services/booking.service'
import { petsitterService } from '@/services/petsitter.service'
import { locationService } from '@/services/location.service'
import { SkeletonList } from '@/components/ui/Skeleton'
import { formatCurrency, bookingStatusConfig, serviceLabels, avatarUrl } from '@/utils'
import {
  Star, CheckCheck, AlertTriangle, Check, X, MapPin, ChevronDown, ToggleLeft, ToggleRight,
  Clock, User, FileText, CalendarDays, DollarSign, Lightbulb,
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

function isAllDayBooking(booking: Booking): boolean {
  const hours = (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60)
  return hours >= 23
}

function isNewRequest(booking: Booking): boolean {
  return Date.now() - new Date(booking.createdAt).getTime() < 24 * 60 * 60 * 1000
}

function bookingDateLabel(booking: Booking): string {
  const start = new Date(booking.startDate)
  if (isAllDayBooking(booking)) {
    const end = new Date(booking.endDate)
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
  }
  const isToday = start.toDateString() === new Date().toDateString()
  const dayLabel = isToday ? 'Hoje' : start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${dayLabel}, ${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const DAILY_TIPS = [
  'Mantenha seu calendário de disponibilidade atualizado para receber mais solicitações compatíveis com seus horários livres.',
  'Responda rápido às solicitações pendentes — tutores costumam preferir cuidadores com resposta ágil.',
  'Compartilhar sua localização durante os serviços passa mais confiança para o tutor.',
  'Um perfil completo, com fotos e bio detalhada, aumenta suas chances de match.',
]

type Tab = 'pendentes' | 'em_progresso' | 'historico'
type HistoryFilter = 'todos' | BookingStatus

const HISTORY_FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'todos',     label: 'Todos'      },
  { key: 'pending',   label: 'Pendentes'  },
  { key: 'accepted',  label: 'Aceitos'    },
  { key: 'completed', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
]

export function PetsitterDashboardPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const requestedTab = searchParams.get('tab')
  const tab: Tab = requestedTab === 'em_progresso' || requestedTab === 'historico' ? requestedTab : 'pendentes'
  const setTab = (next: Tab) => setSearchParams(next === 'pendentes' ? {} : { tab: next }, { replace: true })

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

  const pending = pendingBookings.length

  const monthRevenue = thisMonth
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0)

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

  const tipOfDay = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length]

  return (
    <div className="max-w-6xl mx-auto">

      {ps?.status === 'pending' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4 shadow-sm mb-6">
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-800 tracking-tight mb-1">Gestão de Agendamentos</h1>
          <p className="text-muted max-w-xl text-sm">Acompanhe suas solicitações, gerencie serviços em andamento e acesse seu histórico completo de cuidados.</p>
        </div>

        {ps && (
          <button
            onClick={() => availability.mutate(!ps.isAvailable)}
            disabled={availability.isPending}
            className={clsx(
              'flex items-center gap-2.5 rounded-2xl px-4 py-2.5 border transition-all disabled:opacity-60 flex-shrink-0',
              ps.isAvailable ? 'bg-emerald-50 border-emerald-200' : 'bg-background border-stroke',
            )}
          >
            {ps.isAvailable ? <ToggleRight size={26} className="text-emerald-500" /> : <ToggleLeft size={26} className="text-muted" />}
            <span className="text-left">
              <span className={clsx('block text-sm font-semibold', ps.isAvailable ? 'text-emerald-700' : 'text-muted')}>
                {ps.isAvailable ? 'Disponível' : 'Indisponível'}
              </span>
              <span className="block text-xs text-muted">para novos agendamentos</span>
            </span>
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="bg-background p-1.5 rounded-pill flex gap-1.5 shadow-sm w-full sm:w-fit overflow-x-auto mt-6 mb-6">
        {([
          { key: 'pendentes' as const,    label: `Pendentes${pending > 0 ? ` (${pending})` : ''}` },
          { key: 'em_progresso' as const, label: 'Em Progresso' },
          { key: 'historico' as const,    label: 'Histórico' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'px-5 py-2.5 rounded-pill text-sm font-semibold whitespace-nowrap transition-all',
              tab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-muted hover:text-primary-600',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <SkeletonList count={3} component="booking" />}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ══════════════ Coluna principal ══════════════ */}
          <div className="lg:col-span-8 flex flex-col gap-4">

            {/* ── Pendentes ── */}
            {tab === 'pendentes' && (
              pendingBookings.length === 0 ? (
                <div className="card flex flex-col items-center py-16 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="font-heading font-bold text-ink">Nenhuma solicitação pendente</h3>
                  <p className="text-sm text-muted mt-1">Novas solicitações de tutores aparecerão aqui.</p>
                </div>
              ) : pendingBookings.map(b => (
                <div key={b.id} className="card relative overflow-hidden p-5 sm:p-6">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary-500 to-secondary-300" />
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={avatarUrl(b.tutor?.name ?? 'T', b.tutor?.avatarUrl ?? undefined)}
                          alt={b.tutor?.name}
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-primary-50"
                        />
                        {isNewRequest(b) && (
                          <span className="absolute -bottom-1 -right-1 badge badge-yellow text-[10px] px-2 py-0.5">Novo</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading text-lg font-bold text-ink truncate">{b.pets?.[0]?.name || 'Pet'}</h3>
                        <p className="text-sm text-muted flex items-center gap-1 truncate">
                          <User size={14} className="flex-shrink-0" /> Tutor: {b.tutor?.name}
                        </p>
                      </div>
                    </div>
                    <div className="bg-background rounded-2xl p-3 flex flex-col items-center sm:items-end min-w-[140px] flex-shrink-0">
                      <span className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-0.5">{serviceLabels[b.service]}</span>
                      <span className="text-sm font-semibold text-ink">{bookingDateLabel(b)}</span>
                    </div>
                  </div>

                  {b.notes && (
                    <div className="mt-4 bg-background rounded-2xl p-3 flex items-center gap-2">
                      <FileText size={16} className="text-muted flex-shrink-0" />
                      <p className="text-sm text-muted italic truncate">"{b.notes}"</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t border-stroke">
                    <button
                      onClick={() => decline.mutate(b.id)}
                      disabled={decline.isPending || accept.isPending}
                      className="btn-ghost text-error-500 hover:bg-error-50 text-sm"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => accept.mutate(b.id)}
                      disabled={accept.isPending || decline.isPending}
                      className="btn-secondary text-sm"
                    >
                      <Check size={16} /> Aceitar Solicitação
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* ── Em Progresso ── */}
            {tab === 'em_progresso' && (
              acceptedBookings.length === 0 ? (
                <div className="card flex flex-col items-center py-16 text-center">
                  <div className="text-5xl mb-4">🐾</div>
                  <h3 className="font-heading font-bold text-ink">Nenhum serviço em andamento</h3>
                  <p className="text-sm text-muted mt-1">Solicitações aceitas aparecem aqui até serem concluídas.</p>
                </div>
              ) : acceptedBookings.map(b => {
                const active = isHappeningNow(b)
                return (
                  <div key={b.id} className={clsx('card relative overflow-hidden p-5 sm:p-6', active && 'ring-2 ring-emerald-300')}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-300" />
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <img
                          src={avatarUrl(b.tutor?.name ?? 'T', b.tutor?.avatarUrl ?? undefined)}
                          alt={b.tutor?.name}
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-primary-50 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-heading text-lg font-bold text-ink flex items-center gap-2 truncate">
                            {b.tutor?.name}
                            {active && <span className="badge badge-green flex-shrink-0">Em andamento</span>}
                          </h3>
                          <p className="text-sm text-muted truncate">{b.pets?.[0]?.name || 'Pet'} · {serviceLabels[b.service]}</p>
                        </div>
                      </div>
                      <div className="bg-background rounded-2xl p-3 flex flex-col items-center sm:items-end min-w-[140px] flex-shrink-0">
                        <span className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-0.5">{isAllDayBooking(b) ? 'Período' : 'Horário'}</span>
                        <span className="text-sm font-semibold text-ink">{bookingDateLabel(b)}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t border-stroke">
                      <button
                        onClick={() => checkIn.mutate(b.id)}
                        disabled={checkIn.isPending}
                        className="btn-ghost text-primary-600 hover:bg-primary-50 text-sm"
                      >
                        <MapPin size={14} /> {checkIn.isPending ? 'Compartilhando…' : 'Enviar localização agora'}
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
              })
            )}

            {/* ── Histórico ── */}
            {tab === 'historico' && (
              <div className="flex flex-col gap-5">
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {HISTORY_FILTERS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setHistoryFilter(f.key)}
                      className={clsx(
                        'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
                        historyFilter === f.key
                          ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                          : 'bg-white text-muted border-stroke hover:border-primary-300',
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
                    <h3 className="font-heading font-bold text-ink">Nenhum agendamento</h3>
                    <p className="text-sm text-muted mt-1">
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
                    const isAllDay = isAllDayBooking(b)

                    return (
                      <div key={b.id} className="card overflow-hidden transition-shadow hover:shadow-card-hover">
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
                              className="avatar-framed w-11 h-11 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-ink truncate">{b.tutor?.name}</p>
                              <p className="text-xs text-muted truncate">{serviceLabels[b.service]} · {b.pets?.[0]?.name || 'Pet'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={clsx('badge', cfg.badgeClass)}>{cfg.label}</span>
                            <button
                              onClick={() => setExpanded(isExpanded ? null : b.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-background transition-all"
                            >
                              <ChevronDown size={16} className={clsx('transition-transform', isExpanded && 'rotate-180')} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                          <div className="bg-background rounded-xl p-2.5">
                            <p className="text-xs text-muted flex items-center gap-1"><Clock size={10} /> {isAllDay ? 'Entrada' : 'Início'}</p>
                            <p className="font-medium text-ink">
                              {start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {!isAllDay && <span className="text-primary-500 ml-1">{start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                            </p>
                          </div>
                          <div className="bg-background rounded-xl p-2.5">
                            <p className="text-xs text-muted">Valor total</p>
                            <p className="font-semibold text-primary-600">{formatCurrency(b.totalPrice)}</p>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-stroke space-y-3 animate-fade-in">
                            {isAllDay && (
                              <div className="bg-background rounded-xl p-2.5 text-sm">
                                <p className="text-xs text-muted">Saída</p>
                                <p className="font-medium text-ink">{end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              </div>
                            )}
                            {b.notes && (
                              <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-sm text-primary-700">
                                <p className="font-medium text-xs uppercase tracking-wide mb-1">Observações do tutor</p>
                                {b.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {b.status === 'pending' && (
                          <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-stroke">
                            <button onClick={() => decline.mutate(b.id)} disabled={decline.isPending} className="btn-ghost text-error-500 hover:bg-error-50 text-sm">
                              <X size={14} /> Recusar
                            </button>
                            <button onClick={() => accept.mutate(b.id)} disabled={accept.isPending} className="btn-primary text-sm">
                              <Check size={14} /> Aceitar
                            </button>
                          </div>
                        )}
                        {b.status === 'accepted' && (
                          <div className="mt-4 pt-3 border-t border-stroke space-y-2">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => checkIn.mutate(b.id)} disabled={checkIn.isPending} className="btn-ghost text-primary-600 hover:bg-primary-50 text-sm">
                                <MapPin size={14} /> {checkIn.isPending ? 'Compartilhando…' : 'Compartilhar localização agora'}
                              </button>
                              <button onClick={() => complete.mutate(b.id)} disabled={complete.isPending} className="btn-primary text-sm bg-emerald-500 hover:bg-emerald-600 border-emerald-500">
                                <CheckCheck size={14} /> Marcar como concluído
                              </button>
                            </div>
                            <p className="text-xs text-muted text-right">
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

          {/* ══════════════ Sidebar: resumo + dica ══════════════ */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-primary-500 text-white rounded-[2rem] p-6 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <h3 className="font-heading text-xl font-bold mb-1 relative z-10">Resumo do Mês</h3>
              <p className="text-primary-100 text-sm mb-6 relative z-10">
                {thisMonth.length > 0 ? 'Você tem uma semana movimentada!' : 'Ainda sem agendamentos este mês.'}
              </p>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-3xl font-extrabold block leading-none">{thisMonth.length}</span>
                    <span className="text-xs font-bold text-primary-100 uppercase tracking-wider">Agendamentos</span>
                  </div>
                  <div className="w-11 h-11 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
                    <CalendarDays size={20} />
                  </div>
                </div>
                <div className="h-px w-full bg-white/20" />
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-3xl font-extrabold block leading-none">{formatCurrency(monthRevenue)}</span>
                    <span className="text-xs font-bold text-primary-100 uppercase tracking-wider">Ganhos Previstos</span>
                  </div>
                  <div className="w-11 h-11 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign size={20} />
                  </div>
                </div>
                <div className="h-px w-full bg-white/20" />
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-3xl font-extrabold block leading-none">{ps?.rating?.toFixed(1) ?? '—'}</span>
                    <span className="text-xs font-bold text-primary-100 uppercase tracking-wider">{ps?.totalReviews ?? 0} avaliações</span>
                  </div>
                  <div className="w-11 h-11 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star size={20} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h4 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Dica do dia</h4>
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lightbulb size={18} className="text-secondary-700" />
                </div>
                <p className="text-sm text-ink">{tipOfDay}</p>
              </div>
            </div>

            {bookings.length === 0 && (
              <div className="card flex flex-col items-center py-10 text-center">
                <div className="text-4xl mb-3">🐾</div>
                <h3 className="font-heading font-semibold text-ink text-sm">Nenhum agendamento ainda</h3>
                <p className="text-xs text-muted mt-1">Complete seu perfil para aparecer nas buscas.</p>
                <Link to="/dashboard/petsitter/perfil" className="btn-primary mt-4 text-sm">Completar perfil</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
