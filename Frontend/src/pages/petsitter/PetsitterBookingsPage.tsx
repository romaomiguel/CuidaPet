import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/services/booking.service'
import { SkeletonList } from '@/components/ui/Skeleton'
import { formatCurrency, bookingStatusConfig, serviceLabels, avatarUrl } from '@/utils'
import { Check, X, CheckCheck, Calendar, Clock, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import type { BookingStatus } from '@/types'

type Filter = 'todos' | 'pending' | 'accepted' | 'completed' | 'cancelled'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todos',     label: 'Todos'      },
  { key: 'pending',   label: 'Pendentes'  },
  { key: 'accepted',  label: 'Aceitos'    },
  { key: 'completed', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
]

export function PetsitterBookingsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('todos')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['bookings'], queryFn: bookingService.list })
  const bookings = data?.data ?? []

  const accept   = useMutation({ mutationFn: bookingService.accept,   onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Agendamento aceito! 🎉') } })
  const decline  = useMutation({ mutationFn: bookingService.decline,  onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Agendamento recusado') } })
  const complete = useMutation({ mutationFn: bookingService.complete, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bookings'] }); toast.success('Serviço concluído! ✅') } })

  const filtered = filter === 'todos' ? bookings : bookings.filter(b => b.status === filter)
  const sorted = [...filtered].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  const pendingCount = bookings.filter(b => b.status === 'pending').length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={24} className="text-primary-500" /> Agendamentos
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-amber-400 text-white rounded-full">
              {pendingCount} novo{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </h1>
        <p className="text-gray-500 mt-0.5 text-sm">Gerencie todos os agendamentos recebidos.</p>
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
              filter === f.key
                ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
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

      {/* ── Lista ── */}
      {isLoading && <SkeletonList count={3} component="booking" />}

      {!isLoading && sorted.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-semibold text-gray-700">Nenhum agendamento</h3>
          <p className="text-sm text-gray-400 mt-1">
            {filter === 'todos' ? 'Os agendamentos dos tutores aparecerão aqui.' : `Sem agendamentos "${FILTERS.find(f => f.key === filter)?.label.toLowerCase()}".`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(b => {
          const cfg = bookingStatusConfig[b.status as BookingStatus]
          const isExpanded = expanded === b.id
          const start = new Date(b.startDate)
          const end   = new Date(b.endDate)

          const isAllDay = (() => {
            const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            return diff >= 23
          })()

          return (
            <div key={b.id} className="card overflow-hidden transition-shadow hover:shadow-md">
              {/* Faixa de status */}
              <div className={clsx('h-1 -mx-6 -mt-6 mb-4', {
                'bg-amber-400':  b.status === 'pending',
                'bg-emerald-400': b.status === 'accepted',
                'bg-sky-400':    b.status === 'completed',
                'bg-rose-300':   b.status === 'cancelled',
              })} />

              <div className="flex items-start justify-between gap-4">
                {/* Avatar + info do tutor */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={avatarUrl(b.tutor?.name ?? 'T', b.tutor?.avatar)}
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

              {/* Data e valor — sempre visível */}
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

              {/* Conteúdo expandido */}
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

              {/* Ações */}
              {b.status === 'pending' && (
                <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => decline.mutate(b.id)}
                    disabled={decline.isPending}
                    className="btn-ghost text-red-500 hover:bg-red-50 text-sm"
                  >
                    <X size={14} /> Recusar
                  </button>
                  <button
                    onClick={() => accept.mutate(b.id)}
                    disabled={accept.isPending}
                    className="btn-primary text-sm"
                  >
                    <Check size={14} /> Aceitar
                  </button>
                </div>
              )}
              {b.status === 'accepted' && (
                <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => complete.mutate(b.id)}
                    disabled={complete.isPending}
                    className="btn-primary text-sm bg-emerald-500 hover:bg-emerald-600 border-emerald-500"
                  >
                    <CheckCheck size={14} /> Marcar como concluído
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
