// Frontend/src/hooks/useServiceCatalog.ts
import { useQuery } from '@tanstack/react-query'
import { serviceCatalogService } from '@/services/serviceCatalog.service'

/**
 * Busca o catálogo INTEIRO (ativos e inativos) uma vez, com cache — assim `label()`/`emoji()`
 * continuam resolvendo corretamente pra um serviço já "aposentado" que ainda aparece em uma
 * Booking/perfil antigo. Pickers (filtros, checklists) devem usar `byAudience()`, que só
 * devolve os ativos por padrão.
 */
export function useServiceCatalog() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['service-catalog'],
    queryFn: () => serviceCatalogService.list(),
    staleTime: 5 * 60 * 1000,
  })

  const activeServices = services.filter((s) => s.isActive)

  const label = (slug: string) => services.find((s) => s.slug === slug)?.name ?? slug
  const emoji = (slug: string) => services.find((s) => s.slug === slug)?.emoji ?? '🐾'

  const byAudience = (audience: 'petsitter' | 'clinica' | 'petshop', includeInactive = false) =>
    (includeInactive ? services : activeServices).filter((s) => s.audience === audience)

  return { services, activeServices, isLoading, label, emoji, byAudience }
}
