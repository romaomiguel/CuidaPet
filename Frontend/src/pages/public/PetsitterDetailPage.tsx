import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Star, Clock, Shield, ChevronLeft, Calendar, MessageCircle,
  Navigation, Home, Footprints, GraduationCap, Bath, DoorOpen, Users, Images,
} from 'lucide-react'
import { petsitterService } from '@/services/petsitter.service'
import { reviewService }    from '@/services/review.service'
import { RatingStars }      from '@/components/ui/RatingStars'
import { Skeleton }         from '@/components/ui/Skeleton'
import { Modal }            from '@/components/ui/Modal'
import { useAuthStore }     from '@/store/auth.store'
import { BookingModal }     from '@/components/booking/BookingModal'
import { formatCurrency, serviceLabels, speciesLabels, avatarUrl, formatDate } from '@/utils'
import clsx from 'clsx'
import type { ServiceType, Review } from '@/types'

const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  hospedagem:   <Home size={20} />,
  passeio:      <Footprints size={20} />,
  adestramento: <GraduationCap size={20} />,
  banho_e_tosa: <Bath size={20} />,
  visita:       <DoorOpen size={20} />,
  creche:       <Users size={20} />,
}

const REVIEWS_PREVIEW_COUNT = 3

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={avatarUrl(review.tutor?.name ?? 'Usuário', review.tutor?.avatarUrl ?? undefined)}
            alt={review.tutor?.name ?? 'Usuário'}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{review.tutor?.name ?? 'Usuário'}</p>
            <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <RatingStars value={review.rating} size="sm" className="flex-shrink-0" />
      </div>
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {review.tags.map(tag => (
            <span key={tag} className="badge badge-blue">{tag}</span>
          ))}
        </div>
      )}
      {review.comment && (
        <p className="text-sm text-muted leading-relaxed italic">"{review.comment}"</p>
      )}
    </div>
  )
}

export function PetsitterDetailPage() {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)

  const { data: ps, isLoading, isError } = useQuery({
    queryKey: ['petsitter', id],
    queryFn:  () => petsitterService.getById(id!),
    enabled:  !!id,
  })

  // GET /reviews/petsitter/:petsitterId espera o User.id do petsitter, não o
  // PetsitterProfile.id (que é o `id` da URL/rota) — por isso depende de `ps.userId`,
  // carregado pela query acima, em vez do `id` da rota diretamente.
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', ps?.userId],
    queryFn:  () => reviewService.listByPetsitter(ps!.userId),
    enabled:  !!ps?.userId,
    // Não falha a página se reviews falharem
    retry: false,
  })

  const isTutor    = !user || user.role === 'tutor'
  const canBook    = ps?.isAvailable && (isTutor || !isAuthenticated)

  const handleBook = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!isTutor) {
      // Petsitter tentando agendar — guia para busca
      return
    }
    setBookingOpen(true)
  }

  if (isLoading) return <LoadingSkeleton />

  if (isError || !ps) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">🐾</div>
        <h2 className="font-heading text-xl font-bold text-ink mb-2">Petsitter não encontrado</h2>
        <p className="text-muted mb-6">Este petsitter pode não estar disponível.</p>
        <Link to="/buscar" className="btn-primary">← Voltar à busca</Link>
      </div>
    </div>
  )

  const avgRating = ps.rating ?? 0
  const prices = Object.values(ps.pricingConfig || {}).map(p => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : ps.pricePerHour;
  const isStartingPrice = prices.length > 0;
  const firstName = ps.user.name.split(' ')[0]

  const aboutTags = [
    ...(ps.acceptedSpecies ?? []).map(s => ({ key: `species-${s}`, label: speciesLabels[s] ?? s })),
    ...(ps.offersLocationSharing ? [{ key: 'location-sharing', label: 'Compartilha localização' }] : []),
  ]

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-10">

      {/* ════════════════════════════════════════════════════
          HERO — foto ambiente, sem overlay colorido forte,
          esmaece pro fundo (background) por baixo
      ════════════════════════════════════════════════════ */}
      <div className="relative h-60 sm:h-72 md:h-80 bg-primary-100 overflow-hidden">
        <img
          src={ps.photos?.[0] ?? avatarUrl(ps.user.name, ps.user.avatarUrl ?? undefined)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-ink bg-white/80 backdrop-blur-sm px-3 py-2 rounded-pill text-sm font-medium hover:bg-white transition-all shadow-sm"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 text-white bg-emerald-500/90 backdrop-blur-sm px-3 py-1.5 rounded-pill text-xs font-semibold">
          <Shield size={12} /> Verificado
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          CONTEÚDO — sobrepõe o hero intencionalmente
      ════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:pl-4 lg:pr-8 -mt-14 md:-mt-20">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* ── Coluna principal ── */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-6">

            {/* ── Cabeçalho: avatar + identidade ── */}
            <div className="flex flex-col md:flex-row gap-5 items-start md:items-end">
              <img
                src={avatarUrl(ps.user.name, ps.user.avatarUrl ?? undefined)}
                alt={ps.user.name}
                className="w-28 h-28 md:w-40 md:h-40 rounded-2xl object-cover shadow-xl ring-4 ring-white flex-shrink-0 bg-white"
              />
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-ink leading-tight">
                    {ps.user.name}
                  </h1>
                  <span className={clsx(
                    'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-pill',
                    ps.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-stroke text-muted',
                  )}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full', ps.isAvailable ? 'bg-emerald-500' : 'bg-muted')} />
                    {ps.isAvailable ? 'Disponível' : 'Indisponível'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-muted text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-primary-500 flex-shrink-0" />
                    {ps.location ? `${ps.location}, ${ps.city}` : `${ps.city}, ${ps.state}`}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-stroke" />
                  <div className="flex items-center gap-1">
                    <RatingStars value={avgRating} size="sm" />
                    <span className="font-bold text-ink">{avgRating.toFixed(1)}</span>
                    <span>({reviews.length} avaliações)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sobre mim ── */}
            <div className="card">
              <h2 className="font-heading text-lg font-bold text-ink mb-4">Sobre mim</h2>
              <p className="text-muted leading-relaxed text-sm">
                {ps.bio || 'Este petsitter ainda não adicionou uma apresentação.'}
              </p>

              {aboutTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {aboutTags.map(({ key, label }, i) => (
                    <span
                      key={key}
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-sm font-medium',
                        i % 2 === 0 ? 'bg-primary-50 text-primary-700' : 'bg-secondary-50 text-secondary-700',
                      )}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {ps.scheduleConfig && Object.values(ps.scheduleConfig).some((d: any) => d?.enabled) && (
                <div className="mt-5">
                  <h3 className="font-semibold text-ink mb-2 text-sm">Dias disponíveis</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ps.scheduleConfig)
                      .filter(([, d]: [string, any]) => d?.enabled)
                      .map(([day, d]: [string, any]) => (
                        <span key={day} className="badge badge-green">{day} <span className="font-normal opacity-75">{d.start}-{d.end}</span></span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Serviços ── */}
            <div className="card">
              <h2 className="font-heading text-lg font-bold text-ink mb-5">Serviços</h2>
              {ps.services.length === 0 ? (
                <p className="text-center text-muted py-8 text-sm">
                  Nenhum serviço cadastrado ainda.
                </p>
              ) : (
                <div className="space-y-3">
                  {ps.services.map((s, i) => {
                    const config = ps.pricingConfig?.[s]
                    return (
                      <div
                        key={s}
                        className="flex items-center justify-between p-4 bg-background rounded-2xl hover:bg-stroke/40 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={clsx(
                            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                            i % 2 === 0 ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700',
                          )}>
                            {SERVICE_ICONS[s]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-ink">{serviceLabels[s]}</h3>
                            <p className="text-xs text-muted">
                              {config?.type === 'fixed' ? 'Valor fixo' : 'Por hora'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-heading font-bold text-ink text-lg block">
                            {formatCurrency(config?.price || ps.pricePerHour)}
                          </span>
                          <span className="text-xs text-muted">
                            {config?.type === 'fixed' ? 'por serviço' : 'por hora'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Galeria — mostra as fotos reais do petsitter, ou um aviso honesto de que ainda não tem ── */}
            <div className="card">
              <h2 className="font-heading text-lg font-bold text-ink mb-4">Galeria</h2>
              {ps.photos && ps.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {ps.photos.slice(0, 4).map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Foto ${i + 1} de ${ps.user.name}`}
                      className="w-full aspect-square object-cover rounded-2xl shadow-sm hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <Images size={32} className="text-stroke mb-3" />
                  <p className="text-muted text-sm font-medium">Nenhuma foto adicionada ainda</p>
                  <p className="text-muted/70 text-xs mt-1">{firstName} ainda não incluiu fotos no perfil.</p>
                </div>
              )}
            </div>

            {/* ── Avaliações — prévia aqui, lista completa no modal ── */}
            <div>
              <h2 className="font-heading text-lg font-bold text-ink mb-5">
                Avaliações {reviews.length > 0 && `(${reviews.length})`}
              </h2>
              {reviews.length === 0 ? (
                <div className="card text-center py-10">
                  <MessageCircle size={36} className="text-stroke mx-auto mb-3" />
                  <p className="text-muted text-sm font-medium">Ainda sem avaliações</p>
                  <p className="text-muted/70 text-xs mt-1">Seja o primeiro a avaliar este petsitter!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {reviews.slice(0, REVIEWS_PREVIEW_COUNT).map(r => (
                      <ReviewCard key={r.id} review={r} />
                    ))}
                  </div>
                  {reviews.length > REVIEWS_PREVIEW_COUNT && (
                    <div className="flex justify-center mt-5">
                      <button onClick={() => setReviewsOpen(true)} className="btn-outline">
                        Ver mais avaliações ({reviews.length - REVIEWS_PREVIEW_COUNT})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Sidebar de agendamento — desktop ── */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="card sticky top-24">
              <h3 className="font-heading text-lg font-bold text-ink mb-1">Resumo da Reserva</h3>
              <p className="text-sm text-muted mb-5">
                {ps.isAvailable ? 'Escolha os detalhes ao agendar.' : `${firstName} está indisponível no momento.`}
              </p>

              {/* Preço */}
              <div className="text-center pb-4 border-b border-stroke mb-4">
                <p className="font-heading text-3xl font-extrabold text-primary-600">
                  {formatCurrency(minPrice)}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  {isStartingPrice ? 'a partir de' : 'por hora'}
                </p>
              </div>

              {/* Info */}
              <div className="space-y-2.5 mb-5 text-sm text-muted">
                {[
                  { icon: <Star size={15} className="text-secondary-500 fill-secondary-500" />, text: `${avgRating.toFixed(1)} (${reviews.length} avaliações)` },
                  { icon: <Shield size={15} className="text-emerald-500" />,                     text: 'Petsitter verificado'                              },
                  { icon: <Clock size={15} className="text-primary-400" />,                      text: 'Responde em menos de 1h'                           },
                  ...(ps.offersLocationSharing
                    ? [{ icon: <Navigation size={15} className="text-primary-500" />, text: 'Compartilha localização durante passeios' }]
                    : []),
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    {icon}<span>{text}</span>
                  </div>
                ))}
              </div>

              {/* CTA — mostrar apenas para tutores ou visitantes */}
              {isAuthenticated && !isTutor ? (
                <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center">
                  <p className="text-sm text-primary-700 font-medium">🐕 Você é petsitter</p>
                  <p className="text-xs text-primary-500 mt-1">Apenas tutores podem agendar serviços</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleBook}
                    disabled={!canBook}
                    className="btn-primary w-full py-3.5 text-base justify-center"
                  >
                    <Calendar size={18} />
                    {ps.isAvailable ? `Contratar ${firstName}` : 'Indisponível'}
                  </button>
                  {isAuthenticated ? (
                    <p className="text-xs text-center text-muted mt-3">
                      Você não será cobrado ainda.
                    </p>
                  ) : (
                    <p className="text-xs text-center text-muted mt-3">
                      <Link to="/login" className="text-primary-500 hover:underline font-medium">Entre</Link>
                      {' '}para agendar
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── CTA fixo mobile ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stroke shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3">
          {/* Mobile CTA — apenas para tutores/visitantes */}
          {(!isAuthenticated || isTutor) && (
            <>
              <div>
                <p className="font-heading text-xl font-bold text-primary-600">
                  {formatCurrency(minPrice)}
                  <span className="text-sm font-normal text-muted ml-1">{isStartingPrice ? 'inicial' : '/h'}</span>
                </p>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-secondary-500 fill-secondary-500" />
                  <span className="text-xs text-muted">
                    {avgRating.toFixed(1)} ({reviews.length})
                  </span>
                </div>
              </div>
              <button
                onClick={handleBook}
                disabled={!canBook}
                className="btn-primary px-7 py-3"
              >
                <Calendar size={16} />
                {ps.isAvailable ? 'Contratar' : 'Indisponível'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Booking modal ── */}
      {ps && (
        <BookingModal
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          petsitter={ps}
        />
      )}

      {/* ── Todas as avaliações — flutua sobre a mesma tela, sem navegar ── */}
      <Modal
        isOpen={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        title={`Avaliações (${reviews.length})`}
        description={`O que dizem sobre ${firstName}`}
        size="2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map(r => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </Modal>
    </div>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <Skeleton className="h-72 w-full rounded-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 -mt-14">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            {/* Header skeleton */}
            <div className="flex gap-5 items-end">
              <Skeleton className="w-28 h-28 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-3 pb-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            {/* Sobre mim skeleton */}
            <div className="card space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            {/* Serviços skeleton */}
            <div className="card space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="card space-y-4">
              <Skeleton className="h-10 w-32 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full rounded-pill" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
