import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, User as UserIcon, AlertCircle, ShieldAlert } from 'lucide-react'
import { userService } from '@/services/user.service'
import type { User } from '@/types'
import { avatarUrl } from '@/utils'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await userService.findAll()
      setUsers(data)
    } catch (error) {
      console.error('Erro ao buscar usuários', error)
      toast.error('Erro ao buscar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleStatusChange = async (id: string, isActive: boolean) => {
    const actionName = isActive ? 'ativar' : 'suspender'
    if (!window.confirm(`Tem certeza que deseja ${actionName} este usuário?`)) return
    
    try {
      const updatedUser = await userService.changeStatus(id, isActive)
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u))
      toast.success(`Usuário ${isActive ? 'ativado' : 'suspenso'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao alterar status', error)
      toast.error('Erro ao processar a ação.')
    }
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <p className="text-gray-500 mt-2">Visualize e gerencie todos os usuários da plataforma.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando usuários...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum usuário encontrado</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={avatarUrl(user.name, user.avatarUrl ?? undefined)}
                          alt={user.name} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
                        user.role === 'admin' ? 'bg-red-50 text-red-700' :
                        user.role === 'petsitter' ? 'bg-secondary-50 text-secondary-700' :
                        'bg-primary-50 text-primary-700'
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                          <CheckCircle size={12} /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                          <XCircle size={12} /> Suspenso
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleStatusChange(user.id, !user.isActive)}
                          className={clsx(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                            user.isActive 
                              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                              : 'text-green-600 bg-green-50 hover:bg-green-100'
                          )}
                        >
                          {user.isActive ? <><ShieldAlert size={14} /> Suspender</> : <><CheckCircle size={14} /> Reativar</>}
                        </button>
                      )}
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
