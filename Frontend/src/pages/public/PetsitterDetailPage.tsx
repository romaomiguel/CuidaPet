import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Star, Clock, Shield, ChevronLeft,
  Calendar, MessageCircle, CheckCircle2, Navigation,
} from 'lucide-react'
import { petsitterService } from '@/services/petsitter.service'
import { reviewService }    from '@/services/review.service'
import { RatingStars }      from '@/components/ui/RatingStars'
import { Skeleton }         from '@/components/ui/Skeleton'
import { useAuthStore }     from '@/store/auth.store'
import { BookingModal }     from '@/components/booking/BookingModal'
import { formatCurrency, serviceLabels, avatarUrl, formatDate } from '@/utils'
import clsx from 'clsx'

type Tab = 'sobre' | 'servicos' | 'avaliacoes'

export function PetsitterDetailPage() {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [tab,         setTab]         = useState<Tab>('sobre')
  const [bookingOpen, setBookingOpen] = useState(false)

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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Petsitter não encontrado</h2>
        <p className="text-gray-500 mb-6">Este petsitter pode não estar disponível.</p>
        <Link to="/buscar" className="btn-primary">← Voltar à busca</Link>
      </div>
    </div>
  )

  const avgRating = ps.rating ?? 0
  const prices = Object.values(ps.pricingConfig || {}).map(p => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : ps.pricePerHour;
  const isStartingPrice = prices.length > 0;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'sobre',      label: 'Sobre'                           },
    { key: 'servicos',   label: 'Serviços'                        },
    { key: 'avaliacoes', label: `Avaliações (${reviews.length})`  },
  ]

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-10">

      {/* ════════════════════════════════════════════════════
          HERO — posição relative, SEM overflow-hidden
          para não clipar o card que aparece por baixo
      ════════════════════════════════════════════════════ */}
      <div className="relative h-60 sm:h-72 bg-gradient-to-br from-primary-700 via-primary-500 to-primary-400">
        {/* Imagem de cover (avatar como fallback) */}
        <img
          src={ps.photos?.[0] ?? avatarUrl(ps.user.name, ps.user.avatarUrl ?? undefined)}
          alt={ps.user.name}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        {/* Gradiente escuro no rodapé do hero */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        {/* ── Botão voltar ── */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-white bg-black/30 backdrop-blur-sm px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/50 transition-all"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        {/* ── Badge verificado ── */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 text-white bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold">
          <Shield size={12} /> Verificado
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          CONTEÚDO — relative z-10 garante que fica ACIMA
          do hero. O -mt-16 sobrepõe o hero intencionalmente.
      ════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Coluna principal ── */}
          <div className="flex-1 min-w-0 w-full">

            {/* Card do petsitter — aparece sobre o hero */}
            <div className="bg-white rounded-2xl shadow-card-hover p-5 mb-5 flex items-start gap-4">
              <img
                src={avatarUrl(ps.user.name, ps.user.avatarUrl ?? undefined)}
                alt={ps.user.name}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 ring-4 ring-white shadow-md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                    {ps.user.name}
                  </h1>
                  <span className={clsx(
                    'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
                    ps.isAvailable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500',
                  )}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full', ps.isAvailable ? 'bg-green-500' : 'bg-gray-400')} />
                    {ps.isAvailable ? 'Disponível' : 'Indisponível'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                  <MapPin size={13} className="flex-shrink-0" />
                  {ps.location ? `${ps.location}, ${ps.city}` : `${ps.city}, ${ps.state}`}
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2.5">
                  <div className="flex items-center gap-1.5">
                    <RatingStars value={avgRating} size="sm" showValue />
                    <span className="text-xs text-gray-400">({ps.totalReviews} avaliações)</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} /> Responde em menos de 1h
                  </div>
                </div>

                {ps.offersLocationSharing && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-2.5 py-1 mt-2.5">
                    <Navigation size={11} /> Compartilha localização durante passeios
                  </div>
                )}
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-gray-100">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={clsx(
                      'flex-1 py-3.5 text-sm font-medium transition-all duration-200',
                      tab === key
                        ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/60'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6">

                {/* ── SOBRE ── */}
                {tab === 'sobre' && (
                  <div className="space-y-5">
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {ps.bio || 'Este petsitter ainda não adicionou uma apresentação.'}
                    </p>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { icon: '📍', label: 'Cidade',     value: ps.city              },
                        { icon: '⭐', label: 'Avaliação',  value: `${avgRating.toFixed(1)}/5` },
                        { icon: '📋', label: 'Avaliações', value: String(ps.totalReviews) },
                        { icon: '✅', label: 'Verificado', value: 'Sim'                },
                        { icon: '💼', label: 'Serviços',   value: String(ps.services.length) },
                        { icon: '⏱️', label: 'Resposta',   value: '< 1 hora'           },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-3 text-center hover:bg-primary-50 transition-colors">
                          <div className="text-xl mb-1">{icon}</div>
                          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                          <p className="text-sm font-semibold text-gray-800">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Disponibilidade */}
                    {ps.scheduleConfig && Object.values(ps.scheduleConfig).some((d: any) => d?.enabled) && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Dias disponíveis</h3>
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
                )}

                {/* ── SERVIÇOS ── */}
                {tab === 'servicos' && (
                  <div className="space-y-3">
                    {ps.services.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">
                        Nenhum serviço cadastrado ainda.
                      </p>
                    ) : ps.services.map(s => {
                      const config = ps.pricingConfig?.[s]
                      return (
                        <div
                          key={s}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-primary-400 group-hover:text-primary-600 transition-colors" />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{serviceLabels[s]}</p>
                              <p className="text-xs text-gray-400">
                                {config?.type === 'fixed' ? 'Valor fixo' : 'Por hora'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary-600 text-lg">{formatCurrency(config?.price || ps.pricePerHour)}</p>
                            <p className="text-xs text-gray-400">{config?.type === 'fixed' ? 'por serviço' : '/hora'}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── AVALIAÇÕES ── */}
                {tab === 'avaliacoes' && (
                  <div className="space-y-5">
                    {reviews.length === 0 ? (
                      <div className="text-center py-10">
                        <MessageCircle size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-medium">Ainda sem avaliações</p>
                        <p className="text-gray-300 text-xs mt-1">Seja o primeiro a avaliar este petsitter!</p>
                      </div>
                    ) : reviews.map((r, idx) => (
                      <div
                        key={r.id}
                        className={clsx(
                          'pb-5',
                          idx < reviews.length - 1 && 'border-b border-gray-100',
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                            {r.tutor?.name?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {r.tutor?.name ?? 'Usuário'}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                          </div>
                        </div>
                        <RatingStars value={r.rating} size="sm" className="mb-1.5" />
                        {r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {r.tags.map(tag => (
                              <span key={tag} className="badge badge-blue">{tag}</span>
                            ))}
                          </div>
                        )}
                        {r.comment && (
                          <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── Sidebar de agendamento — desktop ── */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-card-hover p-6 sticky top-24">
              {/* Preço */}
              <div className="text-center pb-4 border-b border-gray-100 mb-4">
                <p className="text-3xl font-bold text-primary-600">
                  {formatCurrency(minPrice)}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {isStartingPrice ? 'a partir de' : 'por hora'}
                </p>
              </div>

              {/* Info */}
              <div className="space-y-2.5 mb-5 text-sm text-gray-600">
                {[
                  { icon: <Star size={15} className="text-secondary-500 fill-secondary-500" />, text: `${avgRating.toFixed(1)} (${ps.totalReviews} avaliações)` },
                  { icon: <Shield size={15} className="text-green-500" />,                      text: 'Petsitter verificado'                                     },
                  { icon: <Clock size={15} className="text-primary-400" />,                     text: 'Responde em menos de 1h'                                  },
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
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium">🐕 Você é petsitter</p>
                  <p className="text-xs text-blue-400 mt-1">Apenas tutores podem agendar serviços</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleBook}
                    disabled={!canBook}
                    className="btn-primary w-full py-3.5 text-base justify-center"
                  >
                    <Calendar size={18} />
                    {ps.isAvailable ? 'Agendar agora' : 'Indisponível'}
                  </button>
                  {isAuthenticated ? (
                    <p className="text-xs text-center text-gray-400 mt-3">
                      Você não será cobrado agora
                    </p>
                  ) : (
                    <p className="text-xs text-center text-gray-400 mt-3">
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
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3">
          {/* Mobile CTA — apenas para tutores/visitantes */}
          {(!isAuthenticated || isTutor) && (
            <>
              <div>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(minPrice)}
                  <span className="text-sm font-normal text-gray-400 ml-1">{isStartingPrice ? 'inicial' : '/h'}</span>
                </p>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-secondary-500 fill-secondary-500" />
                  <span className="text-xs text-gray-500">
                    {avgRating.toFixed(1)} ({ps.totalReviews})
                  </span>
                </div>
              </div>
              <button
                onClick={handleBook}
                disabled={!canBook}
                className="btn-primary px-7 py-3"
              >
                <Calendar size={16} />
                {ps.isAvailable ? 'Agendar' : 'Indisponível'}
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
    </div>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <Skeleton className="h-72 w-full rounded-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 -mt-14">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {/* Profile card skeleton */}
            <div className="bg-white rounded-2xl p-5 mb-5 flex gap-4 shadow-card-hover">
              <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-3 pt-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            {/* Tabs skeleton */}
            <div className="bg-white rounded-2xl p-6 shadow-card space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-3/6" />
            </div>
          </div>
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-card-hover space-y-4">
              <Skeleton className="h-10 w-32 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
