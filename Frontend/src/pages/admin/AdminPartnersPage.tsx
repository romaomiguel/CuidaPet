import { useState, useEffect } from 'react'
import { Building2, Plus, X } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { partnerService } from '@/services/partner.service'
import type { PartnerProfile, ServiceType } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import { serviceLabels, PARTNER_SERVICES_BY_TYPE } from '@/utils'

const schema = z.object({
  name: z.string().min(1, 'Obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  type: z.enum(['clinica', 'petshop']),
  businessName: z.string().min(1, 'Obrigatório'),
  cnpj: z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Formato: XX.XXX.XXX/XXXX-XX')
    .optional()
    .or(z.literal('')),
  address: z.string().min(1, 'Obrigatório'),
  city: z.string().min(1, 'Obrigatório'),
  state: z.string().min(1, 'Obrigatório'),
  servicesOffered: z.array(z.string()),
})
type FormData = z.infer<typeof schema>

export function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'clinica', servicesOffered: [] },
  })
  const selectedType = watch('type')

  // O tipo determina quais serviços aparecem no checklist; ao trocar de tipo, os
  // serviços marcados até então não fazem mais sentido (as listas não se sobrepõem).
  useEffect(() => {
    setValue('servicesOffered', [])
  }, [selectedType, setValue])

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const { data } = await partnerService.findAllForAdmin()
      setPartners(data)
    } catch (error) {
      console.error('Erro ao buscar parceiros', error)
      toast.error('Erro ao buscar parceiros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  const onSubmit = async (formData: FormData) => {
    try {
      await partnerService.create({
        ...formData,
        cnpj: formData.cnpj || undefined,
        servicesOffered: formData.servicesOffered as ServiceType[],
      })
      toast.success('Parceiro cadastrado com sucesso!')
      reset()
      setShowForm(false)
      fetchPartners()
    } catch (error) {
      console.error('Erro ao cadastrar parceiro', error)
      toast.error('Erro ao cadastrar parceiro.')
    }
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Parceiros (Clínicas e Petshops)</h1>
          <p className="text-muted mt-2">Cadastre parceiros B2B e gerencie suas credenciais de acesso.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={showForm ? 'btn-outline flex-shrink-0' : 'btn-primary flex-shrink-0'}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancelar' : 'Novo parceiro'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Credenciais de acesso</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">Responsável (interno)</label>
                <input {...register('name')} className="input-field mt-1.5" />
                {errors.name && <p className="text-xs text-error-600 mt-1">{errors.name.message}</p>}
                <p className="text-xs text-muted mt-1">Só pra referência interna — nunca aparece pro parceiro nem publicamente.</p>
              </div>
              <div>
                <label className="label">E-mail de login</label>
                <input {...register('email')} type="email" className="input-field mt-1.5" />
                {errors.email && <p className="text-xs text-error-600 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Senha inicial</label>
                <input {...register('password')} type="password" className="input-field mt-1.5" />
                {errors.password && <p className="text-xs text-error-600 mt-1">{errors.password.message}</p>}
              </div>
            </div>
          </div>

          <hr className="my-6 border-stroke" />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Dados do estabelecimento</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">Tipo</label>
                <select {...register('type')} className="select-field mt-1.5">
                  <option value="clinica">Clínica</option>
                  <option value="petshop">Petshop</option>
                </select>
              </div>
              <div>
                <label className="label">Nome fantasia</label>
                <input {...register('businessName')} className="input-field mt-1.5" />
                {errors.businessName && <p className="text-xs text-error-600 mt-1">{errors.businessName.message}</p>}
              </div>
              <div>
                <label className="label">CNPJ (opcional)</label>
                <input {...register('cnpj')} placeholder="XX.XXX.XXX/XXXX-XX" className="input-field mt-1.5" />
                {errors.cnpj && <p className="text-xs text-error-600 mt-1">{errors.cnpj.message}</p>}
              </div>
              <div>
                <label className="label">Endereço</label>
                <input {...register('address')} className="input-field mt-1.5" />
                {errors.address && <p className="text-xs text-error-600 mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <label className="label">Cidade</label>
                <input {...register('city')} className="input-field mt-1.5" />
                {errors.city && <p className="text-xs text-error-600 mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="label">Estado (UF)</label>
                <input {...register('state')} className="input-field mt-1.5" />
                {errors.state && <p className="text-xs text-error-600 mt-1">{errors.state.message}</p>}
              </div>
              {selectedType && (
                <div className="md:col-span-2">
                  <label className="label mb-2">Serviços prestados</label>
                  <Controller control={control} name="servicesOffered" render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PARTNER_SERVICES_BY_TYPE[selectedType].map((s) => {
                        const checked = field.value.includes(s)
                        return (
                          <button key={s} type="button"
                            onClick={() => field.onChange(checked ? field.value.filter((v) => v !== s) : [...field.value, s])}
                            className={checked ? 'toggle-chip-active' : 'toggle-chip'}>
                            {serviceLabels[s]}
                          </button>
                        )
                      })}
                    </div>
                  )} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-stroke pt-6">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar parceiro'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card">
          <div className="space-y-5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
                <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
              </div>
            ))}
          </div>
        </div>
      ) : partners.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted mb-4" />
          <h3 className="text-lg font-medium text-ink">Nenhum parceiro cadastrado</h3>
          <p className="text-sm text-muted mt-1">Cadastre o primeiro parceiro para começar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="text-xs text-ink uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Parceiro</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Cidade</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{p.businessName}</p>
                          <p className="text-xs text-muted">{p.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={p.type === 'clinica' ? 'badge-brand' : 'badge-blue'}>
                        {p.type === 'clinica' ? 'Clínica' : 'Petshop'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{p.city}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={p.user.isActive ? 'badge-green' : 'badge-red'}>
                        {p.user.isActive ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
