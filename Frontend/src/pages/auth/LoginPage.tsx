import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { authService }  from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const { setUser } = useAuthStore()
  const navigate    = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: ({ user }) => {
      setUser(user)
      toast.success(`Bem-vindo, ${user.name.split(' ')[0]}! 🐾`)
      if (user.role === 'admin') {
        navigate('/admin')
      } else if (user.role === 'petsitter') {
        navigate('/dashboard/petsitter/perfil')
      } else {
        navigate('/buscar')
      }
    },
    onError: () => {
      // O interceptor do Axios já exibe o toast com a mensagem exata do erro do backend
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <div className="card shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta!</h2>
        <p className="text-gray-500 mt-1.5 text-sm">Entre para continuar cuidando do seu pet</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="label" htmlFor="login-email">E-mail</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              {...register('email')}
              className={`input-field pl-10 ${errors.email ? 'ring-2 ring-red-400 border-red-300' : ''}`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              ⚠ {errors.email.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0" htmlFor="login-password">Senha</label>
            <span className="text-xs text-primary-600 cursor-pointer hover:underline">
              Esqueceu a senha?
            </span>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className={`input-field pl-10 pr-10 ${errors.password ? 'ring-2 ring-red-400 border-red-300' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              ⚠ {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary w-full py-3 mt-2 justify-center"
          id="login-submit"
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Entrando…
            </span>
          ) : (
            <>Entrar <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      {/* Divisor */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">Novo no CuidaPet?</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <Link
        to="/cadastro"
        className="btn-outline w-full justify-center py-3"
      >
        Criar conta gratuita
      </Link>
    </div>
  )
}
