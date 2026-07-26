import { useState, useEffect } from 'react'
import { CheckCircle, RotateCcw, MessageCircle } from 'lucide-react'
import { supportMessageService } from '@/services/supportMessage.service'
import type { SupportMessage } from '@/types'
import { formatDateShort } from '@/utils'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export function AdminSupportMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const data = await supportMessageService.findAll()
      setMessages(data)
    } catch (error) {
      console.error('Erro ao buscar mensagens de suporte', error)
      toast.error('Erro ao buscar mensagens de suporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleToggleResolved = async (id: string, resolved: boolean) => {
    try {
      const updated = await supportMessageService.setResolved(id, resolved)
      setMessages(prev => prev.map(m => m.id === id ? updated : m))
      toast.success(resolved ? 'Mensagem marcada como resolvida!' : 'Mensagem reaberta.')
    } catch (error) {
      console.error('Erro ao atualizar mensagem', error)
      toast.error('Erro ao processar a ação.')
    }
  }

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mensagens de Suporte</h1>
        <p className="text-gray-500 mt-2">
          Mensagens enviadas pelo formulário "Falar com o suporte" da Central de Ajuda. Responda pelo e-mail informado.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando mensagens...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhuma mensagem recebida ainda</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Pergunta</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(message => (
                  <tr key={message.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{message.name}</p>
                      <p className="text-xs text-gray-500">{message.email}</p>
                      {message.contact && <p className="text-xs text-gray-500">{message.contact}</p>}
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <p className="text-gray-700 whitespace-pre-line">{message.question}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDateShort(message.createdAt)}</td>
                    <td className="px-6 py-4">
                      {message.resolved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                          <CheckCircle size={12} /> Resolvida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleResolved(message.id, !message.resolved)}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                          message.resolved
                            ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                            : 'text-green-600 bg-green-50 hover:bg-green-100',
                        )}
                      >
                        {message.resolved ? <><RotateCcw size={14} /> Reabrir</> : <><CheckCircle size={14} /> Marcar como resolvida</>}
                      </button>
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
