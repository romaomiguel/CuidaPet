import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, ChevronLeft, Images } from 'lucide-react'
import { partnerService } from '@/services/partner.service'
import { Skeleton } from '@/components/ui/Skeleton'
import { avatarUrl } from '@/utils'
import { useServiceCatalog } from '@/hooks/useServiceCatalog'
import clsx from 'clsx'

export function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const catalog = useServiceCatalog()

  const { data: partner, isLoading, isError } = useQuery({
    queryKey: ['partner', id],
    queryFn: () => partnerService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <LoadingSkeleton />

  if (isError || !partner) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="font-heading text-xl font-bold text-ink mb-2">Parceiro não encontrado</h2>
        <p className="text-muted mb-6">Este parceiro pode não estar disponível.</p>
        <Link to="/buscar" className="btn-primary">← Voltar à busca</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-10">

      <div className="relative h-60 sm:h-72 md:h-80 bg-primary-100 overflow-hidden">
        <img
          src={partner.photos?.[0] ?? avatarUrl(partner.businessName, partner.user.avatarUrl ?? undefined)}
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
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-20">
        <div className="flex flex-col gap-6">

          <div className="flex flex-col md:flex-row gap-5 items-start md:items-end">
            <img
              src={avatarUrl(partner.businessName, partner.user.avatarUrl ?? undefined)}
              alt={partner.businessName}
              className="w-28 h-28 md:w-40 md:h-40 rounded-2xl object-cover shadow-xl ring-4 ring-white flex-shrink-0 bg-white"
            />
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-ink leading-tight">
                  {partner.businessName}
                </h1>
                <span className={partner.type === 'clinica' ? 'badge-brand' : 'badge-blue'}>
                  {partner.type === 'clinica' ? 'Clínica' : 'Petshop'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted text-sm">
                <MapPin size={16} className="text-primary-500 flex-shrink-0" />
                {partner.address}, {partner.city} - {partner.state}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-heading text-lg font-bold text-ink mb-5">Serviços</h2>
            {partner.servicesOffered.length === 0 ? (
              <p className="text-center text-muted py-8 text-sm">Nenhum serviço cadastrado ainda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {partner.servicesOffered.map((s, i) => (
                  <div key={s} className="flex items-center gap-3 p-4 bg-background rounded-2xl">
                    <div className={clsx(
                      'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-xl',
                      i % 2 === 0 ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700',
                    )} aria-hidden="true">
                      {catalog.emoji(s)}
                    </div>
                    <span className="font-semibold text-ink text-sm">{catalog.label(s)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-heading text-lg font-bold text-ink mb-4">Galeria</h2>
            {partner.photos && partner.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {partner.photos.slice(0, 4).map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`Foto ${i + 1} de ${partner.businessName}`}
                    className="w-full aspect-square object-cover rounded-2xl shadow-sm hover:scale-105 transition-transform duration-300 cursor-pointer"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <Images size={32} className="text-stroke mb-3" />
                <p className="text-muted text-sm font-medium">Nenhuma foto adicionada ainda</p>
                <p className="text-muted/70 text-xs mt-1">{partner.businessName} ainda não incluiu fotos no perfil.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-60 sm:h-72 md:h-80 w-full rounded-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-20">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-5 items-start md:items-end">
            <Skeleton className="w-28 h-28 md:w-40 md:h-40 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-3 pb-1 w-full">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="card space-y-3">
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
          <div className="card space-y-3">
            <Skeleton className="h-5 w-20 mb-2" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="aspect-square w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
