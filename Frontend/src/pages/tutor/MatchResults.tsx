import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { petsitterService } from '@/services/petsitter.service'
import { partnerService } from '@/services/partner.service'
import type { MatchResult } from '@/services/petsitter.service'
import { MapPin, ArrowLeft, Sparkles } from 'lucide-react'
import { avatarUrl } from '@/utils'
import { useServiceCatalog } from '@/hooks/useServiceCatalog'
import type { ServiceType, PartnerType } from '@/types'
import { CardPartner } from '@/components/partner/CardPartner'
import clsx from 'clsx'

// ── Badge de % de match, cor por faixa ───────────────────────────────────────

function matchBadgeClass(score: number) {
  if (score >= 95) return 'bg-primary-800 text-white'
  if (score >= 80) return 'bg-success-500 text-white'
  return 'bg-primary-100 text-primary-700'
}

// ── Card em destaque (1º colocado — só Petsitter) ────────────────────────────

function TopMatchCard({ ps }: { ps: MatchResult }) {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-[2rem] border-2 border-primary-500 shadow-lg overflow-hidden flex flex-col sm:flex-row">
      <div className="sm:w-40 bg-primary-800 text-white flex sm:flex-col items-center justify-center gap-2 p-6 text-center flex-shrink-0">
        <Sparkles size={20} className="text-secondary-400" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-100">Match Perfeito</p>
          <p className="font-heading text-3xl font-extrabold">{ps.matchScore}%</p>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <img
            src={avatarUrl(ps.user?.name || '', ps.user?.avatarUrl ?? undefined)}
            alt={ps.user?.name}
            className="avatar-framed w-16 h-16 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-ink text-lg truncate">{ps.user?.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted mt-0.5">
              <MapPin size={13} className="flex-shrink-0" />
              <span className="truncate">{ps.location ? `${ps.location}, ${ps.city}` : ps.city}</span>
            </div>
          </div>
        </div>

        {ps.matchReasons?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ps.matchReasons.slice(0, 4).map((reason, i) => (
              <span key={i} className="badge badge-blue">{reason}</span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-2">
          <button onClick={() => navigate(`/petsitters/${ps.id}`)} className="btn-secondary flex-1 justify-center">
            Agendar Visita
          </button>
          <button onClick={() => navigate(`/petsitters/${ps.id}`)} className="btn-outline flex-1 justify-center">
            Ver Perfil Completo
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Linha de match padrão (Petsitter) ────────────────────────────────────────

function MatchRow({ ps }: { ps: MatchResult }) {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-2xl border border-stroke shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="relative flex-shrink-0">
        <img
          src={avatarUrl(ps.user?.name || '', ps.user?.avatarUrl ?? undefined)}
          alt={ps.user?.name}
          className="avatar-framed w-14 h-14"
        />
        <span className={clsx('absolute -bottom-1 -right-1 text-[11px] font-bold px-1.5 py-0.5 rounded-pill border-2 border-white', matchBadgeClass(ps.matchScore))}>
          {ps.matchScore}%
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-ink truncate">{ps.user?.name}</h3>
        <div className="flex items-center gap-1 text-sm text-muted mt-0.5">
          <MapPin size={12} className="flex-shrink-0" />
          <span className="truncate">{ps.location ? `${ps.location}, ${ps.city}` : ps.city}</span>
        </div>
        {ps.matchReasons?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ps.matchReasons.slice(0, 3).map((reason, i) => (
              <span key={i} className="badge badge-gray">{reason}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => navigate(`/petsitters/${ps.id}`)} className="btn-outline text-sm px-4 py-2">
          Ver Perfil
        </button>
        <button onClick={() => navigate(`/petsitters/${ps.id}`)} className="btn-secondary text-sm px-4 py-2">
          Agendar
        </button>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function MatchResults() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const catalog = useServiceCatalog()

  const providerType = (searchParams.get('providerType') || 'petsitter') as 'petsitter' | 'clinica' | 'petshop'
  const isPartnerFlow = providerType === 'clinica' || providerType === 'petshop'

  const service      = searchParams.get('service')      || ''
  const species      = searchParams.get('species')      || ''
  const city         = searchParams.get('city')         || ''
  const neighborhood = searchParams.get('neighborhood') || undefined
  const date         = searchParams.get('date')         || undefined
  const startTime    = searchParams.get('startTime')    || undefined
  const endTime      = searchParams.get('endTime')      || undefined
  const endDate      = searchParams.get('endDate')      || undefined
  const maxPrice     = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const petEnergyLevel = (searchParams.get('petEnergyLevel') as 'baixo' | 'medio' | 'alto' | null) ?? undefined
  const petSocialLevel = (searchParams.get('petSocialLevel') as 'exclusivo' | 'sociavel' | null) ?? undefined
  const needsAirConditioning  = searchParams.get('needsAirConditioning') === 'true'
  const needsBackyard         = searchParams.get('needsBackyard') === 'true'
  const preferredWalkSchedule = searchParams.get('preferredWalkSchedule') as 'manha' | 'noite' | undefined
  const preferredHomeType     = searchParams.get('preferredHomeType') as 'casa' | 'apartamento' | undefined

  const { data: matches, isLoading: isLoadingPetsitters } = useQuery({
    queryKey: ['match', { service, species, city, neighborhood, date, startTime, endTime, endDate, maxPrice, petEnergyLevel, petSocialLevel, needsAirConditioning, needsBackyard, preferredWalkSchedule, preferredHomeType }],
    queryFn:  () => petsitterService.getMatches({
      service, species, city, neighborhood, date, startTime, endTime, endDate, maxPrice,
      petEnergyLevel, petSocialLevel, needsAirConditioning, needsBackyard, preferredWalkSchedule, preferredHomeType,
    }),
    enabled: !isPartnerFlow && !!service && !!species && !!city,
  })

  const { data: partnerResults, isLoading: isLoadingPartners, isError: isErrorPartners, refetch: refetchPartners } = useQuery({
    queryKey: ['partner-match', { providerType, service, city }],
    queryFn:  () => partnerService.list({ type: providerType as PartnerType, service: service as ServiceType, city, limit: 50 }),
    enabled: isPartnerFlow && !!service && !!city,
  })

  const isLoading = isPartnerFlow ? isLoadingPartners : isLoadingPetsitters
  const partners = partnerResults?.data ?? []

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
          <Sparkles size={22} className="absolute inset-0 m-auto text-primary-500 animate-pulse" />
        </div>
        <p className="text-ink font-semibold text-lg">
          {isPartnerFlow ? 'Buscando parceiros na sua região…' : 'Encontrando seu match perfeito…'}
        </p>
        <p className="text-muted text-sm">
          {isPartnerFlow ? 'Verificando serviços e localização' : 'Analisando disponibilidade, localização e avaliações'}
        </p>
      </div>
    )
  }

  // ── Resultado: parceiro (lista filtrada, sem score) ──────────────────────

  if (isPartnerFlow) {
    if (isErrorPartners) {
      return (
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">📡</div>
          <h2 className="font-heading text-2xl font-bold text-ink mb-2">Não conseguimos buscar parceiros agora</h2>
          <p className="text-muted mb-8">
            Tivemos um problema para carregar {providerType === 'clinica' ? 'as clínicas' : 'os petshops'} da sua região. Tente novamente em instantes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => refetchPartners()} className="btn-primary">
              Tentar novamente
            </button>
            <button onClick={() => navigate('/match')} className="btn-secondary">
              Refazer a busca
            </button>
          </div>
        </div>
      )
    }

    if (partners.length === 0) {
      return (
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">😿</div>
          <h2 className="font-heading text-2xl font-bold text-ink mb-2">Nenhum parceiro encontrado</h2>
          <p className="text-muted mb-8">
            Não encontramos {providerType === 'clinica' ? 'clínicas' : 'petshops'} com esse serviço na sua cidade ainda.
          </p>
          <button onClick={() => navigate('/match')} className="btn-primary">
            Refazer a busca
          </button>
        </div>
      )
    }

    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate('/match')}
          className="flex items-center gap-2 text-muted hover:text-primary-600 transition-colors mb-8 font-semibold text-sm"
        >
          <ArrowLeft size={16} /> Refazer busca
        </button>

        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-800 mb-3">
            {providerType === 'clinica' ? 'Clínicas' : 'Petshops'} na sua região
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            {catalog.label(service)} · {city} — {partners.length} parceiro{partners.length !== 1 ? 's' : ''} encontrado{partners.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {partners.map((p) => <CardPartner key={p.id} partner={p} />)}
        </div>
      </div>
    )
  }

  // ── Resultado: petsitter (com score) ─────────────────────────────────────

  if (!matches || matches.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😿</div>
        <h2 className="font-heading text-2xl font-bold text-ink mb-2">Nenhum match encontrado</h2>
        <p className="text-muted mb-8">
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

  const [topMatch, ...restMatches] = matches

  const summaryParts: string[] = []
  if (service)      summaryParts.push(catalog.label(service))
  if (city)         summaryParts.push(city)
  if (neighborhood) summaryParts.push(`bairro ${neighborhood}`)
  if (date)         summaryParts.push(new Date(date + 'T12:00:00').toLocaleDateString('pt-BR'))
  if (startTime)    summaryParts.push(`às ${startTime}`)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      <button
        onClick={() => navigate('/match')}
        className="flex items-center gap-2 text-muted hover:text-primary-600 transition-colors mb-8 font-semibold text-sm"
      >
        <ArrowLeft size={16} /> Refazer busca
      </button>

      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-800 mb-3">
          Encontramos os cuidadores ideais para você!
        </h1>
        <p className="text-muted max-w-xl mx-auto">
          Nossa inteligência artificial cruzou o perfil do seu pet com nossa rede de cuidadores certificados.
          Aqui estão os melhores matches para um cuidado cheio de amor e segurança.
        </p>
        <p className="text-sm text-muted mt-3">
          {summaryParts.join(' · ')} — {matches.length} profissional{matches.length !== 1 ? 'is' : ''} encontrado{matches.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <TopMatchCard ps={topMatch} />
        {restMatches.map(ps => <MatchRow key={ps.id} ps={ps} />)}
      </div>

      <div className="mt-12 pt-8 border-t border-stroke text-center">
        <p className="text-muted text-sm mb-3">Quer explorar mais opções?</p>
        <Link to="/buscar" className="btn-outline">
          Ver todos os petsitters →
        </Link>
      </div>
    </div>
  )
}
