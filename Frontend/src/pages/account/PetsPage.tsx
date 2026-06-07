import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { petService }    from '@/services/pet.service'
import { Modal }         from '@/components/ui/Modal'
import { SkeletonList }  from '@/components/ui/Skeleton'
import { useDisclosure } from '@/hooks/useDisclosure'
import { speciesLabels } from '@/utils'
import { PawPrint, Plus, Pencil, Trash2, AlertCircle, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
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

const FORM_ID = 'pet-form'

export function PetsPage() {
  const queryClient = useQueryClient()
  const modal       = useDisclosure()
  const fileRef     = useRef<HTMLInputElement>(null)

  const [editing,      setEditing]      = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSaving,     setIsSaving]     = useState(false)

  const { data: pets = [], isLoading, isError } = useQuery({
    queryKey: ['pets'],
    queryFn:  petService.list,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const closeModal = () => {
    modal.close()
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
      closeModal()
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
      closeModal()
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

  const openCreate = () => {
    reset({})
    setEditing(null)
    setPhotoPreview(null)
    modal.open()
  }

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
    modal.open()
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

  // ── Footer do Modal (fixo, fora do scroll) ──────────────────────────────────
  const modalFooter = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={closeModal}
        className="btn-ghost"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form={FORM_ID}
        disabled={isSaving}
        className="btn-primary"
      >
        {isSaving ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Salvando…
          </span>
        ) : editing ? 'Salvar alterações' : 'Adicionar pet'}
      </button>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PawPrint size={24} className="text-primary-500" /> Meus pets
          </h1>
          <p className="text-gray-500 mt-1">Gerencie os perfis dos seus animais</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Adicionar pet
        </button>
      </div>

      {/* States */}
      {isLoading && <SkeletonList count={3} component="pet" />}

      {isError && !isLoading && (
        <div className="card flex flex-col items-center py-12 text-center">
          <AlertCircle size={36} className="text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Erro ao carregar pets</p>
          <p className="text-sm text-gray-400 mt-1">Verifique se a API está rodando</p>
        </div>
      )}

      {!isLoading && !isError && pets.length === 0 && (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="text-5xl mb-4">🐾</div>
          <h3 className="font-semibold text-gray-700 mb-1">Nenhum pet cadastrado</h3>
          <p className="text-sm text-gray-400 mb-5">
            Adicione o perfil do seu pet para começar a agendar serviços!
          </p>
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Adicionar pet
          </button>
        </div>
      )}

      {/* Pet list */}
      <div className="space-y-3">
        {pets.map(pet => (
          <div
            key={pet.id}
            className="card flex items-center gap-4 hover:shadow-card-hover transition-all"
          >
            {/* Photo or emoji */}
            {pet.photo ? (
              <img
                src={pet.photo}
                alt={pet.name}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-3xl flex-shrink-0">
                {pet.species === 'cachorro' ? '🐶' : pet.species === 'gato' ? '🐱' : '🐾'}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{pet.name}</p>
              <p className="text-sm text-gray-500">
                {speciesLabels[pet.species]}
                {' • '}{pet.age} {pet.age === 1 ? 'ano' : 'anos'}
                {pet.breed  ? ` • ${pet.breed}`  : ''}
                {pet.weight ? ` • ${pet.weight}kg` : ''}
              </p>
              {pet.notes && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{pet.notes}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => openEdit(pet)}
                className="btn-ghost p-2 text-gray-400 hover:text-primary-600"
                aria-label="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remover ${pet.name}?`)) deleteMutation.mutate(pet.id)
                }}
                className="btn-ghost p-2 text-gray-400 hover:text-red-500"
                aria-label="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal ── */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={editing ? 'Editar pet' : 'Adicionar pet'}
        description="Preencha as informações do seu pet"
        size="md"
        footer={modalFooter}
      >
        {/*
         * O <form> tem id={FORM_ID} para o botão de submit no footer
         * (type="submit" form={FORM_ID}) funcionar mesmo estando fora do form.
         * O body do Modal já tem overflow-y-auto, então basta não restringir a altura aqui.
         */}
        <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5">

            {/* Foto do pet */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-24 rounded-2xl overflow-hidden group bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors"
                aria-label="Adicionar foto do pet"
              >
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <Camera size={24} />
                    <span className="text-xs font-medium">Foto</span>
                  </div>
                )}
              </button>
              <p className="text-xs text-gray-400">
                {photoPreview ? 'Clique para trocar a foto' : 'Opcional — clique para adicionar'}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Nome */}
            <div>
              <label className="label" htmlFor={`${FORM_ID}-name`}>Nome do pet *</label>
              <input
                id={`${FORM_ID}-name`}
                {...register('name')}
                className={`input-field ${errors.name ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                placeholder="Ex: Rex, Luna, Bolinha…"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">⚠ {errors.name.message}</p>
              )}
            </div>

            {/* Espécie + Raça */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor={`${FORM_ID}-species`}>Espécie *</label>
                <select
                  id={`${FORM_ID}-species`}
                  {...register('species')}
                  className={`select-field ${errors.species ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                >
                  <option value="">Selecione</option>
                  {Object.entries(speciesLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {errors.species && (
                  <p className="text-xs text-red-500 mt-1">⚠ {errors.species.message}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor={`${FORM_ID}-breed`}>Raça</label>
                <input
                  id={`${FORM_ID}-breed`}
                  {...register('breed')}
                  className="input-field"
                  placeholder="Ex: Labrador"
                />
              </div>
            </div>

            {/* Idade + Peso */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor={`${FORM_ID}-age`}>Idade (anos) *</label>
                <input
                  id={`${FORM_ID}-age`}
                  {...register('age')}
                  type="number"
                  min={0}
                  className={`input-field ${errors.age ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                  placeholder="Ex: 3"
                />
                {errors.age && (
                  <p className="text-xs text-red-500 mt-1">⚠ {errors.age.message}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor={`${FORM_ID}-weight`}>Peso (kg)</label>
                <input
                  id={`${FORM_ID}-weight`}
                  {...register('weight')}
                  type="number"
                  step="0.1"
                  min={0}
                  className="input-field"
                  placeholder="Ex: 12.5"
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="label" htmlFor={`${FORM_ID}-notes`}>Observações</label>
              <textarea
                id={`${FORM_ID}-notes`}
                {...register('notes')}
                rows={3}
                className="input-field resize-none"
                placeholder="Alergias, medicamentos, comportamento especial…"
              />
            </div>

          </div>
        </form>
      </Modal>
    </div>
  )
}
