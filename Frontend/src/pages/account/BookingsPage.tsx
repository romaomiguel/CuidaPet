import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/services/booking.service'
import { SkeletonList }   from '@/components/ui/Skeleton'
import { RatingStars }    from '@/components/ui/RatingStars'
import { ReviewModal }    from '@/components/booking/ReviewModal'
import { LocationTrailMap } from '@/components/location/LocationTrailMap'
import { formatCurrency, formatDateShort, bookingStatusConfig, serviceLabels, avatarUrl } from '@/utils'
import { CalendarDays, AlertCircle, X, Star, MapPin, Navigation } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import type { Booking, BookingStatus } from '@/types'

function isHappeningNow(booking: Booking): boolean {
  const now = Date.now()
  return now >= new Date(booking.startDate).getTime() && now <= new Date(booking.endDate).getTime()
}

export function BookingsPage() {
  const queryClient = useQueryClient()
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)
  const [trailTarget, setTrailTarget] = useState<string | null>(null)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['bookings'],
    queryFn:  bookingService.list,
  })

  const cancelMutation = useMutation({
    mutationFn: bookingService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Agendamento cancelado')
    },
  })

  const bookings = data?.data ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-extrabold text-primary-800 flex items-center gap-2">
          <CalendarDays size={24} /> Meus agendamentos
        </h1>
        <p className="text-muted mt-1">Histórico e status dos seus pedidos</p>
      </div>

      {isLoading && <SkeletonList count={4} component="booking" />}

      {isError && (
        <div className="card flex flex-col items-center py-12 text-center">
          <AlertCircle size={36} className="text-stroke mb-3" />
          <p className="text-muted">Erro ao carregar agendamentos</p>
        </div>
      )}

      {!isLoading && !isError && bookings.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="font-heading font-bold text-ink mb-1">Nenhum agendamento ainda</h3>
          <p className="text-sm text-muted">Encontre um petsitter e faça seu primeiro agendamento!</p>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map(b => {
          const cfg = bookingStatusConfig[b.status as BookingStatus]
          const inProgress = b.status === 'accepted' && isHappeningNow(b)
          return (
            <div key={b.id} className={clsx('card hover:shadow-card-hover transition-all duration-200', inProgress && 'border-l-4 border-l-emerald-400 bg-emerald-50/40')}>
              {inProgress && (
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold mb-3">
                  <span className="relative w-2 h-2 rounded-full bg-emerald-500">
                    <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />
                  </span>
                  Serviço em andamento agora
                </div>
              )}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl(b.petsitter?.user?.name ?? 'P', b.petsitter?.user?.avatarUrl ?? undefined)}
                    alt={b.petsitter?.user?.name}
                    className="avatar-framed w-11 h-11"
                  />
                  <div>
                    <p className="font-semibold text-ink">{b.petsitter?.user?.name}</p>
                    <p className="text-xs text-muted">{serviceLabels[b.service]}</p>
                  </div>
                </div>
                <span className={clsx('badge', cfg.badgeClass)}>{cfg.label}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-background rounded-2xl p-3">
                  <p className="text-xs text-muted mb-0.5">Pet</p>
                  <p className="font-medium text-ink">{b.pets?.[0]?.name || 'Pet'}</p>
                </div>
                <div className="bg-background rounded-2xl p-3">
                  <p className="text-xs text-muted mb-0.5">Valor</p>
                  <p className="font-medium text-ink">{formatCurrency(b.totalPrice)}</p>
                </div>
                <div className="bg-background rounded-2xl p-3">
                  <p className="text-xs text-muted mb-0.5">Início</p>
                  <p className="font-medium text-ink">{formatDateShort(b.startDate)}</p>
                </div>
                <div className="bg-background rounded-2xl p-3">
                  <p className="text-xs text-muted mb-0.5">Término</p>
                  <p className="font-medium text-ink">{formatDateShort(b.endDate)}</p>
                </div>
              </div>

              {(b.status === 'accepted' || b.status === 'completed') && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setTrailTarget(b.id)}
                    className={inProgress ? 'btn-primary text-sm bg-emerald-500 hover:bg-emerald-600 border-emerald-500' : 'btn-ghost text-primary-600 hover:bg-primary-50 text-sm'}
                  >
                    {inProgress ? <Navigation size={14} /> : <MapPin size={14} />}
                    {inProgress ? 'Ver localização em tempo real' : 'Ver trajeto'}
                  </button>
                </div>
              )}

              {b.status === 'pending' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => cancelMutation.mutate(b.id)}
                    disabled={cancelMutation.isPending}
                    className="btn-ghost text-error-500 hover:bg-error-50 text-sm"
                  >
                    <X size={14} /> Cancelar
                  </button>
                </div>
              )}

              {b.status === 'completed' && (
                <div className="mt-4 flex justify-end">
                  {b.review ? (
                    <div className="flex flex-col items-end gap-1.5 text-sm text-muted">
                      <div className="flex items-center gap-2">
                        <span>Você avaliou:</span>
                        <RatingStars value={b.review.rating} size="sm" />
                      </div>
                      {b.review.tags.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {b.review.tags.map(tag => (
                            <span key={tag} className="badge badge-blue">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewTarget(b)}
                      className="btn-primary text-sm py-2"
                    >
                      <Star size={14} /> Avaliar
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {trailTarget && (
        <LocationTrailMap
          isOpen
          onClose={() => setTrailTarget(null)}
          bookingId={trailTarget}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          isOpen
          onClose={() => setReviewTarget(null)}
          bookingId={reviewTarget.id}
          petsitterId={reviewTarget.petsitterId}
          petsitterName={reviewTarget.petsitter?.user?.name ?? 'o petsitter'}
        />
      )}
    </div>
  )
}
