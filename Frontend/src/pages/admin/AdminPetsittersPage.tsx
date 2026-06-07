import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, FileText, User as UserIcon, Clock } from 'lucide-react'
import { petsitterService } from '@/services/petsitter.service'
import type { PetsitterProfile } from '@/types'
import { avatarUrl } from '@/utils'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export function AdminPetsittersPage() {
  const [profiles, setProfiles] = useState<PetsitterProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      // adminListPending na verdade retorna todos no service atual
      const response = await petsitterService.adminListPending()
      setProfiles(response.data)
    } catch (error) {
      console.error('Erro ao buscar petsitters', error)
      toast.error('Erro ao buscar petsitters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    if (!window.confirm(`Tem certeza que deseja ${action === 'approved' ? 'aprovar' : 'rejeitar'} este perfil?`)) return
    
    try {
      const updated = await petsitterService.changeStatus(id, action)
      setProfiles(prev => prev.map(p => p.id === id ? updated : p))
      toast.success(`Perfil ${action === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao alterar status', error)
      toast.error('Erro ao processar a ação. Tente novamente.')
    }
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Petsitters</h1>
        <p className="text-gray-500 mt-2">Analise os documentos e aprove ou rejeite cadastros.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando perfis...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum petsitter encontrado</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={avatarUrl(profile.user?.name || 'User', profile.user?.avatar)} 
                      alt={profile.user?.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate" title={profile.user?.name}>
                        {profile.user?.name || 'Usuário'}
                      </h3>
                      <p className="text-xs text-gray-500">{profile.city} - {profile.state}</p>
                    </div>
                  </div>
                  <span className={clsx(
                    'inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md uppercase',
                    profile.status === 'approved' ? 'bg-green-50 text-green-700' :
                    profile.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  )}>
                    {profile.status === 'approved' && <CheckCircle size={12} />}
                    {profile.status === 'rejected' && <XCircle size={12} />}
                    {profile.status === 'pending' && <Clock size={12} />}
                    {profile.status}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3" title={profile.bio}>{profile.bio}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Documentos Anexados</h4>
                    <div className="space-y-2">
                      {profile.identityProof ? (
                        <a href={profile.identityProof} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-2 rounded-lg">
                          <FileText size={16} /> RG/CPF Enviado
                        </a>
                      ) : (
                        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">RG/CPF pendente</p>
                      )}
                      
                      {profile.addressProof ? (
                        <a href={profile.addressProof} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-2 rounded-lg">
                          <FileText size={16} /> Comp. Residência Enviado
                        </a>
                      ) : (
                        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">Comp. Residência pendente</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {profile.status === 'pending' && (
                <div className="flex items-center gap-3 p-4 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => handleAction(profile.id, 'rejected')}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
                  >
                    <XCircle size={18} /> Rejeitar
                  </button>
                  <button
                    onClick={() => handleAction(profile.id, 'approved')}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium shadow-sm"
                  >
                    <CheckCircle size={18} /> Aprovar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
