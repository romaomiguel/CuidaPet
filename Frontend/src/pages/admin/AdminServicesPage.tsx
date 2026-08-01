import { useState, useEffect } from 'react'
import { Wrench, Plus, X, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { serviceCatalogService } from '@/services/serviceCatalog.service'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Service } from '@/types'

const AUDIENCE_LABELS: Record<Service['audience'], string> = {
  petsitter: 'Petsitter',
  clinica: 'Clínica',
  petshop: 'Petshop',
}

const schema = z.object({
  name: z.string().min(1, 'Obrigatório').max(60, 'Máximo 60 caracteres'),
  emoji: z.string().min(1, 'Obrigatório').max(8, 'Máximo 8 caracteres'),
  description: z.string().min(1, 'Obrigatório').max(300, 'Máximo 300 caracteres'),
  audience: z.enum(['petsitter', 'clinica', 'petshop']),
})
type FormData = z.infer<typeof schema>

export function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [audienceFilter, setAudienceFilter] = useState<'all' | Service['audience']>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { audience: 'petsitter' },
  })

  const fetchServices = async () => {
    try {
      setLoading(true)
      const data = await serviceCatalogService.list()
      setServices(data)
    } catch (error) {
      console.error('Erro ao buscar serviços', error)
      toast.error('Erro ao buscar serviços')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const startEdit = (s: Service) => {
    setEditingId(s.id)
    reset({ name: s.name, emoji: s.emoji, description: s.description, audience: s.audience })
    setShowForm(true)
  }

  const startCreate = () => {
    setEditingId(null)
    reset({ name: '', emoji: '', description: '', audience: 'petsitter' })
    setShowForm(true)
  }

  const onSubmit = async (formData: FormData) => {
    try {
      if (editingId) {
        await serviceCatalogService.update(editingId, formData)
        toast.success('Serviço atualizado!')
      } else {
        await serviceCatalogService.create(formData)
        toast.success('Serviço cadastrado!')
      }
      reset()
      setShowForm(false)
      setEditingId(null)
      fetchServices()
    } catch (error) {
      console.error('Erro ao salvar serviço', error)
      toast.error('Erro ao salvar serviço.')
    }
  }

  const toggleActive = async (s: Service) => {
    try {
      await serviceCatalogService.update(s.id, { isActive: !s.isActive })
      toast.success(s.isActive ? 'Serviço aposentado.' : 'Serviço reativado.')
      fetchServices()
    } catch (error) {
      console.error('Erro ao alterar status do serviço', error)
      toast.error('Erro ao alterar status.')
    }
  }

  const filtered = audienceFilter === 'all' ? services : services.filter(s => s.audience === audienceFilter)

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Catálogo de Serviços</h1>
          <p className="text-muted mt-2">Cadastre e gerencie os serviços oferecidos na plataforma.</p>
        </div>
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : startCreate())}
          className={showForm ? 'btn-outline flex-shrink-0' : 'btn-primary flex-shrink-0'}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancelar' : 'Novo serviço'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card mb-8 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label">Nome</label>
              <input {...register('name')} className="input-field mt-1.5" placeholder="Ex: Passeio Noturno" />
              {errors.name && <p className="text-xs text-error-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Emoji</label>
              <input {...register('emoji')} className="input-field mt-1.5" placeholder="🌙" />
              {errors.emoji && <p className="text-xs text-error-600 mt-1">{errors.emoji.message}</p>}
            </div>
            <div>
              <label className="label">Quem presta</label>
              <select {...register('audience')} className="select-field mt-1.5">
                <option value="petsitter">Petsitter</option>
                <option value="clinica">Clínica</option>
                <option value="petshop">Petshop</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Descrição básica</label>
              <textarea {...register('description')} rows={2} className="input-field mt-1.5 resize-none" placeholder="Ex: Passeio no período noturno, ideal para dias quentes." />
              {errors.description && <p className="text-xs text-error-600 mt-1">{errors.description.message}</p>}
            </div>
          </div>
          <div className="flex justify-end border-t border-stroke pt-4">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar serviço'}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-6 bg-background p-1.5 rounded-pill w-fit shadow-sm">
        {(['all', 'petsitter', 'clinica', 'petshop'] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAudienceFilter(a)}
            className={clsx(
              'px-4 py-2 rounded-pill text-sm font-semibold transition-all',
              audienceFilter === a ? 'bg-white text-primary-700 shadow-sm' : 'text-muted hover:text-primary-600',
            )}
          >
            {a === 'all' ? 'Todos' : AUDIENCE_LABELS[a]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card space-y-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Wrench className="mx-auto h-12 w-12 text-muted mb-4" />
          <h3 className="text-lg font-medium text-ink">Nenhum serviço cadastrado</h3>
          <p className="text-sm text-muted mt-1">Cadastre o primeiro serviço para começar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => (
            <div key={s.id} className={clsx('card flex items-center justify-between gap-4', !s.isActive && 'opacity-60')}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0" aria-hidden="true">{s.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{s.name}</p>
                  <p className="text-xs text-muted truncate">{s.description}</p>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-3">
                <span className="badge-blue">{AUDIENCE_LABELS[s.audience]}</span>
                <span className={s.isActive ? 'badge-green' : 'badge-gray'}>
                  {s.isActive ? 'Ativo' : 'Aposentado'}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(s)}
                  className="btn-outline text-sm px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Pencil size={14} /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(s)}
                  className="btn-outline text-sm px-3 py-1.5"
                >
                  {s.isActive ? 'Aposentar' : 'Reativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
