import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Mail, Lock, LogIn, Heart } from 'lucide-react'
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
    <div className="w-full max-w-[1000px] bg-white rounded-[2rem] shadow-xl flex flex-col md:flex-row overflow-hidden">

      {/* ── Painel esquerdo: foto + boas-vindas ── */}
      <div className="hidden md:block md:w-1/2 relative bg-primary-800">
        <img
          src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=800"
          alt="Cachorro e gato juntos"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-800/90 to-primary-800/20" />
        <div className="relative z-10 h-full flex flex-col justify-end p-10">
          <Heart size={40} className="text-secondary-500 mb-3" fill="currentColor" />
          <h2 className="font-heading text-3xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Seu pet sentiu sua falta. Acesse sua conta para continuar cuidando de quem você ama.
          </p>
        </div>
      </div>

      {/* ── Painel direito: formulário ── */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-extrabold text-ink mb-1">Login</h1>
          <p className="text-muted">Insira seus dados para acessar sua conta PetUno.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {/* Email */}
          <div>
            <label className="label" htmlFor="login-email">E-mail</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register('email')}
                className={`input-field pl-11 ${errors.email ? 'ring-2 ring-error-100 border-error-500' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.email.message}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <label className="label mb-0" htmlFor="login-password">Senha</label>
              <span className="text-xs font-semibold text-primary-600 cursor-pointer hover:text-primary-800 hover:underline">
                Esqueci minha senha
              </span>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className={`input-field pl-11 pr-11 ${errors.password ? 'ring-2 ring-error-100 border-error-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary-600 transition-colors"
                tabIndex={-1}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-error-500 mt-1 ml-4">⚠ {errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary w-full py-3.5 mt-2 justify-center text-base"
            id="login-submit"
          >
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando…
              </span>
            ) : (
              <>Entrar <LogIn size={18} /></>
            )}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-7">
          <div className="flex-1 h-px bg-stroke" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Ou acesse com</span>
          <div className="flex-1 h-px bg-stroke" />
        </div>

        {/* Login social (decorativo) */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => toast('Login social em breve! 🐾')}
            className="flex-1 h-12 rounded-pill flex items-center justify-center gap-2 border-2 border-stroke text-sm font-semibold text-ink hover:bg-background transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => toast('Login social em breve! 🐾')}
            className="flex-1 h-12 rounded-pill flex items-center justify-center gap-2 bg-[#1877F2]/10 text-[#1877F2] text-sm font-semibold hover:bg-[#1877F2]/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>
        </div>

        <p className="text-center text-sm text-muted mt-7">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-primary-600 hover:text-primary-800 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
