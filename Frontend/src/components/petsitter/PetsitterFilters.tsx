import { X, SlidersHorizontal } from 'lucide-react'
import type { PetsitterFilters as Filters } from '@/types'
import { useServiceCatalog } from '@/hooks/useServiceCatalog'

interface PetsitterFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  onReset: () => void
  resultCount?: number
}

const RATINGS = [
  { value: '4.5', label: '4.5+ ⭐' },
  { value: '4',   label: '4.0+ ⭐' },
  { value: '3',   label: '3.0+ ⭐' },
]

export function PetsitterFilters({ filters, onChange, onReset, resultCount }: PetsitterFiltersProps) {
  const catalog = useServiceCatalog()
  const services = catalog.byAudience('petsitter')

  const set = (key: keyof Filters, value: unknown) =>
    onChange({ ...filters, [key]: value || undefined })

  const hasActive =
    !!filters.service || !!filters.city || !!filters.minRating ||
    !!filters.maxPrice || !!filters.minPrice

  return (
    <aside className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-primary-500" />
          <h2 className="font-heading font-bold text-ink">Filtros</h2>
          {resultCount !== undefined && (
            <span className="text-xs text-muted">({resultCount} resultados)</span>
          )}
        </div>
        {hasActive && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-error-500 hover:text-error-600 font-medium transition-colors"
          >
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Cidade */}
      <div>
        <label className="label">Cidade</label>
        <input
          type="text"
          placeholder="Ex: São Paulo"
          value={filters.city ?? ''}
          onChange={e => set('city', e.target.value)}
          className="input-field"
        />
      </div>

      {/* Serviço */}
      <div>
        <label className="label">Serviço</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="service"
              checked={!filters.service}
              onChange={() => set('service', '')}
              className="accent-primary-500"
            />
            <span className="text-sm text-muted group-hover:text-ink">Todos os serviços</span>
          </label>
          {services.map((s) => (
            <label key={s.slug} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="service"
                checked={filters.service === s.slug}
                onChange={() => set('service', s.slug)}
                className="accent-primary-500"
              />
              <span className="text-sm text-muted group-hover:text-ink">{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Preço máximo */}
      <div>
        <label className="label flex items-center justify-between">
          <span>Preço máximo / hora</span>
          {filters.maxPrice && (
            <span className="text-primary-600 font-semibold text-sm">
              R$ {filters.maxPrice}
            </span>
          )}
        </label>
        <input
          type="range"
          min={20}
          max={300}
          step={10}
          value={filters.maxPrice ?? 300}
          onChange={e => set('maxPrice', Number(e.target.value) < 300 ? Number(e.target.value) : undefined)}
          className="w-full accent-primary-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>R$ 20</span><span>R$ 300+</span>
        </div>
      </div>

      {/* Avaliação mínima */}
      <div>
        <label className="label">Avaliação mínima</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="rating"
              checked={!filters.minRating}
              onChange={() => set('minRating', undefined)}
              className="accent-primary-500"
            />
            <span className="text-sm text-muted group-hover:text-ink">Qualquer avaliação</span>
          </label>
          {RATINGS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                checked={String(filters.minRating) === value}
                onChange={() => set('minRating', Number(value))}
                className="accent-primary-500"
              />
              <span className="text-sm text-muted group-hover:text-ink">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  )
}
