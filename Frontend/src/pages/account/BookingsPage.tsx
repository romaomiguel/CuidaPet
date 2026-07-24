import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '@/services/booking.service'
import { SkeletonList }   from '@/components/ui/Skeleton'
import { RatingStars }    from '@/components/ui/RatingStars'
import { ReviewModal }    from '@/components/booking/ReviewModal'
import { LocationTrailMap } from '@/components/location/LocationTrailMap'
import { formatCurrency, formatDateShort, bookingStatusConfig, serviceLabels, avatarUrl } from '@/utils'
import { CalendarDays, AlertCircle, X, Star, MapPin } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import type { Booking, BookingStatus } from '@/types'

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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays size={24} className="text-primary-500" /> Meus agendamentos
        </h1>
        <p className="text-gray-500 mt-1">Histórico e status dos seus pedidos</p>
      </div>

      {isLoading && <SkeletonList count={4} component="booking" />}

      {isError && (
        <div className="card flex flex-col items-center py-12 text-center">
          <AlertCircle size={36} className="text-gray-300 mb-3" />
          <p className="text-gray-500">Erro ao carregar agendamentos</p>
        </div>
      )}

      {!isLoading && !isError && bookings.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="font-semibold text-gray-700 mb-1">Nenhum agendamento ainda</h3>
          <p className="text-sm text-gray-400">Encontre um petsitter e faça seu primeiro agendamento!</p>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map(b => {
          const cfg = bookingStatusConfig[b.status as BookingStatus]
          return (
            <div key={b.id} className="card hover:shadow-card-hover transition-all duration-200">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl(b.petsitter?.user?.name ?? 'P', b.petsitter?.user?.avatarUrl ?? undefined)}
                    alt={b.petsitter?.user?.name}
                    className="w-11 h-11 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{b.petsitter?.user?.name}</p>
                    <p className="text-xs text-gray-400">{serviceLabels[b.service]}</p>
                  </div>
                </div>
                <span className={clsx('badge', cfg.badgeClass)}>{cfg.label}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Pet</p>
                  <p className="font-medium text-gray-800">{b.pets?.[0]?.name || 'Pet'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Valor</p>
                  <p className="font-medium text-gray-800">{formatCurrency(b.totalPrice)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Início</p>
                  <p className="font-medium text-gray-800">{formatDateShort(b.startDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Término</p>
                  <p className="font-medium text-gray-800">{formatDateShort(b.endDate)}</p>
                </div>
              </div>

              {(b.status === 'accepted' || b.status === 'completed') && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setTrailTarget(b.id)}
                    className="btn-ghost text-primary-600 hover:bg-primary-50 text-sm"
                  >
                    <MapPin size={14} /> Ver trajeto
                  </button>
                </div>
              )}

              {b.status === 'pending' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => cancelMutation.mutate(b.id)}
                    disabled={cancelMutation.isPending}
                    className="btn-ghost text-red-500 hover:bg-red-50 text-sm"
                  >
                    <X size={14} /> Cancelar
                  </button>
                </div>
              )}

              {b.status === 'completed' && (
                <div className="mt-4 flex justify-end">
                  {b.review ? (
                    <div className="flex flex-col items-end gap-1.5 text-sm text-gray-500">
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
