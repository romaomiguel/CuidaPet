import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import {
  Eye, EyeOff, Mail, Lock, User, CreditCard, ArrowRight, ArrowLeft, Phone,
  PawPrint, HeartHandshake, BadgeCheck, ShieldCheck, CalendarCheck, Star, Check, Heart,
} from 'lucide-react'
import { authService }     from '@/services/auth.service'
import { petsitterService } from '@/services/petsitter.service'
import { useAuthStore }    from '@/store/auth.store'
import { validateCPF, maskCPF } from '@/utils/cpf'
import { maskPhone } from '@/utils'
import { IS_MOCK_MODE } from '@/lib/mock'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type Step = 'choose' | 'tutor' | 'petsitter'

export function RegisterPage() {
  const [step, setStep] = useState<Step>('choose')

  if (step === 'choose')    return <ChooseProfile onSelect={setStep} />
  if (step === 'tutor')     return <TutorForm onBack={() => setStep('choose')} />
  return <PetSitterForm onBack={() => setStep('choose')} />
}

// ─── Passo 1: Escolha de Perfil ─────────────────────────────────────────────

function ChooseProfile({ onSelect }: { onSelect: (step: Step) => void }) {
  return (
    <div className="w-full max-w-[1000px]">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="font-heading text-4xl font-extrabold text-primary-800 mb-2">
          Como você deseja usar o CuidaPet?
        </h1>
        <p className="text-lg text-muted">Selecione o seu perfil para personalizarmos a sua experiência.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => onSelect('tutor')}
          className="group relative flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center overflow-hidden"
        >
          <div className="relative w-40 h-40 mb-6 flex items-center justify-center bg-primary-100 rounded-full group-hover:scale-105 transition-transform duration-500">
            <PawPrint size={64} className="text-primary-800" />
            <div className="absolute inset-0 border-2 border-primary-500/20 rounded-full animate-[spin_15s_linear_infinite]" />
            <div className="absolute inset-0 border-2 border-dashed border-primary-500/10 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-primary-800 mb-2">Sou Tutor</h2>
          <p className="text-muted max-w-[280px]">Quero encontrar os melhores cuidadores para o meu pet com segurança e carinho.</p>
          <ArrowRight size={28} className="absolute bottom-8 right-8 text-primary-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => onSelect('petsitter')}
          className="group relative flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center overflow-hidden"
        >
          <div className="relative w-40 h-40 mb-6 flex items-center justify-center bg-secondary-100 rounded-full group-hover:scale-105 transition-transform duration-500">
            <HeartHandshake size={64} className="text-secondary-700" />
            <div className="absolute inset-0 border-2 border-secondary-500/30 rounded-full animate-[spin_15s_linear_infinite]" />
            <div className="absolute inset-0 border-2 border-dashed border-secondary-500/20 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-secondary-700 mb-2">Sou Pet Sitter</h2>
          <p className="text-muted max-w-[280px]">Quero oferecer meus serviços de cuidado e construir uma carteira de clientes felizes.</p>
          <ArrowRight size={28} className="absolute bottom-8 right-8 text-secondary-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      <p className="text-center text-muted mt-10">
        Já possui uma conta?{' '}
        <Link to="/login" className="font-bold text-primary-600 hover:underline">Faça login</Link>
      </p>
    </div>
  )
}

// ─── Passo 2a: Cadastro Tutor ────────────────────────────────────────────────

const tutorSchema = z.object({
  name:  z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(14, 'Telefone inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, 'A senha deve conter maiúscula, minúscula e número'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
type TutorFormData = z.infer<typeof tutorSchema>

function TutorForm({ onBack }: { onBack: () => void }) {
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [phoneValue, setPhoneValue]   = useState('')
  const { setUser } = useAuthStore()
  const navigate     = useNavigate()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TutorFormData>({
    resolver: zodResolver(tutorSchema),
  })

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: ({ user }) => {
      setUser(user)
      toast.success(IS_MOCK_MODE ? 'Conta demo criada! (modo offline) 🐾' : 'Conta criada com sucesso! Bem-vindo 🐾')
      navigate('/buscar')
    },
  })

  const onSubmit = (data: TutorFormData) =>
    mutation.mutate({ name: data.name, email: data.email, phone: data.phone, password: data.password, role: 'tutor' })

  return (
    <div className="w-full max-w-4xl relative">
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 flex flex-col md:flex-row gap-10">

        {/* ── Painel esquerdo: confiança ── */}
        <div className="flex-1 flex flex-col justify-between relative overflow-hidden bg-primary-800 text-white rounded-[2rem] p-8 md:p-10 min-h-[320px] md:min-h-0">
          <img
            src="https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=700"
            alt="Tutor com seu pet"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-800/90 to-primary-800/20" />

          <div className="relative z-10">
            <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-primary-100 hover:text-white mb-6">
              <ArrowLeft size={16} /> Voltar
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-500 text-primary-800 rounded-pill text-xs font-bold uppercase tracking-widest mb-4">
              <Heart size={14} fill="currentColor" /> Para Tutores
            </span>
          </div>

          <div className="relative z-10 mt-auto">
            <h2 className="font-heading text-3xl font-extrabold mb-5 leading-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.95)]">Encontre o cuidado perfeito<br />para o seu pet.</h2>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <h4 className="font-semibold text-white [text-shadow:0_1px_5px_rgba(0,0,0,0.95)]">Perfis Verificados</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                  <CalendarCheck size={18} />
                </div>
                <h4 className="font-semibold text-white [text-shadow:0_1px_5px_rgba(0,0,0,0.95)]">Agendamento Fácil</h4>
              </div>
            </div>
          </div>
        </div>

        {/* ── Painel direito: formulário ── */}
        <div className="flex-[1.1] flex flex-col justify-center">
          <div className="mb-5">
            <h3 className="font-heading text-2xl font-bold text-ink mb-1">Crie sua conta</h3>
            <p className="text-muted">Junte-se a nós para cuidar melhor do seu melhor amigo.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div>
              <label className="label" htmlFor="t-nome">Nome completo</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input id="t-nome" type="text" autoComplete="name" placeholder="Ex: João da Silva"
                  {...register('name')}
                  className={`input-field pl-11 ${errors.name ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                />
              </div>
              {errors.name && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="t-email">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="t-email" type="email" autoComplete="email" placeholder="seu@email.com"
                    {...register('email')}
                    className={`input-field pl-11 ${errors.email ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.email.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="t-phone">Telefone</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="t-phone" type="tel" inputMode="numeric" placeholder="(11) 99999-9999" maxLength={15}
                    value={phoneValue}
                    {...register('phone')}
                    onChange={e => {
                      const masked = maskPhone(e.target.value)
                      setPhoneValue(masked)
                      setValue('phone', masked, { shouldValidate: true })
                    }}
                    className={`input-field pl-11 ${errors.phone ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="t-senha">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="t-senha" type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                    {...register('password')}
                    className={`input-field pl-11 pr-11 ${errors.password ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary-600">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="t-confirma">Confirmação</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="t-confirma" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={`input-field pl-11 pr-11 ${errors.confirmPassword ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary-600">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            {errors.password && <p className="text-xs text-error-500 -mt-2 ml-1">⚠ {errors.password.message}</p>}
            {errors.confirmPassword && <p className="text-xs text-error-500 -mt-2 ml-1">⚠ {errors.confirmPassword.message}</p>}

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input type="checkbox" required className="mt-1 w-5 h-5 rounded accent-primary-600" />
              <span className="text-sm text-muted">
                Li e concordo com os <span className="text-primary-600 font-semibold hover:underline">Termos de Uso</span> e{' '}
                <span className="text-primary-600 font-semibold hover:underline">Política de Privacidade</span>.
              </span>
            </label>

            <button type="submit" disabled={mutation.isPending} className="btn-secondary w-full py-3.5 mt-1 justify-center text-base">
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-800/30 border-t-primary-800 rounded-full animate-spin" />
                  Criando conta…
                </span>
              ) : (<>Criar conta de Tutor <ArrowRight size={18} /></>)}
            </button>

            <p className="text-center text-sm text-muted mt-1">
              Já tem uma conta? <Link to="/login" className="font-semibold text-primary-600 hover:underline">Fazer login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Passo 2b: Cadastro Pet Sitter ───────────────────────────────────────────

const petsitterSchema = z.object({
  name:  z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf:   z.string().min(14, 'CPF inválido').refine(validateCPF, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(14, 'Telefone inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, 'A senha deve conter maiúscula, minúscula e número'),
})
type PetSitterFormData = z.infer<typeof petsitterSchema>

function PetSitterForm({ onBack }: { onBack: () => void }) {
  const [showPass, setShowPass]   = useState(false)
  const [cpfValue, setCpfValue]   = useState('')
  const [phoneValue, setPhoneValue] = useState('')
  const [bio, setBio]             = useState('')
  const { setUser } = useAuthStore()
  const navigate     = useNavigate()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PetSitterFormData>({
    resolver: zodResolver(petsitterSchema),
  })

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: async ({ user }) => {
      setUser(user)
      if (bio.trim()) {
        try { await petsitterService.updateProfile({ bio: bio.trim() }) }
        catch (err) { console.error('[cadastro] Falha ao salvar bio inicial do cuidador:', err) }
      }
      toast.success(IS_MOCK_MODE ? 'Conta demo criada! (modo offline) 🐾' : 'Conta criada com sucesso! Bem-vindo 🐾')
      navigate('/dashboard/petsitter/perfil')
    },
  })

  const onSubmit = (data: PetSitterFormData) => mutation.mutate({ ...data, role: 'petsitter' })

  return (
    <div className="w-full max-w-4xl relative">
      <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-10 flex flex-col md:flex-row gap-10">

        {/* ── Painel esquerdo: confiança ── */}
        <div className="flex-1 flex flex-col justify-between relative overflow-hidden bg-primary-800 text-white rounded-[2rem] p-8 md:p-10 min-h-[320px] md:min-h-0">
          <img
            src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=700"
            alt="Cuidador com cachorro"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-800/90 to-primary-800/20" />

          <div className="relative z-10">
            <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-primary-100 hover:text-white mb-6">
              <ArrowLeft size={16} /> Voltar
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-500 text-primary-800 rounded-pill text-xs font-bold uppercase tracking-widest mb-4">
              <BadgeCheck size={16} /> Parceiro Oficial
            </span>
          </div>

          <div className="relative z-10 mt-auto">
            <h2 className="font-heading text-3xl font-extrabold mb-5 leading-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.95)]">Junte-se à nossa<br />rede de amor.</h2>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <h4 className="font-semibold text-white [text-shadow:0_1px_5px_rgba(0,0,0,0.95)]">Verificação Segura</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                  <CalendarCheck size={18} />
                </div>
                <h4 className="font-semibold text-white [text-shadow:0_1px_5px_rgba(0,0,0,0.95)]">Flexibilidade Total</h4>
              </div>
            </div>
          </div>
        </div>

        {/* ── Painel direito: formulário ── */}
        <div className="flex-[1.2] flex flex-col justify-center">
          <div className="mb-5">
            <h3 className="font-heading text-2xl font-bold text-ink mb-1">Cadastro de Cuidador</h3>
            <p className="text-muted">Preencha seus dados para iniciarmos sua aprovação.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="ps-nome">Nome Completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="ps-nome" type="text" placeholder="Como está no seu documento"
                    {...register('name')}
                    className={`input-field pl-11 ${errors.name ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                  />
                </div>
                {errors.name && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.name.message}</p>}
              </div>
              <div>
                <label className="label" htmlFor="ps-cpf">CPF</label>
                <div className="relative">
                  <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="ps-cpf" type="text" inputMode="numeric" placeholder="000.000.000-00" maxLength={14}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="ps-email">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="ps-email" type="email" placeholder="seu@email.com"
                    {...register('email')}
                    className={`input-field pl-11 ${errors.email ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.email.message}</p>}
              </div>
              <div>
                <label className="label" htmlFor="ps-phone">Telefone (WhatsApp)</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input id="ps-phone" type="tel" inputMode="numeric" placeholder="(00) 00000-0000" maxLength={15}
                    value={phoneValue}
                    {...register('phone')}
                    onChange={e => {
                      const masked = maskPhone(e.target.value)
                      setPhoneValue(masked)
                      setValue('phone', masked, { shouldValidate: true })
                    }}
                    className={`input-field pl-11 ${errors.phone ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="ps-senha">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input id="ps-senha" type={showPass ? 'text' : 'password'} placeholder="Mínimo de 8 caracteres"
                  {...register('password')}
                  className={`input-field pl-11 pr-11 ${errors.password ? 'ring-2 ring-error-100 border-error-500' : ''}`}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.password.message}</p>}
            </div>

            <div className="pt-1">
              <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                <label className="label mb-0" htmlFor="ps-bio">Conte-nos sua experiência</label>
                <Star size={14} className="text-secondary-500" fill="currentColor" />
              </div>
              <textarea
                id="ps-bio"
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Descreva brevemente com quais pets você tem experiência, há quanto tempo atua na área e o que mais ama em cuidar deles..."
                className="w-full p-4 rounded-2xl bg-secondary-50 border-2 border-transparent focus:border-secondary-400 outline-none text-sm text-ink resize-none transition-all"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input type="checkbox" required className="mt-1 w-5 h-5 rounded accent-primary-600" />
              <span className="text-sm text-muted">
                Li e concordo com os <span className="text-primary-600 font-semibold hover:underline">Termos de Uso</span> e a{' '}
                <span className="text-primary-600 font-semibold hover:underline">Política de Privacidade</span>.
              </span>
            </label>

            <button type="submit" disabled={mutation.isPending} className="btn-secondary w-full py-3.5 mt-1 justify-center text-base">
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-800/30 border-t-primary-800 rounded-full animate-spin" />
                  Criando conta…
                </span>
              ) : (<>Criar conta de Cuidador <Check size={18} /></>)}
            </button>

            <p className="text-center text-sm text-muted mt-1">
              Já é parceiro? <Link to="/login" className="font-semibold text-primary-600 hover:underline">Faça login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
