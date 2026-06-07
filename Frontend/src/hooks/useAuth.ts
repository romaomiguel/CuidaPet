import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import type { LoginPayload, RegisterPayload } from '@/types'

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch current user on mount
  const { isLoading: isFetching } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
    meta: { silent: true },
    select: (data) => {
      setUser(data)
      return data
    },
  })

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: ({ user }) => {
      setUser(user)
      toast.success(`Bem-vindo, ${user.name}!`)
      navigate(user.role === 'petsitter' ? '/dashboard/petsitter' : '/dashboard')
    },
    onError: () => {
      // Error handled by interceptor
    },
  })

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: ({ user }) => {
      setUser(user)
      toast.success('Conta criada com sucesso!')
      navigate(user.role === 'petsitter' ? '/dashboard/petsitter' : '/dashboard')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      storeLogout()
      queryClient.clear()
      navigate('/login')
      toast.success('Até logo!')
    },
  })

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isFetching,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  }
}
