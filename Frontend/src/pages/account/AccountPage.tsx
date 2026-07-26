import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/store/auth.store'
import { IS_MOCK_MODE } from '@/lib/mock'
import { maskCPF } from '@/utils/cpf'
import { avatarUrl } from '@/utils'
import { Camera, Save, User, Mail, Phone, CreditCard, FileText, AlertTriangle } from 'lucide-react'
import { PetsPage } from '@/pages/account/PetsPage'
import { BookingsPage } from '@/pages/account/BookingsPage'
import { ChatPage } from '@/pages/chat/ChatPage'
import toast from 'react-hot-toast'

type Tab = 'perfil' | 'pets' | 'agendamentos' | 'mensagens'

const profileSchema = z.object({
  name:  z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  cpf:   z.string().refine(v => !v || v.length === 14, 'CPF inválido').optional(),
  bio:   z.string().max(500, 'Máximo de 500 caracteres').optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

export function AccountPage() {
  const { user, setUser } = useAuthStore()
  const queryClient       = useQueryClient()
  const fileRef           = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [cpfValue, setCpfValue]           = useState(user?.cpf ?? '')

  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const tab: Tab = requestedTab === 'pets' || requestedTab === 'agendamentos' || requestedTab === 'mensagens'
    ? requestedTab
    : 'perfil'

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, email: user?.email, phone: user?.phone ?? '', cpf: user?.cpf ?? '', bio: user?.bio ?? '' },
  })
  const bioValue = watch('bio') ?? ''

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => authService.updateProfile(data),
    onSuccess: (updated) => {
      setUser(updated)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Perfil atualizado com sucesso!')
    },
  })

  // Avatar sobe direto pro backend assim que o arquivo é escolhido — não espera o "Salvar".
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo 5MB.'); return }

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

  if (!user) return null

  const displayAvatar = avatarUrl(user.name, user.avatarUrl ?? undefined)
  const isTutor = user.role === 'tutor'

  return (
    <div className="max-w-6xl mx-auto">

      {/* Mock mode banner */}
      {IS_MOCK_MODE && (
        <div className="mb-6 flex items-center gap-3 bg-secondary-50 border border-secondary-200 text-secondary-700 rounded-2xl px-4 py-3 text-sm">
          <AlertTriangle size={18} className="flex-shrink-0 text-secondary-500" />
          <div>
            <strong>Modo de demonstração</strong> — Backend offline. Dados salvos localmente.
          </div>
        </div>
      )}

      {/* ── Header de identidade — só na aba Perfil, pra dar mais espaço às demais ── */}
      {tab === 'perfil' && (
        <>
          <h1 className="font-heading text-3xl font-extrabold text-primary-800 mb-6">Meu Perfil</h1>
          <div className="card mb-6 max-w-2xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar com botão de upload */}
              <div className="relative flex-shrink-0">
                <img
                  src={displayAvatar}
                  alt={user.name}
                  className="avatar-framed w-24 h-24"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors disabled:opacity-60"
                  title="Alterar foto"
                >
                  {isUploadingAvatar
                    ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Camera size={14} />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingAvatar}
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Info */}
              <div className="text-center sm:text-left flex-1">
                <h2 className="font-heading text-xl font-bold text-ink">{user.name}</h2>
                <p className="text-muted text-sm">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="badge badge-blue">
                    {user.role === 'petsitter' ? '🐕 Petsitter' : user.role === 'admin' ? '👑 Admin' : '🐾 Tutor'}
                  </span>
                  {user.cpf && (
                    <span className="badge badge-gray">CPF: {user.cpf}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Conteúdo da aba ativa — a troca em si já é feita pela sidebar ── */}
      <div key={tab} className="animate-tab-in">
        {tab === 'perfil' && (
          <div className="card max-w-2xl">
            <h2 className="font-heading font-bold text-lg text-primary-700 mb-5 flex items-center gap-2">
              <User size={18} /> Dados pessoais
            </h2>
            <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="label" htmlFor="acc-name">Nome completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="acc-name" {...register('name')} className={`input-field pl-11 ${errors.name ? 'ring-2 ring-error-100 border-error-500' : ''}`} />
                </div>
                {errors.name && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.name.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="acc-email">E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="acc-email" type="email" {...register('email')} className={`input-field pl-11 ${errors.email ? 'ring-2 ring-error-100 border-error-500' : ''}`} />
                </div>
                {errors.email && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.email.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="acc-cpf">CPF</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    id="acc-cpf"
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={cpfValue}
                    {...register('cpf')}
                    onChange={e => {
                      const masked = maskCPF(e.target.value)
                      setCpfValue(masked)
                      setValue('cpf', masked, { shouldValidate: true })
                    }}
                    className={`input-field pl-11 ${errors.cpf ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                  />
                </div>
                {errors.cpf && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.cpf.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="acc-phone">Telefone (opcional)</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="acc-phone" {...register('phone')} className="input-field pl-11" placeholder="(11) 99999-9999" />
                </div>
              </div>

              {isTutor && (
                <div>
                  <label className="label" htmlFor="acc-bio">Sobre mim (opcional)</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-3.5 text-muted pointer-events-none" />
                    <textarea
                      id="acc-bio"
                      {...register('bio')}
                      rows={4}
                      maxLength={500}
                      className={`input-field pl-11 py-3 resize-none ${errors.bio ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                      placeholder="Conte um pouco sobre você e seus pets — rotina, preferências, cuidados especiais. Isso ajuda o cuidador a te conhecer melhor."
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 ml-4">
                    {errors.bio
                      ? <p className="text-xs text-error-500">⚠ {errors.bio.message}</p>
                      : <span />}
                    <span className="text-xs text-muted">{bioValue.length}/500</span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={updateMutation.isPending} className="btn-secondary">
                  {updateMutation.isPending
                    ? <><span className="w-4 h-4 border-2 border-primary-800/30 border-t-primary-800 rounded-full animate-spin" /> Salvando…</>
                    : <><Save size={16} /> Salvar alterações</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'pets' && isTutor && <PetsPage />}
        {tab === 'agendamentos' && isTutor && <BookingsPage />}
        {tab === 'mensagens' && isTutor && <ChatPage />}
      </div>
    </div>
  )
}
