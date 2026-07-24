import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { petsitterService } from '@/services/petsitter.service'
import { authService }      from '@/services/auth.service'
import { userService }      from '@/services/user.service'
import { useAuthStore }     from '@/store/auth.store'
import { serviceLabels, avatarUrl } from '@/utils'
import { IS_MOCK_MODE }     from '@/lib/mock'
import { Camera, Save, MapPin, Phone, DollarSign, AlertTriangle, User, Mail, Clock, ToggleLeft, ToggleRight, FileText } from 'lucide-react'
import type { ServiceType } from '@/types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const SERVICES = Object.keys(serviceLabels) as ServiceType[]
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

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

export function PetsitterProfilePage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState<'pessoal' | 'perfil' | 'agenda' | 'servicos' | 'documentos'>('pessoal')
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
        capacityPerDay: ps.capacityPerDay ?? 1,
      })
      // Load scheduleConfig
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
    // Descobre qual aba tem erro para focar nela
    if (formErrors.name || formErrors.email || formErrors.phone) setActiveTab('pessoal')
    else if (formErrors.bio || formErrors.location || formErrors.city || formErrors.state) setActiveTab('perfil')
    else if (formErrors.capacityPerDay) setActiveTab('agenda')
    else if (formErrors.services || formErrors.acceptedSpecies || formErrors.pricingConfig) setActiveTab('servicos')

    toast.error('Preencha os campos obrigatórios corretamente.')
  }

  // Avatar sobe direto pro backend assim que o arquivo é escolhido — não espera o "Salvar Perfil".
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

  /** Busca a signed URL sob demanda (nunca embutida antes do clique — expiraria) e abre. */
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
  const enabledDays = DAYS.filter(d => schedule[d]?.enabled)

  const TABS: { key: typeof activeTab; label: string; icon: string }[] = [
    { key: 'pessoal',  label: 'Dados Pessoais', icon: '👤' },
    { key: 'perfil',   label: 'Perfil',          icon: '🐾' },
    { key: 'agenda',   label: 'Agenda',           icon: '📅' },
    { key: 'servicos', label: 'Serviços',         icon: '💰' },
    { key: 'documentos', label: 'Documentos',     icon: '📄' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {IS_MOCK_MODE && (
        <div className="mb-6 flex items-center gap-3 bg-secondary-50 border border-secondary-200 text-secondary-700 rounded-2xl px-4 py-3 text-sm">
          <AlertTriangle size={18} className="flex-shrink-0 text-secondary-500" />
          <strong>Modo de demonstração</strong> — Backend offline.
        </div>
      )}

      {ps?.status === 'pending' && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-4 shadow-sm animate-pulse">
          <AlertTriangle size={24} className="flex-shrink-0 text-amber-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-amber-900">Sua conta está pendente de aprovação!</h3>
            <p className="mt-1 text-sm opacity-90">
              Você ainda não aparece nas buscas. Para ser aprovado, preencha todos os seus dados e envie seus comprovantes na aba <strong>"Documentos"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Avatar + Nome ── */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative flex-shrink-0">
            <img src={displayAvatar} alt={user.name} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary-100 shadow-sm" />
            <button onClick={() => fileRef.current?.click()} disabled={isUploadingAvatar} className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors disabled:opacity-60" title="Alterar foto">
              {isUploadingAvatar
                ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Camera size={14} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" disabled={isUploadingAvatar} onChange={handleAvatarChange} />
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <span className="badge badge-blue mt-1">🐕 Petsitter</span>
          </div>
          {enabledDays.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {enabledDays.map(d => <span key={d} className="badge badge-green">{d.slice(0, 3)}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-white rounded-2xl shadow-card mb-6 p-1 overflow-x-auto gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={clsx('flex-1 min-w-[90px] py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap', activeTab === t.key ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(d => profileMutation.mutate(d), onFormError)} className="space-y-6">

        {/* ── Aba: Dados Pessoais ── */}
        {activeTab === 'pessoal' && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2"><User size={16} className="text-primary-500" /> Dados Pessoais</h3>
            <div>
              <label className="label">Nome completo</label>
              <input {...register('name')} className={`input-field ${errors.name ? 'ring-2 ring-red-400' : ''}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1">⚠ {errors.name.message}</p>}
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" {...register('email')} className={`input-field ${errors.email ? 'ring-2 ring-red-400' : ''}`} />
              {errors.email && <p className="text-xs text-red-500 mt-1">⚠ {errors.email.message}</p>}
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Phone size={14} /> Telefone</label>
              <input {...register('phone')} className="input-field" placeholder="(11) 99999-9999" />
            </div>
          </div>
        )}

        {/* ── Aba: Perfil Público ── */}
        {activeTab === 'perfil' && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Perfil Público</h3>
            <div>
              <label className="label">Sobre você</label>
              <textarea {...register('bio')} rows={4} className="input-field resize-none" placeholder="Conte um pouco sobre você e sua experiência com pets..." />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><MapPin size={14} /> Endereço / Bairro</label>
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
            <div>
              <Controller control={control} name="isAvailable" render={({ field }) => (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <button type="button" onClick={() => field.onChange(!field.value)} className={clsx('transition-colors', field.value ? 'text-primary-500' : 'text-gray-400')}>
                    {field.value ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Disponível para novos agendamentos</p>
                    <p className="text-xs text-gray-500">{field.value ? 'Aparece nas buscas' : 'Oculto nas buscas'}</p>
                  </div>
                </div>
              )} />
            </div>
            <div>
              <Controller control={control} name="offersLocationSharing" render={({ field }) => (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <button type="button" onClick={() => field.onChange(!field.value)} className={clsx('transition-colors', field.value ? 'text-primary-500' : 'text-gray-400')}>
                    {field.value ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Compartilha localização durante passeios</p>
                    <p className="text-xs text-gray-500">
                      {field.value
                        ? 'Aparece no seu perfil público. Você compartilha check-ins manuais durante o serviço.'
                        : 'Oculto no seu perfil público'}
                    </p>
                  </div>
                </div>
              )} />
            </div>
          </div>
        )}

        {/* ── Aba: Agenda ── */}
        {activeTab === 'agenda' && (
          <div className="card space-y-5">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2"><Clock size={16} className="text-primary-500" /> Gerenciar Agenda</h3>
            
            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 mb-4">
              <label className="label text-primary-900">Capacidade Simultânea</label>
              <p className="text-xs text-primary-700 mb-2">Quantos pets você consegue atender ou hospedar no mesmo dia/horário?</p>
              <input type="number" min="1" {...register('capacityPerDay')} className={`input-field w-32 ${errors.capacityPerDay ? 'ring-2 ring-red-400' : ''}`} />
              {errors.capacityPerDay && <p className="text-xs text-red-500 mt-1">⚠ {errors.capacityPerDay.message}</p>}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Horários de Atendimento</p>
              <p className="text-xs text-gray-500 mb-3">Ative os dias que você atende e defina os horários. Dias desativados ficam bloqueados no calendário do tutor.</p>
              <div className="space-y-3">
              {DAYS.map(day => {
                const ds = schedule[day]
                return (
                  <div key={day} className={clsx('rounded-xl border-2 transition-all', ds.enabled ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50')}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button type="button" onClick={() => toggleDay(day)} className={clsx('transition-colors flex-shrink-0', ds.enabled ? 'text-primary-500' : 'text-gray-400')}>
                        {ds.enabled ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                      </button>
                      <span className={clsx('font-medium text-sm w-20', ds.enabled ? 'text-primary-700' : 'text-gray-500')}>{day}</span>
                      {ds.enabled && (
                        <div className="flex items-center gap-2 ml-auto">
                          <input
                            type="time"
                            value={ds.start}
                            onChange={e => updateDayTime(day, 'start', e.target.value)}
                            className="input-field !py-1.5 !px-2 w-28 text-sm"
                          />
                          <span className="text-gray-400 text-sm">até</span>
                          <input
                            type="time"
                            value={ds.end}
                            onChange={e => updateDayTime(day, 'end', e.target.value)}
                            className="input-field !py-1.5 !px-2 w-28 text-sm"
                          />
                        </div>
                      )}
                      {!ds.enabled && <span className="ml-auto text-xs text-gray-400">Indisponível</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            </div>
          </div>
        )}

        {/* ── Aba: Serviços e Preços ── */}
        {activeTab === 'servicos' && (
          <div className="space-y-6">
            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Espécies Aceitas</h3>
              <Controller control={control} name="acceptedSpecies" render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SPECIES_OPTIONS.map(s => {
                    const checked = field.value?.includes(s.value)
                    return (
                      <button key={s.value} type="button"
                        onClick={() => field.onChange(checked ? field.value.filter(v => v !== s.value) : [...(field.value || []), s.value])}
                        className={clsx('p-3 rounded-xl border-2 text-sm font-medium text-center transition-all', checked ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              )} />
              {errors.acceptedSpecies && <p className="text-xs text-red-500">⚠ {errors.acceptedSpecies.message}</p>}
            </div>

            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Serviços Oferecidos</h3>
              <Controller control={control} name="services" render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES.map(s => {
                    const checked = field.value.includes(s)
                    return (
                      <button key={s} type="button"
                        onClick={() => field.onChange(checked ? field.value.filter(v => v !== s) : [...field.value, s])}
                        className={clsx('p-3 rounded-xl border-2 text-sm font-medium text-left transition-all', checked ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                        {serviceLabels[s]}
                        {FULL_DAY_SERVICES.includes(s) && <span className="block text-xs font-normal text-gray-400 mt-0.5">Dia inteiro</span>}
                      </button>
                    )
                  })}
                </div>
              )} />
              {errors.services && <p className="text-xs text-red-500">⚠ {errors.services.message}</p>}
            </div>

            {selectedServices.length > 0 && (
              <div className="card space-y-4">
                <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2"><DollarSign size={16} className="text-primary-500" /> Preços por Serviço</h3>
                {selectedServices.map(s => {
                  const isFullDay = FULL_DAY_SERVICES.includes(s)
                  const currentType = pricingConfig?.[s]?.type ?? (isFullDay ? 'fixed' : 'per_hour')
                  return (
                    <div key={s} className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 text-sm">{serviceLabels[s]}</span>
                        {isFullDay
                          ? <span className="badge badge-blue text-xs">Cobrança por dia</span>
                          : (
                            <div className="flex gap-2">
                              {(['per_hour', 'fixed'] as const).map(t => (
                                <button key={t} type="button"
                                  onClick={() => {}}
                                  className={clsx('px-3 py-1 rounded-lg text-xs font-medium border transition-all', currentType === t ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600')}>
                                  {t === 'per_hour' ? 'Por hora' : 'Fixo'}
                                </button>
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
                                      className={clsx('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all', val.type === t ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                                      {t === 'per_hour' ? '⏰ Por hora' : '💳 Valor fixo'}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
                                <input type="number" min={1} step={0.5} value={val.price ?? ''}
                                  onChange={e => field.onChange({ ...val, price: Number(e.target.value) })}
                                  className="input-field pl-8 text-sm" placeholder={isFullDay ? 'Valor por dia' : val.type === 'per_hour' ? 'Valor por hora' : 'Valor fixo'} />
                              </div>
                            </div>
                          )
                        }} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Aba: Documentos ── */}
        {activeTab === 'documentos' && (
          <div className="card space-y-6">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2"><FileText size={16} className="text-primary-500" /> Documentação</h3>
            <p className="text-sm text-gray-600 mb-4">
              Para garantirmos a segurança da plataforma, pedimos que envie uma foto legível do seu documento de identidade (RG ou CNH) e um comprovante de residência atualizado.
            </p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-800 mb-1">Documento de Identidade (RG ou CNH)</label>
                <div className="flex flex-col gap-2">
                  <input type="file" accept="image/*,.pdf" onChange={(e) => uploadDocument('identity-proof', e)} disabled={isUploading} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                  {ps?.identityProof && (
                    <button type="button" onClick={() => viewDocument('identity-proof')} className="text-xs text-primary-600 hover:underline mt-1 block text-left">
                      Ver documento enviado
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-800 mb-1">Comprovante de Residência</label>
                <div className="flex flex-col gap-2">
                  <input type="file" accept="image/*,.pdf" onChange={(e) => uploadDocument('address-proof', e)} disabled={isUploading} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                  {ps?.addressProof && (
                    <button type="button" onClick={() => viewDocument('address-proof')} className="text-xs text-primary-600 hover:underline mt-1 block text-left">
                      Ver documento enviado
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {ps?.status === 'pending' && (
              <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
                <AlertTriangle size={18} className="flex-shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <strong>Seu perfil está Em Análise!</strong>
                  <p className="mt-1 opacity-90">Nossa equipe vai analisar seus documentos e perfil antes de publicá-lo para os tutores. Fique de olho no seu e-mail!</p>
                </div>
              </div>
            )}
            
            {ps?.status === 'rejected' && (
              <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm">
                <AlertTriangle size={18} className="flex-shrink-0 text-red-500 mt-0.5" />
                <div>
                  <strong>Documentação Rejeitada!</strong>
                  <p className="mt-1 opacity-90">Por favor, envie documentos mais nítidos ou entre em contato com o suporte para entender o motivo.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Botão Salvar ── */}
        <button type="submit" disabled={profileMutation.isPending} className="btn-primary w-full justify-center py-3 text-base">
          {profileMutation.isPending
            ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando…</>
            : <><Save size={18} /> Salvar Perfil</>}
        </button>
      </form>
    </div>
  )
}
