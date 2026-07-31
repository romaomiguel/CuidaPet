import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Search, SlidersHorizontal, X, AlertCircle } from 'lucide-react'
import { petsitterService } from '@/services/petsitter.service'
import { partnerService }   from '@/services/partner.service'
import { CardPetsitter }    from '@/components/petsitter/CardPetsitter'
import { CardPartner }      from '@/components/partner/CardPartner'
import { PetsitterFilters } from '@/components/petsitter/PetsitterFilters'
import { PartnerFilters }   from '@/components/partner/PartnerFilters'
import { SkeletonPetsitterCard } from '@/components/ui/Skeleton'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { useDisclosure }    from '@/hooks/useDisclosure'
import type { PetsitterFilters as Filters, ServiceType, PartnerType } from '@/types'
import { serviceLabels } from '@/utils'

const SORT_OPTIONS = [
  { value: 'rating',    label: 'Melhor avaliação' },
  { value: 'price_asc', label: 'Menor preço'      },
  { value: 'price_desc',label: 'Maior preço'      },
]

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const mobileFilters = useDisclosure()

  const [tab, setTab] = useState<'petsitter' | 'clinica' | 'petshop'>(
    (searchParams.get('tab') as 'petsitter' | 'clinica' | 'petshop') || 'petsitter',
  )

  // Init filters from URL
  const [filters, setFilters] = useState<Filters>({
    city:       searchParams.get('city')     ?? undefined,
    service:    (searchParams.get('service') as ServiceType) ?? undefined,
    minRating:  searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    maxPrice:   searchParams.get('maxPrice')  ? Number(searchParams.get('maxPrice'))  : undefined,
  })
  const [partnerFilters, setPartnerFilters] = useState<{ city?: string; service?: ServiceType }>({
    city: searchParams.get('city') ?? undefined,
  })
  const [sort,   setSort]   = useState('rating')
  const [search, setSearch] = useState(searchParams.get('city') ?? '')

  // Sync filters → URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (filters.city)       p.set('city',      filters.city)
    if (filters.service)    p.set('service',   filters.service)
    if (filters.minRating)  p.set('minRating', String(filters.minRating))
    if (filters.maxPrice)   p.set('maxPrice',  String(filters.maxPrice))
    setSearchParams(p, { replace: true })
  }, [filters, setSearchParams])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['petsitters', filters],
    queryFn:  () => petsitterService.list(filters),
    staleTime: 5 * 60 * 1000,
    enabled: tab === 'petsitter',
  })

  const { data: partnerData, isLoading: isLoadingPartners, isError: isErrorPartners } = useQuery({
    queryKey: ['partners', tab, partnerFilters],
    queryFn:  () => partnerService.list({ type: tab as PartnerType, ...partnerFilters }),
    staleTime: 5 * 60 * 1000,
    enabled: tab === 'clinica' || tab === 'petshop',
  })

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn:  petsitterService.getCities,
    staleTime: Infinity,
  })

  const petsitters = data?.data ?? []
  const partners = partnerData?.data ?? []

  const handleReset = () => {
    setFilters({})
    setPartnerFilters({})
    setSearch('')
  }

  const handleTabChange = (next: 'petsitter' | 'clinica' | 'petshop') => {
    setTab(next)
    const p = new URLSearchParams(searchParams)
    p.set('tab', next)
    setSearchParams(p, { replace: true })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(f => ({ ...f, city: search || undefined }))
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Search header bar ── */}
      <div className="bg-white border-b border-stroke shadow-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="flex-1 flex items-center bg-background rounded-pill px-4 py-1.5 border-2 border-transparent focus-within:border-primary-400 focus-within:bg-white transition-all">
              <CityAutocomplete
                value={search}
                onChange={setSearch}
                cities={cities}
                placeholder="Buscar por cidade..."
                className="w-full"
                icon={<Search size={16} className="text-muted flex-shrink-0" />}
              />
            </div>
            <button type="submit" className="btn-primary px-5 py-2.5">
              Buscar
            </button>
            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={mobileFilters.toggle}
              className="lg:hidden btn-outline px-4 py-2.5 relative"
            >
              <SlidersHorizontal size={16} />
              {(tab === 'petsitter' ? Object.values(filters) : Object.values(partnerFilters)).some(Boolean) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-500" />
              )}
            </button>
            {/* Match CTA */}
            <button
              type="button"
              onClick={() => navigate('/match')}
              className="hidden sm:flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 font-semibold text-sm px-4 py-2.5 rounded-pill transition-all whitespace-nowrap"
            >
              ✨ Match ideal
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6 bg-background p-1.5 rounded-pill w-fit shadow-sm">
          {(['petsitter', 'clinica', 'petshop'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTabChange(t)}
              className={clsx(
                'px-4 py-2 rounded-pill text-sm font-semibold transition-all',
                tab === t ? 'bg-white text-primary-700 shadow-sm' : 'text-muted hover:text-primary-600',
              )}
            >
              {t === 'petsitter' ? 'Cuidadores' : t === 'clinica' ? 'Clínicas' : 'Petshops'}
            </button>
          ))}
        </div>
        <div className="flex gap-8">

          {/* ── Sidebar filters — desktop ── */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="card sticky top-36">
              {tab === 'petsitter' ? (
                <PetsitterFilters
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleReset}
                  resultCount={petsitters.length}
                />
              ) : (
                <PartnerFilters
                  partnerType={tab as 'clinica' | 'petshop'}
                  filters={partnerFilters}
                  onChange={setPartnerFilters}
                  onReset={handleReset}
                  resultCount={partners.length}
                />
              )}
            </div>
          </div>

          {/* ── Mobile filters drawer ── */}
          {mobileFilters.isOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={mobileFilters.close} />
              <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading font-bold text-ink text-lg">Filtros</h3>
                  <button onClick={mobileFilters.close} className="p-2 rounded-full hover:bg-background">
                    <X size={20} />
                  </button>
                </div>
                {tab === 'petsitter' ? (
                  <PetsitterFilters
                    filters={filters}
                    onChange={setFilters}
                    onReset={handleReset}
                    resultCount={petsitters.length}
                  />
                ) : (
                  <PartnerFilters
                    partnerType={tab as 'clinica' | 'petshop'}
                    filters={partnerFilters}
                    onChange={setPartnerFilters}
                    onReset={handleReset}
                    resultCount={partners.length}
                  />
                )}
                <div className="mt-6 pt-4 border-t border-stroke">
                  <button onClick={mobileFilters.close} className="btn-primary w-full py-3">
                    {tab === 'petsitter' ? (
                      <>Ver {petsitters.length} resultado{petsitters.length !== 1 ? 's' : ''}</>
                    ) : (
                      <>Ver {partners.length} resultado{partners.length !== 1 ? 's' : ''}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Sort + count */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-muted text-sm">
                {tab === 'petsitter' ? (
                  isLoading ? 'Buscando...' : (
                    <><span className="font-semibold text-ink">{petsitters.length}</span> petsitter{petsitters.length !== 1 ? 's' : ''} encontrado{petsitters.length !== 1 ? 's' : ''}</>
                  )
                ) : (
                  isLoadingPartners ? 'Buscando...' : (
                    <><span className="font-semibold text-ink">{partners.length}</span> parceiro{partners.length !== 1 ? 's' : ''} encontrado{partners.length !== 1 ? 's' : ''}</>
                  )
                )}
              </p>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="select-field w-auto text-sm"
              >
                {SORT_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Active filter pills */}
            {tab === 'petsitter' ? (
              Object.entries(filters).some(([, v]) => v !== undefined) && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {filters.city && (
                    <span className="badge badge-green gap-1">
                      📍 {filters.city}
                      <button onClick={() => setFilters(f => ({ ...f, city: undefined }))}><X size={11} /></button>
                    </span>
                  )}
                  {filters.service && (
                    <span className="badge badge-green gap-1">
                      {serviceLabels[filters.service]}
                      <button onClick={() => setFilters(f => ({ ...f, service: undefined }))}><X size={11} /></button>
                    </span>
                  )}
                  {filters.maxPrice && (
                    <span className="badge badge-green gap-1">
                      até R$ {filters.maxPrice}/h
                      <button onClick={() => setFilters(f => ({ ...f, maxPrice: undefined }))}><X size={11} /></button>
                    </span>
                  )}
                  {filters.minRating && (
                    <span className="badge badge-green gap-1">
                      {filters.minRating}+ ⭐
                      <button onClick={() => setFilters(f => ({ ...f, minRating: undefined }))}><X size={11} /></button>
                    </span>
                  )}
                </div>
              )
            ) : (
              Object.entries(partnerFilters).some(([, v]) => v !== undefined) && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {partnerFilters.city && (
                    <span className="badge badge-green gap-1">
                      📍 {partnerFilters.city}
                      <button onClick={() => setPartnerFilters(f => ({ ...f, city: undefined }))}><X size={11} /></button>
                    </span>
                  )}
                  {partnerFilters.service && (
                    <span className="badge badge-green gap-1">
                      {serviceLabels[partnerFilters.service]}
                      <button onClick={() => setPartnerFilters(f => ({ ...f, service: undefined }))}><X size={11} /></button>
                    </span>
                  )}
                </div>
              )
            )}

            {tab === 'petsitter' ? (
              <>
                {/* Loading */}
                {isLoading && (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }, (_, i) => <SkeletonPetsitterCard key={i} />)}
                  </div>
                )}

                {/* Error */}
                {isError && !isLoading && (
                  <div className="card flex flex-col items-center justify-center py-20 text-center">
                    <AlertCircle size={40} className="text-stroke mb-4" />
                    <h3 className="font-heading font-semibold text-ink mb-1">Erro ao carregar petsitters</h3>
                    <p className="text-sm text-muted">Verifique se a API está rodando em localhost:3000</p>
                  </div>
                )}

                {/* Empty */}
                {!isLoading && !isError && petsitters.length === 0 && (
                  <div className="card flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-5xl mb-4">🐾</div>
                    <h3 className="font-heading font-semibold text-ink mb-1">Nenhum petsitter encontrado</h3>
                    <p className="text-sm text-muted mb-6">Tente ajustar os filtros ou buscar em outra cidade</p>
                    <div className="flex gap-3">
                      <button onClick={handleReset} className="btn-outline">Limpar filtros</button>
                      <button onClick={() => navigate('/match')} className="btn-primary">✨ Usar Match</button>
                    </div>
                  </div>
                )}

                {/* Grid */}
                {!isLoading && !isError && petsitters.length > 0 && (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {petsitters.map(ps => (
                      <CardPetsitter key={ps.id} petsitter={ps} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Loading */}
                {isLoadingPartners && (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }, (_, i) => <SkeletonPetsitterCard key={i} />)}
                  </div>
                )}

                {/* Error */}
                {isErrorPartners && !isLoadingPartners && (
                  <div className="card flex flex-col items-center justify-center py-20 text-center">
                    <AlertCircle size={40} className="text-stroke mb-4" />
                    <h3 className="font-heading font-semibold text-ink mb-1">Erro ao carregar parceiros</h3>
                    <p className="text-sm text-muted">Verifique se a API está rodando em localhost:3000</p>
                  </div>
                )}

                {/* Empty */}
                {!isLoadingPartners && !isErrorPartners && partners.length === 0 && (
                  <div className="card flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-5xl mb-4">🏪</div>
                    <h3 className="font-heading font-semibold text-ink mb-1">
                      Nenhum{tab === 'clinica' ? 'a clínica encontrada' : ' petshop encontrado'}
                    </h3>
                    <p className="text-sm text-muted mb-6">Tente ajustar os filtros ou buscar em outra cidade</p>
                    <button onClick={handleReset} className="btn-outline">Limpar filtros</button>
                  </div>
                )}

                {/* Grid */}
                {!isLoadingPartners && !isErrorPartners && partners.length > 0 && (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {partners.map(p => (
                      <CardPartner key={p.id} partner={p} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
