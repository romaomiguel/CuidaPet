import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertCircle, Lock, Send, MapPin } from 'lucide-react'
import clsx from 'clsx'
import { chatService } from '@/services/chat.service'
import { useAuthStore } from '@/store/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { Skeleton } from '@/components/ui/Skeleton'
import { LocationTrailMap } from '@/components/location/LocationTrailMap'
import {
  avatarUrl,
  bookingStatusConfig,
  canSendChatMessage,
  formatDayDivider,
  formatMessageTime,
} from '@/utils'
import { useServiceCatalog } from '@/hooks/useServiceCatalog'
import type { ChatConversation, ChatMessage } from '@/types'

interface ChatThreadProps {
  bookingId: string
  conversation?: ChatConversation
  onBack: () => void
}

type ThreadItem =
  | { kind: 'divider'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage }

function withDayDividers(messages: ChatMessage[]): ThreadItem[] {
  const items: ThreadItem[] = []
  let lastDay: string | null = null
  for (const m of messages) {
    const dayKey = new Date(m.createdAt).toDateString()
    if (dayKey !== lastDay) {
      items.push({ kind: 'divider', key: `divider-${dayKey}`, label: formatDayDivider(m.createdAt) })
      lastDay = dayKey
    }
    items.push({ kind: 'message', key: m.id, message: m })
  }
  return items
}

// Mescla o delta trazido por um poll incremental no que já temos, deduplicando por id
// (protege contra corrida entre o poll do intervalo e o invalidate do envio de mensagem
// pegando o mesmo registro duas vezes) e mantendo ordem cronológica.
function mergeMessages(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return prev
  const seen = new Set(prev.map((m) => m.id))
  const merged = prev.slice()
  for (const m of incoming) {
    if (!seen.has(m.id)) {
      seen.add(m.id)
      merged.push(m)
    }
  }
  merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  return merged
}

function MessageRow({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  if (message.isSystem) {
    return (
      <div className="flex justify-center py-2 px-6">
        <span className="badge-gray italic text-center whitespace-normal">{message.content}</span>
      </div>
    )
  }

  return (
    <div className={clsx('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 text-sm',
          isOwn
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-background text-ink rounded-bl-md',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={clsx('text-[10px] mt-1 text-right', isOwn ? 'text-primary-100' : 'text-muted')}>
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

export function ChatThread({ bookingId, conversation, onBack }: ChatThreadProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const catalog = useServiceCatalog()
  const [content, setContent] = useState('')
  const [trailOpen, setTrailOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Acumula o histórico no cliente: cada poll busca só o delta (?after= da última
  // mensagem já conhecida) e mescla no que já temos. `key={selectedId}` no ChatPage
  // remonta este componente a cada troca de conversa, então o ref sempre começa vazio
  // na conversa certa (sem vazar mensagens de uma conversa pra outra).
  const messagesRef = useRef<ChatMessage[]>([])

  const { data: messages, isLoading, isError } = useQuery({
    queryKey: ['chat', 'messages', bookingId],
    queryFn: async () => {
      const last = messagesRef.current[messagesRef.current.length - 1]
      const incoming = await chatService.listMessages(bookingId, last?.createdAt, true)
      messagesRef.current = mergeMessages(messagesRef.current, incoming)
      return messagesRef.current
    },
    refetchInterval: 4000,
  })

  const markReadMutation = useMutation({
    mutationFn: () => chatService.markRead(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] })
    },
  })

  // Marca como lida sempre que a conversa aberta muda — cobre o histórico inteiro na
  // abertura (não só a última mensagem), então independe de quem mandou a mensagem mais
  // recente.
  useEffect(() => {
    markReadMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  // Com a conversa já aberta, uma mensagem nova do outro lado chega via poll — sem isso,
  // ela ficaria contando como não lida no badge mesmo com o usuário olhando pra ela. Só
  // dispara quando o delta trazido por mergeMessages inclui algo que não fomos nós que
  // mandamos (senderId nulo = sistema, também conta como não lida pro backend).
  const prevMessageCountRef = useRef(0)
  useEffect(() => {
    if (!messages) return
    const prevCount = prevMessageCountRef.current
    prevMessageCountRef.current = messages.length
    if (prevCount === 0) return // carga inicial: já coberta pelo efeito de abertura acima
    const newMessages = messages.slice(prevCount)
    if (newMessages.some((m) => m.senderId !== user?.id)) {
      markReadMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages?.length, bookingId])

  const sendMutation = useMutation({
    mutationFn: (text: string) => chatService.sendMessage(bookingId, text),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', bookingId] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
  })

  const isOpen = conversation ? canSendChatMessage(conversation.status, conversation.completedAt) : false
  const canType = Boolean(conversation) && isOpen

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || sendMutation.isPending || !canType) return
    sendMutation.mutate(trimmed)
  }

  const items = messages ? withDayDividers(messages) : []
  const hasCachedMessages = Boolean(messages)

  return (
    <>
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-stroke">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-muted hover:bg-background transition-colors flex-shrink-0"
          aria-label="Voltar para a lista de conversas"
        >
          <ArrowLeft size={18} />
        </button>
        {conversation ? (
          <>
            <img
              src={avatarUrl(conversation.otherUser.name, conversation.otherUser.avatarUrl ?? undefined)}
              alt={conversation.otherUser.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-100 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink truncate text-sm">
                {catalog.label(conversation.service)} — {conversation.otherUser.name}
              </p>
              <span className={clsx('badge', bookingStatusConfig[conversation.status].badgeClass)}>
                {bookingStatusConfig[conversation.status].label}
              </span>
            </div>
            {user?.role === 'tutor' && (
              <button
                onClick={() => setTrailOpen(true)}
                className="p-2 -mr-1 rounded-lg text-muted hover:bg-background hover:text-primary-600 transition-colors flex-shrink-0"
                aria-label="Ver trajeto do passeio"
                title="Ver trajeto do passeio"
              >
                <MapPin size={18} />
              </button>
            )}
          </>
        ) : (
          <div className="flex-1 space-y-1.5 py-0.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-16" />
          </div>
        )}
      </header>

      {/* ── Mensagens ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-5 py-4 space-y-1">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {isError && !hasCachedMessages && (
          <div className="flex flex-col items-center text-center py-10 px-6">
            <AlertCircle size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Não foi possível carregar as mensagens.</p>
          </div>
        )}

        {!isLoading && hasCachedMessages && (
          <>
            {isError && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-2">
                <AlertCircle size={13} /> Sem conexão no momento — mostrando as últimas mensagens carregadas.
              </div>
            )}
            {items.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">Nenhuma mensagem ainda. Diga oi! 👋</p>
            ) : (
              items.map((item) =>
                item.kind === 'divider' ? (
                  <div key={item.key} className="flex justify-center py-3">
                    <span className="badge-gray">{item.label}</span>
                  </div>
                ) : (
                  <MessageRow key={item.key} message={item.message} isOwn={item.message.senderId === user?.id} />
                ),
              )
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 border-t border-stroke px-4 sm:px-5 py-3">
        {conversation && !isOpen && (
          <div className="mb-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <Lock size={13} />
            Esta conversa foi encerrada. Você ainda pode ver o histórico, mas não é mais possível enviar mensagens.
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            disabled={!canType || sendMutation.isPending}
            rows={1}
            maxLength={2000}
            placeholder={canType ? 'Escreva uma mensagem…' : 'Conversa encerrada'}
            className="input-field resize-none flex-1 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!canType || !content.trim() || sendMutation.isPending}
            className="btn-primary !px-3.5 !py-3 flex-shrink-0"
            aria-label="Enviar mensagem"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {conversation && user?.role === 'tutor' && (
        <LocationTrailMap
          isOpen={trailOpen}
          onClose={() => setTrailOpen(false)}
          bookingId={bookingId}
        />
      )}
    </>
  )
}
