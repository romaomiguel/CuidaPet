import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { petService }    from '@/services/pet.service'
import { SkeletonList }  from '@/components/ui/Skeleton'
import { speciesLabels } from '@/utils'
import { PawPrint, Pencil, Trash2, AlertCircle, Camera, HeartHandshake } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import type { PetPayload, PetSpecies } from '@/types'

const schema = z.object({
  name:    z.string().min(1, 'Nome obrigatório'),
  species: z.string().min(1, 'Espécie obrigatória'),
  breed:   z.string().optional(),
  age:     z.coerce.number().min(0, 'Idade inválida'),
  weight:  z.coerce.number().optional(),
  notes:   z.string().optional(),
})
type FormData = z.infer<typeof schema>

const SPECIES_OPTIONS = Object.entries(speciesLabels) as [PetSpecies, string][]

export function PetsPage() {
  const queryClient = useQueryClient()
  const fileRef     = useRef<HTMLInputElement>(null)
  const formTopRef  = useRef<HTMLDivElement>(null)

  const [editing,      setEditing]      = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSaving,     setIsSaving]     = useState(false)

  const { data: pets = [], isLoading, isError } = useQuery({
    queryKey: ['pets'],
    queryFn:  petService.list,
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const species = watch('species')

  const resetForm = () => {
    reset({})
    setEditing(null)
    setPhotoPreview(null)
  }

  const createMutation = useMutation({
    mutationFn: (d: PetPayload) => petService.create(d),
    onMutate:  () => setIsSaving(true),
    onSettled: () => setIsSaving(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      resetForm()
      toast.success('Pet adicionado com sucesso!')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PetPayload> }) =>
      petService.update(id, data),
    onMutate:  () => setIsSaving(true),
    onSettled: () => setIsSaving(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      resetForm()
      toast.success('Pet atualizado!')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: petService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      toast.success('Pet removido')
    },
  })

  const openEdit = (pet: typeof pets[0]) => {
    setEditing(pet.id)
    reset({
      name:    pet.name,
      species: pet.species,
      breed:   pet.breed,
      age:     pet.age,
      weight:  pet.weight,
      notes:   pet.notes,
    })
    setPhotoPreview(pet.photo ?? null)
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande. Máx 5MB.'); return }
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onSubmit = (data: FormData) => {
    const payload: PetPayload = {
      ...data,
      species: data.species as PetSpecies,
      photo:   photoPreview ?? undefined,
    }
    editing
      ? updateMutation.mutate({ id: editing, data: payload })
      : createMutation.mutate(payload)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Coluna esquerda: formulário ── */}
        <div className="flex-1 flex flex-col gap-4" ref={formTopRef}>
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-3xl font-bold text-primary-700">
              {editing ? 'Editar Pet' : 'Adicionar Novo Pet'}
            </h1>
            <PawPrint size={32} className="text-secondary-500" />
          </div>
          <p className="text-muted -mt-2">
            Preencha os dados do seu novo amigo para que nossos cuidadores possam oferecer o melhor atendimento possível.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white rounded-[2rem] shadow-card p-6 lg:p-8 flex flex-col gap-5">

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-stroke rounded-2xl bg-background hover:bg-primary-50 transition-colors group"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={28} className="text-primary-700" />
                </div>
              )}
              <span className="text-sm font-semibold text-muted">
                {photoPreview ? 'Trocar foto' : 'Adicionar foto do pet'}
              </span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="pet-name">Nome do Pet</label>
                <input id="pet-name" {...register('name')} className={`input-flat ${errors.name ? 'ring-2 ring-error-100 !border-error-500' : ''}`} placeholder="Ex: Rex, Luna..." />
                {errors.name && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.name.message}</p>}
              </div>

              <div>
                <label className="label">Tipo de Animal</label>
                <div className="flex gap-2 flex-wrap pt-1">
                  {SPECIES_OPTIONS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('species', value, { shouldValidate: true })}
                      className={clsx(
                        'px-4 py-2 rounded-pill text-sm font-semibold transition-colors',
                        species === value ? 'bg-secondary-500 text-primary-800' : 'bg-background text-muted hover:bg-stroke',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.species && <p className="text-xs text-error-500 mt-1 ml-1">⚠ {errors.species.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="pet-breed">Raça</label>
                <input id="pet-breed" {...register('breed')} className="input-flat" placeholder="Ex: Golden Retriever" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="pet-age">Idade (anos)</label>
                  <input id="pet-age" type="number" min={0} {...register('age')} className={`input-flat ${errors.age ? 'ring-2 ring-error-100 !border-error-500' : ''}`} placeholder="Ex: 3" />
                  {errors.age && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.age.message}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="pet-weight">Peso (kg)</label>
                  <input id="pet-weight" type="number" step="0.1" min={0} {...register('weight')} className="input-flat" placeholder="Ex: 15.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="pet-notes">Informações Adicionais</label>
              <textarea id="pet-notes" {...register('notes')} rows={4} className="w-full p-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary-400 focus:bg-white outline-none text-sm text-ink resize-none transition-all" placeholder="Alergias, temperamento, medicamentos, necessidades especiais..." />
            </div>

            <div className="flex gap-3 self-end">
              {editing && (
                <button type="button" onClick={resetForm} className="btn-ghost">
                  Cancelar edição
                </button>
              )}
              <button type="submit" disabled={isSaving} className="btn-secondary">
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-800/30 border-t-primary-800 rounded-full animate-spin" />
                    Salvando…
                  </span>
                ) : editing ? 'Salvar alterações' : 'Cadastrar Pet'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Coluna direita: Meus Pets ── */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-bold text-ink">Meus Pets</h2>

          {isLoading && <SkeletonList count={3} component="pet" />}

          {isError && !isLoading && (
            <div className="card flex flex-col items-center py-10 text-center">
              <AlertCircle size={32} className="text-muted mb-2" />
              <p className="text-ink font-medium text-sm">Erro ao carregar pets</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {pets.map(pet => (
              <div key={pet.id} className="bg-white rounded-[1.5rem] p-3 shadow-card hover:shadow-card-hover transition-all flex items-center gap-3">
                {pet.photo ? (
                  <img src={pet.photo} alt={pet.name} className="avatar-framed w-14 h-14 flex-shrink-0" />
                ) : (
                  <div className="avatar-framed w-14 h-14 flex-shrink-0 bg-primary-50 flex items-center justify-center text-2xl">
                    {pet.species === 'cachorro' ? '🐶' : pet.species === 'gato' ? '🐱' : '🐾'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink truncate">{pet.name}</p>
                  <p className="text-xs text-muted truncate">
                    {speciesLabels[pet.species]}{pet.breed ? ` • ${pet.breed}` : ''} • {pet.age} {pet.age === 1 ? 'ano' : 'anos'}
                  </p>
                </div>
                <button onClick={() => openEdit(pet)} className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-primary-600 flex-shrink-0" aria-label="Editar">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (confirm(`Remover ${pet.name}?`)) deleteMutation.mutate(pet.id) }}
                  className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-muted hover:text-error-500 flex-shrink-0"
                  aria-label="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {!isLoading && !isError && pets.length === 0 && (
              <div className="p-6 rounded-[1.5rem] bg-primary-50 border-2 border-dashed border-primary-200 flex flex-col items-center text-center gap-1.5">
                <HeartHandshake size={28} className="text-primary-500 opacity-70" />
                <span className="text-sm font-semibold text-primary-700">Seus pets aparecem aqui</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
