import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Building2, MapPin, Save, Camera } from 'lucide-react'
import { partnerService } from '@/services/partner.service'
import { userService } from '@/services/user.service'
import { serviceSuggestionService } from '@/services/serviceSuggestion.service'
import { useAuthStore } from '@/store/auth.store'
import { Skeleton } from '@/components/ui/Skeleton'
import { GalleryManager } from '@/components/GalleryManager'
import { avatarUrl } from '@/utils'
import { useServiceCatalog } from '@/hooks/useServiceCatalog'
import type { PartnerProfile, ServiceType } from '@/types'
import clsx from 'clsx'

const schema = z.object({
  businessName: z.string().min(1, 'Obrigatório'),
  address: z.string().min(1, 'Obrigatório'),
  city: z.string().min(1, 'Obrigatório'),
  state: z.string().min(1, 'Obrigatório'),
  servicesOffered: z.array(z.string()),
})
type FormData = z.infer<typeof schema>

export function PartnerAccountPage() {
  const { user, setUser } = useAuthStore()
  const catalog = useServiceCatalog()
  const [profile, setProfile] = useState<PartnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [suggestion, setSuggestion] = useState('')
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    partnerService.findMe()
      .then((data) => {
        setProfile(data)
        reset({
          businessName: data.businessName,
          address: data.address,
          city: data.city,
          state: data.state,
          servicesOffered: data.servicesOffered,
        })
      })
      .catch((error) => {
        console.error('Erro ao buscar perfil do parceiro', error)
        toast.error('Erro ao carregar seu perfil')
      })
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (formData: FormData) => {
    try {
      const updated = await partnerService.updateMe({
        ...formData,
        servicesOffered: formData.servicesOffered as ServiceType[],
      })
      setProfile(updated)
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar perfil', error)
      toast.error('Erro ao atualizar perfil.')
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return }

    try {
      setIsUploadingAvatar(true)
      const { avatarUrl: newAvatarUrl } = await userService.uploadAvatar(file)
      setUser({ ...user!, avatarUrl: newAvatarUrl })
      toast.success('Foto atualizada!')
    } catch {
      // Erro real já vira toast pelo interceptor de resposta do axios.
    } finally {
      setIsUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handlePhotoUpload = async (file: File) => (await partnerService.addPhoto(file)).photos
  const handlePhotoRemove = async (index: number) => (await partnerService.removePhoto(index)).photos

  const handleSuggestSubmit = async () => {
    if (!suggestion.trim()) { toast.error('Descreva o serviço que você gostaria de oferecer.'); return }
    try {
      setIsSubmittingSuggestion(true)
      await serviceSuggestionService.create(suggestion.trim())
      setSuggestion('')
      toast.success('Sugestão enviada! Nossa equipe vai avaliar.')
    } catch {
      // Erro real já vira toast pelo interceptor de resposta do axios.
    } finally {
      setIsSubmittingSuggestion(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-6 w-40" />
        </div>

        <div className="card flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>

        <div className="card space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="card space-y-5">
          <Skeleton className="h-6 w-56" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full rounded-pill" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full rounded-pill" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-12 w-full rounded-pill" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full rounded-pill" />
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-2xl" />
            ))}
          </div>
        </div>

        <Skeleton className="h-12 w-full rounded-pill" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted mb-4" />
          <h3 className="font-heading text-lg font-bold text-ink">Perfil não encontrado</h3>
          <p className="text-sm text-muted mt-1">Não foi possível carregar os dados do seu estabelecimento.</p>
        </div>
      </div>
    )
  }

  const displayAvatar = avatarUrl(profile.businessName, user.avatarUrl ?? undefined)
  const availableServices = catalog.byAudience(profile.type)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-800">Meu Perfil</h1>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className={profile.type === 'clinica' ? 'badge-brand' : 'badge-blue'}>
            {profile.type === 'clinica' ? 'Clínica' : 'Petshop'}
          </span>
          <span>{profile.user.email}</span>
        </div>
      </div>

      <div className="card flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <img src={displayAvatar} alt={profile.businessName} className="avatar-framed w-20 h-20" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors disabled:opacity-60"
            title="Alterar foto"
          >
            {isUploadingAvatar
              ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Camera size={13} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" disabled={isUploadingAvatar} onChange={handleAvatarChange} />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-ink">Foto de perfil</h2>
          <p className="text-sm text-muted">Aparece no seu painel e na página pública do seu estabelecimento.</p>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-heading text-xl font-bold text-primary-700">Galeria</h2>
        <GalleryManager
          photos={profile.photos}
          onUpload={handlePhotoUpload}
          onRemove={handlePhotoRemove}
        />
      </div>

      <div className="card space-y-3">
        <h2 className="font-heading text-xl font-bold text-primary-700">Não encontrou seu serviço?</h2>
        <p className="text-sm text-muted -mt-1">Sugira um novo serviço — nossa equipe avalia e pode incluí-lo na plataforma.</p>
        <textarea
          value={suggestion}
          onChange={e => setSuggestion(e.target.value)}
          rows={2}
          placeholder="Ex: Delivery de ração, banho a domicílio..."
          className="w-full p-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary-400 outline-none text-sm text-ink resize-none transition-all"
        />
        <button
          type="button"
          onClick={handleSuggestSubmit}
          disabled={isSubmittingSuggestion}
          className="btn-outline text-sm px-4 py-2 disabled:opacity-50"
        >
          {isSubmittingSuggestion ? 'Enviando...' : 'Enviar sugestão'}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card space-y-5">
          <h2 className="font-heading text-xl font-bold text-primary-700 flex items-center gap-2">
            <Building2 size={18} /> Dados do estabelecimento
          </h2>

          <div>
            <label className="label" htmlFor="businessName">Nome fantasia</label>
            <input
              id="businessName"
              {...register('businessName')}
              className={`input-field ${errors.businessName ? 'ring-2 ring-error-100 border-error-500' : ''}`}
            />
            {errors.businessName && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.businessName.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="address">Endereço</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                id="address"
                {...register('address')}
                className={`input-field pl-10 ${errors.address ? 'ring-2 ring-error-100 border-error-500' : ''}`}
              />
            </div>
            {errors.address && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="city">Cidade</label>
              <input
                id="city"
                {...register('city')}
                className={`input-field ${errors.city ? 'ring-2 ring-error-100 border-error-500' : ''}`}
              />
              {errors.city && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.city.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="state">Estado (UF)</label>
              <input
                id="state"
                maxLength={2}
                {...register('state')}
                className={`input-field ${errors.state ? 'ring-2 ring-error-100 border-error-500' : ''}`}
              />
              {errors.state && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.state.message}</p>}
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-heading text-xl font-bold text-primary-700">Serviços prestados</h2>
          <p className="text-sm text-muted -mt-1">Escolha os serviços que você presta no seu estabelecimento.</p>
          <Controller control={control} name="servicesOffered" render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableServices.map((s) => {
                const checked = field.value.includes(s.slug)
                return (
                  <button key={s.slug} type="button"
                    onClick={() => field.onChange(checked ? field.value.filter((v) => v !== s.slug) : [...field.value, s.slug])}
                    className={clsx(
                      'p-3 rounded-2xl text-left text-sm font-semibold transition-all border-2',
                      checked ? 'bg-primary-50 border-primary-400 text-primary-700' : 'bg-background border-transparent text-ink hover:border-stroke',
                    )}>
                    {s.emoji} {s.name}
                  </button>
                )
              })}
            </div>
          )} />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-secondary w-full justify-center py-3.5 text-base">
          {isSubmitting
            ? <><span className="w-5 h-5 border-2 border-primary-800/30 border-t-primary-800 rounded-full animate-spin" /> Salvando…</>
            : <><Save size={18} /> Salvar alterações</>}
        </button>
      </form>
    </div>
  )
}
