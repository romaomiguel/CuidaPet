import { useState, useEffect } from 'react'
import { Users, PawPrint, Clock, Activity, ArrowRight, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { userService } from '@/services/user.service'
import { petsitterService } from '@/services/petsitter.service'
import toast from 'react-hot-toast'

export function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalPetsitters: 0,
    pendingPetsitters: 0,
    approvedPetsitters: 0,
    rejectedPetsitters: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [users, petsittersResponse] = await Promise.all([
        userService.findAll(),
        petsitterService.adminListPending()
      ])

      const petsitters = petsittersResponse.data

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive !== false).length,
        suspendedUsers: users.filter(u => u.isActive === false).length,
        totalPetsitters: petsitters.length,
        pendingPetsitters: petsitters.filter(p => p.status === 'pending').length,
        approvedPetsitters: petsitters.filter(p => p.status === 'approved').length,
        rejectedPetsitters: petsitters.filter(p => p.status === 'rejected').length,
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas', error)
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500 mt-2">Visão geral do sistema CuidaPet.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 animate-pulse">
          Carregando dados...
        </div>
      ) : (
        <>
          {/* Alerta de Pendências */}
          {stats.pendingPetsitters > 0 && (
            <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3">
              <AlertCircle size={20} className="flex-shrink-0 text-amber-500" />
              <div>
                <span className="font-semibold">Ação necessária:</span>{' '}
                {stats.pendingPetsitters} petsitter{stats.pendingPetsitters > 1 ? 's aguardam' : ' aguarda'} aprovação de documentos.{' '}
                <Link to="/admin/petsitters" className="underline font-medium hover:text-amber-900">
                  Revisar agora →
                </Link>
              </div>
            </div>
          )}

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500 mt-0.5">Total Usuários</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <Activity size={20} />
                </div>
                {stats.suspendedUsers > 0 && (
                  <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {stats.suspendedUsers} suspenso{stats.suspendedUsers > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              <p className="text-sm text-gray-500 mt-0.5">Usuários Ativos</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <PawPrint size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedPetsitters}</p>
              <p className="text-sm text-gray-500 mt-0.5">Petsitters Aprovados</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Clock size={20} />
                </div>
                {stats.pendingPetsitters > 0 && (
                  <span className="text-xs font-bold bg-amber-400 text-white px-2 py-0.5 rounded-full animate-pulse">
                    {stats.pendingPetsitters} novo{stats.pendingPetsitters > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingPetsitters}</p>
              <p className="text-sm text-gray-500 mt-0.5">Aprovações Pendentes</p>
            </div>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Users size={18} className="text-primary-500" /> Gerenciar Usuários
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Visualize todos os usuários. Suspenda contas que violem os termos de uso ou reative contas suspentas.
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span> {stats.activeUsers} ativos
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> {stats.suspendedUsers} suspensos
                </span>
              </div>
              <Link to="/admin/users" className="btn-outline flex items-center justify-center gap-2 w-full">
                Ver Usuários <ArrowRight size={16} />
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <PawPrint size={18} className="text-primary-500" /> Gerenciar Petsitters
                </h3>
                {stats.pendingPetsitters > 0 && (
                  <span className="text-xs font-bold bg-amber-400 text-white px-2.5 py-1 rounded-full">
                    {stats.pendingPetsitters} pendente{stats.pendingPetsitters > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Analise documentos e aprove ou rejeite cadastros de novos petsitters.
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span> {stats.approvedPetsitters} aprovados
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> {stats.pendingPetsitters} pendentes
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> {stats.rejectedPetsitters} rejeitados
                </span>
              </div>
              <Link
                to="/admin/petsitters"
                className={`flex items-center justify-center gap-2 w-full ${stats.pendingPetsitters > 0 ? 'btn-primary' : 'btn-outline'}`}
              >
                Analisar Documentos <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
