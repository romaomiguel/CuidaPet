import { useState, useEffect } from 'react'
import { Lightbulb, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { serviceSuggestionService } from '@/services/serviceSuggestion.service'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ServiceSuggestion } from '@/types'
import { formatDate } from '@/utils'

export function AdminServiceSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  const fetchSuggestions = async (status: 'pending' | 'all') => {
    try {
      setLoading(true)
      const { data } = await serviceSuggestionService.adminList(status === 'pending' ? { status: 'pending' } : {})
      setSuggestions(data)
    } catch (error) {
      console.error('Erro ao buscar sugestões', error)
      toast.error('Erro ao buscar sugestões')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuggestions(filter)
  }, [filter])

  const handleMarkReviewed = async (id: string) => {
    try {
      await serviceSuggestionService.markReviewed(id)
      toast.success('Marcado como revisado.')
      fetchSuggestions(filter)
    } catch (error) {
      console.error('Erro ao marcar sugestão', error)
      toast.error('Erro ao processar.')
    }
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Sugestões de Serviço</h1>
          <p className="text-muted mt-2">Serviços sugeridos por petsitters e parceiros.</p>
        </div>
        <div className="flex gap-2 bg-background p-1.5 rounded-pill w-fit shadow-sm">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={clsx(
              'px-4 py-2 rounded-pill text-sm font-semibold transition-all',
              filter === 'pending' ? 'bg-white text-primary-700 shadow-sm' : 'text-muted hover:text-primary-600',
            )}
          >
            Pendentes
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={clsx(
              'px-4 py-2 rounded-pill text-sm font-semibold transition-all',
              filter === 'all' ? 'bg-white text-primary-700 shadow-sm' : 'text-muted hover:text-primary-600',
            )}
          >
            Todas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card space-y-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="card text-center py-12">
          <Lightbulb className="mx-auto h-12 w-12 text-muted mb-4" />
          <h3 className="text-lg font-medium text-ink">Nenhuma sugestão {filter === 'pending' ? 'pendente' : 'ainda'}</h3>
          <p className="text-sm text-muted mt-1">
            {filter === 'pending'
              ? 'Você está em dia — não há sugestões aguardando revisão.'
              : 'Sugestões enviadas por petsitters e parceiros vão aparecer aqui.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {suggestions.map((s) => (
            <div key={s.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-ink font-medium">{s.description}</p>
                <p className="text-xs text-muted mt-1">
                  {s.user.name} ({s.user.role}) · {formatDate(s.createdAt)}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-3">
                <span className={s.status === 'pending' ? 'badge-yellow' : 'badge-green'}>
                  {s.status === 'pending' ? 'Pendente' : 'Revisado'}
                </span>
                {s.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleMarkReviewed(s.id)}
                    className="btn-outline text-sm px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Marcar revisado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
