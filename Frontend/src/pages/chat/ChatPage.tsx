import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, MessageCircle } from 'lucide-react'
import clsx from 'clsx'
import { chatService } from '@/services/chat.service'
import { ConversationListItem } from '@/components/chat/ConversationListItem'
import { ChatThread } from '@/components/chat/ChatThread'
import { Skeleton } from '@/components/ui/Skeleton'

export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('b')

  const { data: conversations, isLoading, isError } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatService.listConversations(true),
    refetchInterval: 30000,
  })

  const list = conversations ?? []
  const hasCachedList = Boolean(conversations)
  const selected = list.find((c) => c.bookingId === selectedId)

  const selectConversation = (bookingId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('b', bookingId)
      return next
    })
  }

  const backToList = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('b')
      return next
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-0 sm:px-4 py-0 sm:py-8">
      <div className="bg-white sm:rounded-2xl sm:border sm:border-stroke sm:shadow-card overflow-hidden flex h-[calc(100vh-4rem)] sm:h-[75vh]">

        {/* ── Lista de conversas ── */}
        <div
          className={clsx(
            'w-full md:w-80 flex-shrink-0 border-r border-stroke flex-col',
            selectedId ? 'hidden md:flex' : 'flex',
          )}
        >
          <div className="flex-shrink-0 px-5 py-4 border-b border-stroke">
            <h1 className="text-lg font-bold text-ink flex items-center gap-2">
              <MessageCircle size={20} className="text-primary-500" /> Mensagens
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading && (
              <div className="p-4 space-y-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isError && !hasCachedList && (
              <div className="flex flex-col items-center text-center py-12 px-6">
                <AlertCircle size={32} className="text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Não foi possível carregar suas conversas.</p>
              </div>
            )}

            {hasCachedList && (
              <>
                {isError && (
                  <div className="m-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <AlertCircle size={13} /> Sem conexão no momento — lista pode estar desatualizada.
                  </div>
                )}

                {list.length === 0 && (
                  <div className="flex flex-col items-center text-center py-16 px-6">
                    <div className="text-5xl mb-4">💬</div>
                    <h3 className="font-semibold text-gray-700 mb-1">Nenhuma conversa ainda</h3>
                    {/* Texto genérico pois a mesma tela serve tutor e petsitter */}
                    <p className="text-sm text-gray-400">
                      Quando um agendamento for aceito, a conversa aparece aqui.
                    </p>
                  </div>
                )}

                {list.map((c) => (
                  <ConversationListItem
                    key={c.bookingId}
                    conversation={c}
                    active={c.bookingId === selectedId}
                    onClick={() => selectConversation(c.bookingId)}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Thread ── */}
        <div className={clsx('flex-1 flex-col min-w-0', selectedId ? 'flex' : 'hidden md:flex')}>
          {selectedId ? (
            <ChatThread key={selectedId} bookingId={selectedId} conversation={selected} onBack={backToList} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="font-semibold text-gray-700 mb-1">Selecione uma conversa</h3>
              <p className="text-sm text-gray-400">Escolha uma conversa na lista para ver as mensagens.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
