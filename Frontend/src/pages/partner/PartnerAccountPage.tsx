import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Building2, MapPin, Save } from 'lucide-react'
import { partnerService } from '@/services/partner.service'
import { Skeleton } from '@/components/ui/Skeleton'
import type { PartnerProfile } from '@/types'

const schema = z.object({
  businessName: z.string().min(1, 'Obrigatório'),
  address: z.string().min(1, 'Obrigatório'),
  city: z.string().min(1, 'Obrigatório'),
  state: z.string().min(1, 'Obrigatório'),
})
type FormData = z.infer<typeof schema>

export function PartnerAccountPage() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    partnerService.findMe()
      .then((data) => {
        setProfile(data)
        reset({ businessName: data.businessName, address: data.address, city: data.city, state: data.state })
      })
      .catch((error) => {
        console.error('Erro ao buscar perfil do parceiro', error)
        toast.error('Erro ao carregar seu perfil')
      })
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (formData: FormData) => {
    try {
      const updated = await partnerService.updateMe(formData)
      setProfile(updated)
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar perfil', error)
      toast.error('Erro ao atualizar perfil.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-2 mb-8">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-6 w-40" />
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
          <Skeleton className="h-12 w-full rounded-pill" />
        </div>
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-primary-800">Meu Perfil</h1>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className={profile.type === 'clinica' ? 'badge-brand' : 'badge-blue'}>
            {profile.type === 'clinica' ? 'Clínica' : 'Petshop'}
          </span>
          <span>{profile.user.email}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
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

        <button type="submit" disabled={isSubmitting} className="btn-secondary w-full justify-center py-3.5 text-base">
          {isSubmitting
            ? <><span className="w-5 h-5 border-2 border-primary-800/30 border-t-primary-800 rounded-full animate-spin" /> Salvando…</>
            : <><Save size={18} /> Salvar alterações</>}
        </button>
      </form>
    </div>
  )
}
