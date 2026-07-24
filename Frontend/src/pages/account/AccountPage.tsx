import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '@/services/auth.service'
import { petService }  from '@/services/pet.service'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/store/auth.store'
import { IS_MOCK_MODE } from '@/lib/mock'
import { validateCPF, maskCPF } from '@/utils/cpf'
import { avatarUrl, speciesLabels } from '@/utils'
import { Camera, Save, User, Mail, Phone, CreditCard, PawPrint, ArrowRight, AlertTriangle } from 'lucide-react'
import { SkeletonList } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const profileSchema = z.object({
  name:  z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  cpf:   z.string().refine(v => !v || v.length === 14, 'CPF inválido').optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

export function AccountPage() {
  const { user, setUser } = useAuthStore()
  const queryClient       = useQueryClient()
  const fileRef           = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [cpfValue, setCpfValue]           = useState(user?.cpf ?? '')
  const [activeTab, setActiveTab]         = useState<'perfil' | 'pets'>('perfil')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, email: user?.email, phone: user?.phone, cpf: user?.cpf },
  })

  // Pets do tutor
  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['pets'],
    queryFn:  petService.list,
    enabled:  user?.role === 'tutor',
  })

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Mock mode banner */}
      {IS_MOCK_MODE && (
        <div className="mb-6 flex items-center gap-3 bg-secondary-50 border border-secondary-200 text-secondary-700 rounded-2xl px-4 py-3 text-sm">
          <AlertTriangle size={18} className="flex-shrink-0 text-secondary-500" />
          <div>
            <strong>Modo de demonstração</strong> — Backend offline. Dados salvos localmente.
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar com botão de upload */}
          <div className="relative flex-shrink-0">
            <img
              src={displayAvatar}
              alt={user.name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary-100 shadow-sm"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors disabled:opacity-60"
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
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
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

      {/* ── Tabs ── */}
      {user.role === 'tutor' && (
        <div className="flex bg-white rounded-2xl shadow-card mb-6 p-1">
          {(['perfil', 'pets'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={clsx(
                'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize',
                activeTab === t
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t === 'pets' ? '🐶 Meus Pets' : '👤 Dados pessoais'}
            </button>
          ))}
        </div>
      )}

      {/* ── Aba: Perfil ── */}
      {activeTab === 'perfil' && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <User size={18} className="text-primary-500" /> Dados pessoais
          </h2>
          <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="label" htmlFor="acc-name">Nome completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input id="acc-name" {...register('name')} className={`input-field pl-10 ${errors.name ? 'ring-2 ring-red-400' : ''}`} />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="acc-email">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input id="acc-email" type="email" {...register('email')} className={`input-field pl-10 ${errors.email ? 'ring-2 ring-red-400' : ''}`} />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="acc-cpf">CPF</label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                  className={`input-field pl-10 ${errors.cpf ? 'ring-2 ring-red-400' : ''}`}
                />
              </div>
              {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="acc-phone">Telefone (opcional)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input id="acc-phone" {...register('phone')} className="input-field pl-10" placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                {updateMutation.isPending
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando…</>
                  : <><Save size={16} /> Salvar alterações</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Aba: Pets ── */}
      {activeTab === 'pets' && user.role === 'tutor' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <PawPrint size={18} className="text-primary-500" /> Meus pets
            </h2>
            <Link to="/pets" className="btn-outline text-sm py-2 px-4">
              Gerenciar pets <ArrowRight size={14} />
            </Link>
          </div>

          {petsLoading && <SkeletonList count={2} component="pet" />}

          {!petsLoading && pets.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🐾</div>
              <p className="text-gray-500 text-sm mb-4">Nenhum pet cadastrado ainda.</p>
              <Link to="/pets" className="btn-primary text-sm">Adicionar pet</Link>
            </div>
          )}

          <div className="space-y-3">
            {pets.slice(0, 3).map(pet => (
              <div key={pet.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                {pet.photo ? (
                  <img src={pet.photo} alt={pet.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {pet.species === 'cachorro' ? '🐶' : pet.species === 'gato' ? '🐱' : '🐾'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{pet.name}</p>
                  <p className="text-xs text-gray-500">{speciesLabels[pet.species]} • {pet.age} {pet.age === 1 ? 'ano' : 'anos'}{pet.breed ? ` • ${pet.breed}` : ''}</p>
                  {pet.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{pet.notes}</p>}
                </div>
              </div>
            ))}
            {pets.length > 3 && (
              <Link to="/pets" className="flex items-center justify-center gap-1 text-sm text-primary-600 font-medium hover:underline py-2">
                Ver todos os {pets.length} pets <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
