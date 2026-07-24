import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { petsitterService } from '@/services/petsitter.service'
import type { MatchResult } from '@/services/petsitter.service'
import { Star, MapPin, Award, ArrowLeft, ChevronRight } from 'lucide-react'
import { avatarUrl, serviceLabels, formatCurrency } from '@/utils'
import type { ServiceType } from '@/types'
import clsx from 'clsx'

// ── Componente de card de resultado ──────────────────────────────────────────

function MatchCard({ ps, rank }: { ps: MatchResult; rank: number }) {
  const navigate = useNavigate()
  const isTop = rank === 1
  const prices = Object.values(ps.pricingConfig || {}).map(p => p.price)
  const displayPrice = prices.length > 0 ? Math.min(...prices) : ps.pricePerHour

  return (
    <div
      onClick={() => navigate(`/petsitters/${ps.id}`)}
      className={clsx(
        'relative bg-white rounded-2xl border p-5 cursor-pointer',
        'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group',
        isTop
          ? 'border-primary-300 ring-2 ring-primary-100 shadow-md'
          : 'border-gray-200 shadow-sm',
      )}
    >
      {/* Badge de ranking */}
      {rank <= 3 && (
        <div className={clsx(
          'absolute -top-3 left-5 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1',
          rank === 1 ? 'bg-primary-500 text-white' :
          rank === 2 ? 'bg-gray-700 text-white' :
                       'bg-amber-500 text-white',
        )}>
          {rank === 1 ? '🥇 Melhor Match' : rank === 2 ? '🥈 2º lugar' : '🥉 3º lugar'}
        </div>
      )}

      <div className="flex items-start gap-4 mt-2">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={avatarUrl(ps.user?.name || '', ps.user?.avatarUrl ?? undefined)}
            alt={ps.user?.name}
            className="w-16 h-16 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
          {/* Score badge sobreposto */}
          <div className={clsx(
            'absolute -bottom-2 -right-2 text-xs font-bold px-2 py-0.5 rounded-full shadow border-2 border-white',
            ps.matchScore >= 80 ? 'bg-green-500 text-white' :
            ps.matchScore >= 60 ? 'bg-primary-500 text-white' :
                                  'bg-gray-500 text-white',
          )}>
            {ps.matchScore}%
          </div>
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-primary-600 transition-colors truncate">
                {ps.user?.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {ps.location ? `${ps.location}, ${ps.city}` : ps.city}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold text-gray-900">
                {formatCurrency(displayPrice)}
              </div>
              <div className="text-xs text-gray-400">/hora</div>
            </div>
          </div>

          {/* Estrelas */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < Math.round(ps.rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 fill-gray-200'}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-800">{ps.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({ps.totalReviews})</span>
          </div>
        </div>
      </div>

      {/* Razões do match */}
      {ps.matchReasons && ps.matchReasons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-1.5">
          {ps.matchReasons.map((reason, i) => (
            <span key={i} className="text-sm text-gray-600 leading-snug">
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* CTA link */}
      <div className="mt-4 flex justify-end">
        <span className="text-sm font-semibold text-primary-600 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
          Ver perfil <ChevronRight size={14} />
        </span>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function MatchResults() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const service      = searchParams.get('service')      || ''
  const species      = searchParams.get('species')      || ''
  const city         = searchParams.get('city')         || ''
  const neighborhood = searchParams.get('neighborhood') || undefined
  const date         = searchParams.get('date')         || undefined
  const startTime    = searchParams.get('startTime')    || undefined
  const endTime      = searchParams.get('endTime')      || undefined
  const endDate      = searchParams.get('endDate')      || undefined
  const maxPrice     = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined

  const { data: matches, isLoading } = useQuery({
    queryKey: ['match', { service, species, city, neighborhood, date, startTime, endTime, endDate, maxPrice }],
    queryFn:  () => petsitterService.getMatches({
      service, species, city, neighborhood, date, startTime, endTime, endDate, maxPrice,
    }),
    enabled: !!service && !!species && !!city,
  })

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">✨</div>
        </div>
        <p className="text-gray-600 font-semibold text-lg">Encontrando seu match perfeito…</p>
        <p className="text-gray-400 text-sm">Analisando disponibilidade, localização e avaliações</p>
      </div>
    )
  }

  // ── Sem resultados ────────────────────────────────────────────────────────

  if (!matches || matches.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😿</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum match encontrado</h2>
        <p className="text-gray-500 mb-8">
          Não encontramos petsitters que atendam a todos os seus critérios agora.
          Tente ajustar a data, o bairro ou o orçamento.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/match')} className="btn-primary">
            Refazer a busca
          </button>
          <Link to="/buscar" className="btn-secondary">
            Busca manual
          </Link>
        </div>
      </div>
    )
  }

  const topMatches   = matches.slice(0, 3)
  const otherMatches = matches.slice(3)

  // ── Resumo do filtro aplicado ─────────────────────────────────────────────

  const summaryParts: string[] = []
  if (service)      summaryParts.push(serviceLabels[service as ServiceType] || service)
  if (city)         summaryParts.push(city)
  if (neighborhood) summaryParts.push(`bairro ${neighborhood}`)
  if (date)         summaryParts.push(new Date(date + 'T12:00:00').toLocaleDateString('pt-BR'))
  if (startTime)    summaryParts.push(`às ${startTime}`)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Breadcrumb / Voltar */}
      <button
        onClick={() => navigate('/match')}
        className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors mb-6 font-medium text-sm"
      >
        <ArrowLeft size={16} /> Refazer busca
      </button>

      {/* Cabeçalho de resultados */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Seus Matches ✨
        </h1>
        <p className="text-gray-500 text-sm">
          {summaryParts.join(' · ')} — {matches.length} profissional{matches.length !== 1 ? 'is' : ''} encontrado{matches.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Top 3 */}
      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
          <Award size={20} className="text-amber-500" /> Top Matches
        </h2>
        <div className="flex flex-col gap-5">
          {topMatches.map((ps, i) => (
            <MatchCard key={ps.id} ps={ps} rank={i + 1} />
          ))}
        </div>
      </div>

      {/* Outras opções */}
      {otherMatches.length > 0 && (
        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Outras ótimas opções</h2>
          <div className="flex flex-col gap-4">
            {otherMatches.map((ps, i) => (
              <MatchCard key={ps.id} ps={ps} rank={i + 4} />
            ))}
          </div>
        </div>
      )}

      {/* Ação de busca manual */}
      <div className="mt-10 pt-8 border-t border-gray-100 text-center">
        <p className="text-gray-500 text-sm mb-3">Quer explorar mais opções?</p>
        <Link to="/buscar" className="btn-outline">
          Ver todos os petsitters →
        </Link>
      </div>
    </div>
  )
}
