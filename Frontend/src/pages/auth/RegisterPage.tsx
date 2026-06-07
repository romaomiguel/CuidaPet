import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Mail, Lock, User, CreditCard, ArrowRight } from 'lucide-react'
import { authService }  from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { validateCPF, maskCPF } from '@/utils/cpf'
import { IS_MOCK_MODE } from '@/lib/mock'
import type { UserRole } from '@/types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const schema = z.object({
  name:     z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email:    z.string().email('E-mail inválido'),
  cpf:      z.string().min(14, 'CPF inválido').refine(validateCPF, 'CPF inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
  role:     z.enum(['tutor', 'petsitter']),
})
type FormData = z.infer<typeof schema>

const ROLES: { value: 'tutor' | 'petsitter'; emoji: string; label: string; desc: string }[] = [
  { value: 'tutor',     emoji: '🐾', label: 'Tutor',     desc: 'Quero encontrar cuidadores'       },
  { value: 'petsitter', emoji: '🐕', label: 'Petsitter', desc: 'Quero oferecer serviços de pets'  },
]

export function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [role,     setRole]     = useState<UserRole>('tutor')
  const [cpfValue, setCpfValue] = useState('')
  const { setUser } = useAuthStore()
  const navigate    = useNavigate()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'tutor' },
  })

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: ({ user }) => {
      setUser(user)
      const msg = IS_MOCK_MODE
        ? 'Conta demo criada! (modo offline) 🐾'
        : 'Conta criada com sucesso! Bem-vindo 🐾'
      toast.success(msg)
      navigate(user.role === 'petsitter' ? '/dashboard/petsitter/perfil' : '/buscar')
    },
    onError: () => {
      // O interceptor do Axios já exibe o toast com a mensagem exata do erro do backend
    },
  })

  const handleRoleSelect = (r: 'tutor' | 'petsitter') => {
    setRole(r)
    setValue('role', r)
  }

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <div className="card shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Criar sua conta</h2>
        <p className="text-gray-500 mt-1 text-sm">Rápido, grátis e sem complicações</p>
      </div>

      {/* Role selector */}
      <div className="mb-5">
        <p className="label text-center mb-3">Você é…</p>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map(({ value, emoji, label, desc }) => (
            <button
              key={value}
              type="button"
              id={`role-${value}`}
              onClick={() => handleRoleSelect(value)}
              className={clsx(
                'relative flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all duration-200',
                role === value
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
              )}
            >
              {role === value && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">✓</span>
                </span>
              )}
              <span className="text-3xl mb-1.5">{emoji}</span>
              <span className={clsx('font-bold text-sm', role === value ? 'text-primary-700' : 'text-gray-700')}>
                {label}
              </span>
              <span className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Nome */}
        <div>
          <label className="label" htmlFor="reg-name">Nome completo</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input id="reg-name" type="text" autoComplete="name" placeholder="Seu nome completo"
              {...register('name')}
              className={`input-field pl-10 ${errors.name ? 'ring-2 ring-red-400 border-red-300' : ''}`}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1">⚠ {errors.name.message}</p>}
        </div>

        {/* CPF */}
        <div>
          <label className="label" htmlFor="reg-cpf">CPF</label>
          <div className="relative">
            <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="reg-cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              maxLength={14}
              value={cpfValue}
              {...register('cpf')}
              onChange={e => {
                const masked = maskCPF(e.target.value)
                setCpfValue(masked)
                setValue('cpf', masked, { shouldValidate: true })
              }}
              className={`input-field pl-10 ${errors.cpf ? 'ring-2 ring-red-400 border-red-300' : ''}`}
            />
          </div>
          {errors.cpf
            ? <p className="text-xs text-red-500 mt-1">⚠ {errors.cpf.message}</p>
            : <p className="text-xs text-gray-400 mt-1">Formato: 000.000.000-00</p>
          }
        </div>

        {/* Email */}
        <div>
          <label className="label" htmlFor="reg-email">E-mail</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input id="reg-email" type="email" autoComplete="email" placeholder="seu@email.com"
              {...register('email')}
              className={`input-field pl-10 ${errors.email ? 'ring-2 ring-red-400 border-red-300' : ''}`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">⚠ {errors.email.message}</p>}
        </div>

        {/* Senha */}
        <div>
          <label className="label" htmlFor="reg-password">Senha</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input id="reg-password" type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres"
              {...register('password')}
              className={`input-field pl-10 pr-10 ${errors.password ? 'ring-2 ring-red-400 border-red-300' : ''}`}
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">⚠ {errors.password.message}</p>}
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-3 mt-2 justify-center" id="register-submit">
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Criando conta…
            </span>
          ) : (<>Criar conta gratuita <ArrowRight size={16} /></>)}
        </button>

        <p className="text-xs text-center text-gray-400 mt-1">
          Ao criar uma conta você aceita os{' '}
          <span className="text-primary-600 cursor-pointer hover:underline">Termos de Uso</span>.
        </p>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">Já tem conta?</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <Link to="/login" className="btn-outline w-full justify-center py-3">Fazer login</Link>
    </div>
  )
}
