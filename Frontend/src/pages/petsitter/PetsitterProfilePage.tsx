import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { petsitterService } from '@/services/petsitter.service'
import { authService }      from '@/services/auth.service'
import { userService }      from '@/services/user.service'
import { useAuthStore }     from '@/store/auth.store'
import { serviceLabels, avatarUrl, PETSITTER_SERVICES } from '@/utils'
import { GalleryManager } from '@/components/GalleryManager'
import { IS_MOCK_MODE }     from '@/lib/mock'
import {
  Camera, Save, MapPin, Phone, DollarSign, AlertTriangle, User, Clock, FileText,
  BadgeCheck, Home, ToggleLeft, ToggleRight, Users,
} from 'lucide-react'
import type { ServiceType } from '@/types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const SERVICES = PETSITTER_SERVICES
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const WEEKEND_DAYS = ['Sábado', 'Domingo']

// Serviços que são cobrados por DIA INTEIRO (fixo), não por hora
const FULL_DAY_SERVICES: ServiceType[] = ['hospedagem', 'creche']

const SPECIES_OPTIONS = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ave', label: 'Ave' },
  { value: 'roedor', label: 'Roedor' },
  { value: 'reptil', label: 'Réptil' },
  { value: 'outro', label: 'Outro' },
]

const schema = z.object({
  // Dados pessoais
  name:         z.string().min(2, 'Nome muito curto'),
  email:        z.string().email('E-mail inválido'),
  phone:        z.string().optional(),
  // Dados do perfil de petsitter
  bio:          z.string().optional(),
  location:     z.string().optional(),
  city:         z.string().optional(),
  state:        z.string().max(2).optional(),
  pricePerHour: z.coerce.number().optional(),
  services:     z.array(z.string()).min(1, 'Selecione ao menos 1 serviço'),
  acceptedSpecies: z.array(z.string()).min(1, 'Selecione ao menos 1 espécie'),
  isAvailable:  z.boolean(),
  offersLocationSharing: z.boolean(),
  hasAirConditioning: z.boolean(),
  homeType: z.enum(['casa', 'apartamento']).optional(),
  hasBackyard: z.boolean(),
  walkSchedule: z.enum(['manha', 'noite']).optional(),
  pricingConfig: z.record(z.object({
    type: z.enum(['fixed', 'per_hour']),
    price: z.coerce.number().min(1, 'Valor inválido')
  })).optional(),
  capacityPerDay: z.coerce.number().min(1, 'A capacidade deve ser no mínimo 1'),
})
type FormData = z.infer<typeof schema>

type DaySchedule = { enabled: boolean; start: string; end: string }
type ScheduleConfig = Record<string, DaySchedule>

const DEFAULT_DAY: DaySchedule = { enabled: false, start: '08:00', end: '17:00' }

type Tab = 'pessoal' | 'preferencias' | 'valores'
const TABS: { key: Tab; label: string }[] = [
  { key: 'pessoal',      label: 'Informações Pessoais' },
  { key: 'preferencias', label: 'Preferências de Cuidado' },
  { key: 'valores',      label: 'Valores & Disponibilidade' },
]

export function PetsitterProfilePage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('pessoal')
  const [isUploading, setIsUploading] = useState(false)
  const [schedule, setSchedule] = useState<ScheduleConfig>(() =>
    DAYS.reduce((acc, d) => ({ ...acc, [d]: { ...DEFAULT_DAY } }), {} as ScheduleConfig)
  )

  const { data: ps, isLoading } = useQuery({
    queryKey: ['petsitter', 'me'],
    queryFn:  petsitterService.getMyProfile,
  })

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', phone: '',
      bio: '', location: '', city: '', state: '',
      pricePerHour: 50,
      services: [] as string[],
      acceptedSpecies: [] as string[],
      isAvailable: true,
      offersLocationSharing: false,
      hasAirConditioning: false,
      homeType: undefined,
      hasBackyard: false,
      walkSchedule: undefined,
      pricingConfig: {},
      capacityPerDay: 1,
    },
  })

  useEffect(() => {
    if (ps && user) {
      reset({
        name:         user.name      ?? '',
        email:        user.email     ?? '',
        phone:        user.phone     ?? '',
        bio:          ps.bio         ?? '',
        location:     ps.location    ?? '',
        city:         ps.city        ?? '',
        state:        ps.state       ?? '',
        pricePerHour: ps.pricePerHour,
        services:     ps.services    ?? [],
        acceptedSpecies: (ps as any).acceptedSpecies ?? [],
        isAvailable:  ps.isAvailable,
        offersLocationSharing: ps.offersLocationSharing ?? false,
        hasAirConditioning: ps.hasAirConditioning ?? false,
        homeType: ps.homeType ?? undefined,
        hasBackyard: ps.hasBackyard ?? false,
        walkSchedule: ps.walkSchedule ?? undefined,
        capacityPerDay: ps.capacityPerDay ?? 1,
      })
      if (ps.scheduleConfig) {
        setSchedule(prev => {
          const merged = { ...prev }
          DAYS.forEach(d => {
            const saved = (ps.scheduleConfig as any)?.[d]
            if (saved) merged[d] = { ...DEFAULT_DAY, ...saved }
          })
          return merged
        })
      }
    }
  }, [ps, user, reset])

  const profileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { name, email, phone, ...petsitterData } = data

      return await Promise.all([
        authService.updateProfile({ name, email, phone }),
        petsitterService.updateProfile({
          ...petsitterData,
          services: petsitterData.services as ServiceType[],
          acceptedSpecies: petsitterData.acceptedSpecies as any[],
          scheduleConfig: schedule,
          capacityPerDay: petsitterData.capacityPerDay,
        }),
      ])
    },
    onSuccess: ([updatedUser]) => {
      setUser(updatedUser)
      queryClient.invalidateQueries({ queryKey: ['petsitter', 'me'] })
      toast.success('Perfil atualizado com sucesso! 🐾')
    },
    onError: () => toast.error('Erro ao salvar. Tente novamente.'),
  })

  const onFormError = (formErrors: any) => {
    if (formErrors.name || formErrors.email || formErrors.phone || formErrors.bio || formErrors.location || formErrors.city || formErrors.state)
      setActiveTab('pessoal')
    else if (formErrors.services || formErrors.acceptedSpecies)
      setActiveTab('preferencias')
    else if (formErrors.capacityPerDay || formErrors.pricingConfig)
      setActiveTab('valores')

    toast.error('Preencha os campos obrigatórios corretamente.')
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

  const toggleDay = (day: string) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }))
  }

  const updateDayTime = (day: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  const uploadDocument = async (field: 'identity-proof' | 'address-proof', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande (máx 5MB)'); return }

    try {
      setIsUploading(true)
      await petsitterService.uploadDocument(field, file)
      queryClient.invalidateQueries({ queryKey: ['petsitter', 'me'] })
      toast.success('Documento enviado com sucesso!')
    } catch {
      // Erro real (tipo/tamanho inválido etc.) já vira toast pelo interceptor de
      // resposta do axios (lib/axios.ts) — evita duplicar a mensagem aqui.
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const viewDocument = async (field: 'identity-proof' | 'address-proof') => {
    try {
      const { url } = await petsitterService.getMyDocumentUrl(field)
      window.open(url, '_blank', 'noreferrer')
    } catch {
      toast.error('Não foi possível abrir o documento.')
    }
  }

  const selectedServices = watch('services') as ServiceType[]
  const pricingConfig = watch('pricingConfig') as Record<string, any>

  if (isLoading || !user) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  const displayAvatar = avatarUrl(user.name, user.avatarUrl ?? undefined)

  return (
    <div className="max-w-4xl mx-auto">

      {IS_MOCK_MODE && (
        <div className="mb-6 flex items-center gap-3 bg-secondary-50 border border-secondary-200 text-secondary-700 rounded-2xl px-4 py-3 text-sm">
          <AlertTriangle size={18} className="flex-shrink-0 text-secondary-500" />
          <strong>Modo de demonstração</strong> — Backend offline.
        </div>
      )}

      {ps?.status === 'pending' && (
        <div className="mb-6 flex items-start gap-3 bg-secondary-50 border border-secondary-200 text-primary-800 rounded-2xl px-5 py-4 shadow-sm">
          <AlertTriangle size={24} className="flex-shrink-0 text-secondary-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold">Sua conta está pendente de aprovação!</h3>
            <p className="mt-1 text-sm opacity-90">
              Você ainda não aparece nas buscas. Preencha todos os seus dados e envie seus comprovantes na aba <strong>"Informações Pessoais"</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-800">Meu Perfil Sitter</h1>
        <p className="text-muted text-lg">Personalize como os tutores veem você e gerencie suas credenciais.</p>
      </div>

      {/* ── Abas (segmented control) ── */}
      <div className="bg-background p-1.5 rounded-pill inline-flex w-full sm:w-fit overflow-x-auto mb-8 shadow-inner">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={clsx(
              'px-5 sm:px-6 py-2.5 rounded-pill text-sm font-semibold whitespace-nowrap transition-all',
              activeTab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-muted hover:text-primary-600',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(d => profileMutation.mutate(d), onFormError)} className="flex flex-col gap-6">

        {/* ═══ Aba 1 — Informações Pessoais ═══ */}
        {activeTab === 'pessoal' && (
          <div className="flex flex-col gap-6">

            <div className="card flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-2 flex-shrink-0 mx-auto md:mx-0">
                <div className="relative">
                  <img src={displayAvatar} alt={user.name} className="avatar-framed w-24 h-24" />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={isUploadingAvatar} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors disabled:opacity-60" title="Alterar foto">
                    {isUploadingAvatar
                      ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <Camera size={14} />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" disabled={isUploadingAvatar} onChange={handleAvatarChange} />
                </div>
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Alterar Foto</span>
              </div>

              <div className="flex-1 flex flex-col gap-4 w-full">
                <h2 className="font-heading text-xl font-bold text-primary-700">Dados Básicos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="name">Nome completo</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input id="name" {...register('name')} className={`input-field pl-10 ${errors.name ? 'ring-2 ring-error-100 border-error-500' : ''}`} />
                    </div>
                    {errors.name && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="label" htmlFor="phone">Telefone (WhatsApp)</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input id="phone" {...register('phone')} className="input-field pl-10" placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="email">E-mail</label>
                    <input id="email" type="email" {...register('email')} className={`input-field ${errors.email ? 'ring-2 ring-error-100 border-error-500' : ''}`} />
                    {errors.email && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.email.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="card space-y-4">
              <h2 className="font-heading text-xl font-bold text-primary-700 flex items-center gap-2"><MapPin size={18} /> Localização</h2>
              <div>
                <label className="label">Endereço / Bairro</label>
                <input {...register('location')} className="input-field" placeholder="Ex: Av. Paulista, 1000 - Bela Vista" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cidade</label>
                  <input {...register('city')} className="input-field" placeholder="São Paulo" />
                </div>
                <div>
                  <label className="label">Estado (UF)</label>
                  <input {...register('state')} maxLength={2} className="input-field" placeholder="SP" />
                </div>
              </div>
            </div>

            <div className="card space-y-3">
              <h2 className="font-heading text-xl font-bold text-primary-700">Sobre Mim</h2>
              <div>
                <label className="label">Sua Bio (Resumo)</label>
                <p className="text-sm text-muted mb-2 -mt-1">Um texto curto e chamativo que aparecerá nos resultados de busca.</p>
                <textarea {...register('bio')} rows={4} className="w-full p-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary-400 outline-none text-sm text-ink resize-none transition-all" placeholder="Conte um pouco sobre você e sua experiência com pets..." />
              </div>
            </div>

            <div className="card space-y-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-primary-700">Validação de Identidade</h2>
                <p className="text-sm text-muted mt-1">Para garantir a segurança da comunidade, precisamos validar seus documentos. Eles não são exibidos publicamente.</p>
              </div>

              <div className="bg-background rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                    <BadgeCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-sm">Documento de Identidade (RG/CNH)</h3>
                    {ps?.identityProof
                      ? <button type="button" onClick={() => viewDocument('identity-proof')} className="text-xs text-primary-600 hover:underline">Ver documento enviado</button>
                      : <p className="text-xs text-muted">Nenhum documento enviado ainda</p>}
                  </div>
                </div>
                <label className="btn-outline text-sm px-4 py-2 cursor-pointer">
                  {ps?.identityProof ? 'Reenviar' : 'Enviar'}
                  <input type="file" accept="image/*,.pdf" onChange={e => uploadDocument('identity-proof', e)} disabled={isUploading} className="hidden" />
                </label>
              </div>

              <div className="bg-background rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                    <Home size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink text-sm">Comprovante de Residência</h3>
                    {ps?.addressProof
                      ? <button type="button" onClick={() => viewDocument('address-proof')} className="text-xs text-primary-600 hover:underline">Ver documento enviado</button>
                      : <p className="text-xs text-muted">Nenhum documento enviado ainda</p>}
                  </div>
                </div>
                <label className="btn-outline text-sm px-4 py-2 cursor-pointer">
                  {ps?.addressProof ? 'Reenviar' : 'Enviar'}
                  <input type="file" accept="image/*,.pdf" onChange={e => uploadDocument('address-proof', e)} disabled={isUploading} className="hidden" />
                </label>
              </div>

              {ps?.status === 'rejected' && (
                <div className="flex items-start gap-3 bg-error-50 text-error-600 rounded-xl px-4 py-3 text-sm">
                  <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                  <p>Documentação rejeitada. Envie documentos mais nítidos ou fale com o suporte.</p>
                </div>
              )}
            </div>

            <div className="card space-y-4">
              <h2 className="font-heading text-xl font-bold text-primary-700">Galeria</h2>
              <p className="text-sm text-muted -mt-1">Fotos do seu espaço/trabalho, exibidas no seu perfil público.</p>
              <GalleryManager
                photos={ps?.photos ?? []}
                onUpload={async (file) => (await petsitterService.addPhoto(file)).photos}
                onRemove={async (index) => (await petsitterService.removePhoto(index)).photos}
              />
            </div>
          </div>
        )}

        {/* ═══ Aba 2 — Preferências de Cuidado ═══ */}
        {activeTab === 'preferencias' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">

              <div className="card space-y-3">
                <h2 className="font-heading text-xl font-bold text-primary-700">Animais Aceitos</h2>
                <p className="text-sm text-muted -mt-1">Selecione quais tipos de pets você se sente confortável em cuidar.</p>
                <Controller control={control} name="acceptedSpecies" render={({ field }) => (
                  <div className="flex flex-wrap gap-2.5">
                    {SPECIES_OPTIONS.map(s => {
                      const checked = field.value?.includes(s.value)
                      return (
                        <button key={s.value} type="button"
                          onClick={() => field.onChange(checked ? field.value.filter(v => v !== s.value) : [...(field.value || []), s.value])}
                          className={checked ? 'toggle-chip-active' : 'toggle-chip'}>
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                )} />
                {errors.acceptedSpecies && <p className="text-xs text-error-500">⚠ {errors.acceptedSpecies.message}</p>}
              </div>

              <div className="card space-y-3">
                <h2 className="font-heading text-xl font-bold text-primary-700">Serviços Oferecidos</h2>
                <p className="text-sm text-muted -mt-1">Escolha os serviços que você vai prestar na plataforma.</p>
                <Controller control={control} name="services" render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICES.map(s => {
                      const checked = field.value.includes(s)
                      return (
                        <button key={s} type="button"
                          onClick={() => field.onChange(checked ? field.value.filter(v => v !== s) : [...field.value, s])}
                          className={clsx(
                            'p-4 rounded-2xl text-left transition-all border-2',
                            checked ? 'bg-primary-50 border-primary-400' : 'bg-background border-transparent hover:border-stroke',
                          )}>
                          <span className={clsx('font-heading font-bold', checked ? 'text-primary-700' : 'text-ink')}>{serviceLabels[s]}</span>
                          {FULL_DAY_SERVICES.includes(s) && <span className="block text-xs font-normal text-muted mt-0.5">Dia inteiro</span>}
                        </button>
                      )
                    })}
                  </div>
                )} />
                {errors.services && <p className="text-xs text-error-500">⚠ {errors.services.message}</p>}
              </div>

              <div className="card space-y-4">
                <h2 className="font-heading text-xl font-bold text-primary-700 flex items-center gap-2"><Home size={18} /> Ambiente</h2>
                <p className="text-sm text-muted -mt-1">Essas informações ajudam o Match Inteligente a encontrar tutores compatíveis com o seu ambiente.</p>

                <div>
                  <label className="label mb-2">Tipo de imóvel</label>
                  <Controller control={control} name="homeType" render={({ field }) => (
                    <div className="flex gap-2.5">
                      {[{ value: 'casa', label: 'Casa' }, { value: 'apartamento', label: 'Apartamento' }].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={field.value === opt.value ? 'toggle-chip-active' : 'toggle-chip'}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )} />
                </div>

                <div>
                  <label className="label mb-2">Horário preferido de passeio</label>
                  <Controller control={control} name="walkSchedule" render={({ field }) => (
                    <div className="flex gap-2.5">
                      {[{ value: 'manha', label: 'Manhã' }, { value: 'noite', label: 'Noite' }].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={field.value === opt.value ? 'toggle-chip-active' : 'toggle-chip'}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )} />
                </div>

                <div className="h-px bg-stroke" />

                <Controller control={control} name="hasAirConditioning" render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">Ambiente com ar-condicionado</p>
                      <p className="text-xs text-muted">Importante pro calor de Cuiabá</p>
                    </div>
                    <button type="button" onClick={() => field.onChange(!field.value)} className={clsx('transition-colors flex-shrink-0', field.value ? 'text-primary-500' : 'text-stroke')}>
                      {field.value ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                    </button>
                  </div>
                )} />

                <Controller control={control} name="hasBackyard" render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">Tenho quintal</p>
                      <p className="text-xs text-muted">Espaço extra para os pets se exercitarem</p>
                    </div>
                    <button type="button" onClick={() => field.onChange(!field.value)} className={clsx('transition-colors flex-shrink-0', field.value ? 'text-primary-500' : 'text-stroke')}>
                      {field.value ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                    </button>
                  </div>
                )} />
              </div>
            </div>

            {/* Sidebar sticky — Disponibilidade (substitui o "Seu Ambiente" fictício do mockup) */}
            <div className="lg:col-span-4">
              <div className="card space-y-4 lg:sticky lg:top-24">
                <h2 className="font-heading text-lg font-bold text-primary-700">Disponibilidade</h2>
                <Controller control={control} name="isAvailable" render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">Disponível para novos agendamentos</p>
                      <p className="text-xs text-muted">{field.value ? 'Aparece nas buscas' : 'Oculto nas buscas'}</p>
                    </div>
                    <button type="button" onClick={() => field.onChange(!field.value)} className={clsx('transition-colors flex-shrink-0', field.value ? 'text-primary-500' : 'text-stroke')}>
                      {field.value ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                    </button>
                  </div>
                )} />
                <div className="h-px bg-stroke" />
                <Controller control={control} name="offersLocationSharing" render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">Compartilha localização</p>
                      <p className="text-xs text-muted">Check-ins durante passeios</p>
                    </div>
                    <button type="button" onClick={() => field.onChange(!field.value)} className={clsx('transition-colors flex-shrink-0', field.value ? 'text-primary-500' : 'text-stroke')}>
                      {field.value ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                    </button>
                  </div>
                )} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ Aba 3 — Valores & Disponibilidade ═══ */}
        {activeTab === 'valores' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">

              {selectedServices.length > 0 && (
                <div className="card space-y-4">
                  <h2 className="font-heading text-xl font-bold text-primary-700 flex items-center gap-2"><DollarSign size={18} /> Tabela de Preços</h2>
                  {selectedServices.map(s => {
                    const isFullDay = FULL_DAY_SERVICES.includes(s)
                    const currentType = pricingConfig?.[s]?.type ?? (isFullDay ? 'fixed' : 'per_hour')
                    return (
                      <div key={s} className="bg-background rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ink text-sm">{serviceLabels[s]}</span>
                          {isFullDay
                            ? <span className="badge badge-blue text-xs">Cobrança por dia</span>
                            : (
                              <div className="flex gap-2">
                                {(['per_hour', 'fixed'] as const).map(t => (
                                  <span key={t} className={clsx('px-2.5 py-1 rounded-pill text-xs font-semibold', currentType === t ? 'bg-primary-500 text-white' : 'bg-white text-muted')}>
                                    {t === 'per_hour' ? 'Por hora' : 'Fixo'}
                                  </span>
                                ))}
                              </div>
                            )
                          }
                        </div>
                        <Controller control={control} name={`pricingConfig.${s}` as any}
                          defaultValue={{ type: isFullDay ? 'fixed' : 'per_hour', price: 50 }}
                          render={({ field }) => {
                            const val = (field.value as any) ?? { type: isFullDay ? 'fixed' : 'per_hour', price: 50 }
                            return (
                              <div className="flex flex-col gap-2">
                                {!isFullDay && (
                                  <div className="flex gap-2">
                                    {(['per_hour', 'fixed'] as const).map(t => (
                                      <button key={t} type="button" onClick={() => field.onChange({ ...val, type: t })}
                                        className={clsx('flex-1 py-2 rounded-pill text-xs font-semibold transition-all', val.type === t ? 'bg-primary-500 text-white' : 'bg-white text-muted hover:bg-stroke')}>
                                        {t === 'per_hour' ? 'Por hora' : 'Valor fixo'}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">R$</span>
                                  <input type="number" min={1} step={0.5} value={val.price ?? ''}
                                    onChange={e => field.onChange({ ...val, price: Number(e.target.value) })}
                                    className="input-field pl-10 text-sm bg-white" placeholder={isFullDay ? 'Valor por dia' : val.type === 'per_hour' ? 'Valor por hora' : 'Valor fixo'} />
                                </div>
                              </div>
                            )
                          }} />
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="card space-y-2">
                <h2 className="font-heading text-xl font-bold text-primary-700 flex items-center gap-2"><Users size={18} /> Capacidade Simultânea</h2>
                <p className="text-sm text-muted -mt-1">Quantos pets você consegue atender ou hospedar no mesmo dia/horário?</p>
                <input type="number" min="1" {...register('capacityPerDay')} className={`input-field w-32 ${errors.capacityPerDay ? 'ring-2 ring-error-100 border-error-500' : ''}`} />
                {errors.capacityPerDay && <p className="text-xs text-error-500 mt-1">⚠ {errors.capacityPerDay.message}</p>}
              </div>
            </div>

            {/* Sidebar sticky — Grade Semanal */}
            <div className="lg:col-span-5">
              <div className="card space-y-3 lg:sticky lg:top-24">
                <h2 className="font-heading text-lg font-bold text-primary-700 flex items-center gap-2"><Clock size={18} /> Grade Semanal</h2>
                <p className="text-xs text-muted -mt-1">Ative os dias que você atende e defina os horários.</p>
                <div className="flex flex-col gap-2">
                  {DAYS.map(day => {
                    const ds = schedule[day]
                    const isWeekend = WEEKEND_DAYS.includes(day)
                    return (
                      <div key={day} className={clsx(
                        'rounded-2xl px-4 py-3 transition-all',
                        ds.enabled ? 'bg-primary-50' : isWeekend ? 'bg-secondary-50' : 'bg-background',
                      )}>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => toggleDay(day)} className={clsx('flex-shrink-0 transition-colors', ds.enabled ? 'text-primary-500' : 'text-stroke')}>
                            {ds.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          </button>
                          <span className={clsx('font-semibold text-sm w-16', ds.enabled ? 'text-primary-700' : 'text-muted')}>{day.slice(0, 3)}</span>
                          {ds.enabled ? (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <input type="time" value={ds.start} onChange={e => updateDayTime(day, 'start', e.target.value)} className="bg-white rounded-pill px-2 py-1 text-xs w-24 outline-none" />
                              <span className="text-muted text-xs">–</span>
                              <input type="time" value={ds.end} onChange={e => updateDayTime(day, 'end', e.target.value)} className="bg-white rounded-pill px-2 py-1 text-xs w-24 outline-none" />
                            </div>
                          ) : (
                            <span className="ml-auto text-xs text-muted">Indisponível</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-start gap-2 bg-primary-50 rounded-2xl p-3 mt-1">
                  <FileText size={16} className="text-primary-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted">Você pode alterar essa grade a qualquer momento.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Botão Salvar ── */}
        <button type="submit" disabled={profileMutation.isPending} className="btn-secondary w-full justify-center py-3.5 text-base">
          {profileMutation.isPending
            ? <><span className="w-5 h-5 border-2 border-primary-800/30 border-t-primary-800 rounded-full animate-spin" /> Salvando…</>
            : <><Save size={18} /> Salvar Alterações</>}
        </button>
      </form>
    </div>
  )
}
