import { X, SlidersHorizontal } from 'lucide-react'
import { serviceLabels, PARTNER_SERVICES_BY_TYPE } from '@/utils'
import type { PartnerType, ServiceType } from '@/types'

interface PartnerFiltersState {
  city?: string
  service?: ServiceType
}

interface PartnerFiltersProps {
  partnerType: 'clinica' | 'petshop'
  filters: PartnerFiltersState
  onChange: (filters: PartnerFiltersState) => void
  onReset: () => void
  resultCount?: number
}

export function PartnerFilters({ partnerType, filters, onChange, onReset, resultCount }: PartnerFiltersProps) {
  const set = (key: keyof PartnerFiltersState, value: unknown) =>
    onChange({ ...filters, [key]: value || undefined })

  const services = PARTNER_SERVICES_BY_TYPE[partnerType]
  const hasActive = !!filters.service || !!filters.city

  return (
    <aside className="w-full space-y-6">
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

      <div>
        <label className="label">Cidade</label>
        <input
          type="text"
          placeholder="Ex: Cuiabá"
          value={filters.city ?? ''}
          onChange={e => set('city', e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="label">Serviço</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="partner-service"
              checked={!filters.service}
              onChange={() => set('service', '')}
              className="accent-primary-500"
            />
            <span className="text-sm text-muted group-hover:text-ink">Todos os serviços</span>
          </label>
          {services.map((s) => (
            <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="partner-service"
                checked={filters.service === s}
                onChange={() => set('service', s)}
                className="accent-primary-500"
              />
              <span className="text-sm text-muted group-hover:text-ink">{serviceLabels[s]}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  )
}
