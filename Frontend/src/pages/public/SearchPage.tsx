import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X, AlertCircle } from 'lucide-react'
import { petsitterService } from '@/services/petsitter.service'
import { CardPetsitter }    from '@/components/petsitter/CardPetsitter'
import { PetsitterFilters } from '@/components/petsitter/PetsitterFilters'
import { SkeletonPetsitterCard } from '@/components/ui/Skeleton'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { useDisclosure }    from '@/hooks/useDisclosure'
import type { PetsitterFilters as Filters, ServiceType } from '@/types'
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

  // Init filters from URL
  const [filters, setFilters] = useState<Filters>({
    city:       searchParams.get('city')     ?? undefined,
    service:    (searchParams.get('service') as ServiceType) ?? undefined,
    minRating:  searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    maxPrice:   searchParams.get('maxPrice')  ? Number(searchParams.get('maxPrice'))  : undefined,
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
  })

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn:  petsitterService.getCities,
    staleTime: Infinity,
  })

  const petsitters = data?.data ?? []

  const handleReset = () => {
    setFilters({})
    setSearch('')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(f => ({ ...f, city: search || undefined }))
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Search header bar ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="flex-1 flex items-center">
              <CityAutocomplete
                value={search}
                onChange={setSearch}
                cities={cities}
                placeholder="Buscar por cidade..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-transparent transition-all"
                icon={<Search size={16} className="text-gray-400 flex-shrink-0" />}
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
              {Object.values(filters).some(Boolean) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-500" />
              )}
            </button>
            {/* Match CTA */}
            <button
              type="button"
              onClick={() => navigate('/match')}
              className="hidden sm:flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
            >
              ✨ Match ideal
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* ── Sidebar filters — desktop ── */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-36">
              <PetsitterFilters
                filters={filters}
                onChange={setFilters}
                onReset={handleReset}
                resultCount={petsitters.length}
              />
            </div>
          </div>

          {/* ── Mobile filters drawer ── */}
          {mobileFilters.isOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={mobileFilters.close} />
              <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 text-lg">Filtros</h3>
                  <button onClick={mobileFilters.close} className="p-2 rounded-xl hover:bg-gray-100">
                    <X size={20} />
                  </button>
                </div>
                <PetsitterFilters
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleReset}
                  resultCount={petsitters.length}
                />
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button onClick={mobileFilters.close} className="btn-primary w-full py-3">
                    Ver {petsitters.length} resultado{petsitters.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Sort + count */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <p className="text-gray-600 text-sm">
                {isLoading ? 'Buscando...' : (
                  <><span className="font-semibold text-gray-900">{petsitters.length}</span> petsitter{petsitters.length !== 1 ? 's' : ''} encontrado{petsitters.length !== 1 ? 's' : ''}</>
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
            {Object.entries(filters).some(([, v]) => v !== undefined) && (
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
            )}

            {/* Loading */}
            {isLoading && (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => <SkeletonPetsitterCard key={i} />)}
              </div>
            )}

            {/* Error */}
            {isError && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle size={40} className="text-gray-300 mb-4" />
                <h3 className="font-semibold text-gray-700 mb-1">Erro ao carregar petsitters</h3>
                <p className="text-sm text-gray-400">Verifique se a API está rodando em localhost:3000</p>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && petsitters.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">🐾</div>
                <h3 className="font-semibold text-gray-700 mb-1">Nenhum petsitter encontrado</h3>
                <p className="text-sm text-gray-400 mb-6">Tente ajustar os filtros ou buscar em outra cidade</p>
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
          </div>
        </div>
      </div>
    </div>
  )
}
