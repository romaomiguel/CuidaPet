import clsx from 'clsx'
import { avatarUrl, formatConversationTime } from '@/utils'
import { useServiceCatalog } from '@/hooks/useServiceCatalog'
import type { ChatConversation } from '@/types'

interface ConversationListItemProps {
  conversation: ChatConversation
  active: boolean
  onClick: () => void
}

export function ConversationListItem({ conversation, active, onClick }: ConversationListItemProps) {
  const catalog = useServiceCatalog()
  const { otherUser, service, lastMessage, unreadCount, updatedAt, status } = conversation
  const hasUnread = unreadCount > 0
  const isClosed = status === 'cancelled' || status === 'declined'

  const preview = lastMessage ? lastMessage.content : 'Nenhuma mensagem ainda'

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-stroke/60 transition-colors',
        active ? 'bg-primary-50' : 'hover:bg-background',
      )}
    >
      <img
        src={avatarUrl(otherUser.name, otherUser.avatarUrl ?? undefined)}
        alt={otherUser.name}
        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-2 ring-gray-100"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink truncate">
            {catalog.label(service)} — {otherUser.name}
          </p>
          <span className="text-[11px] text-muted flex-shrink-0">{formatConversationTime(updatedAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={clsx('text-xs truncate', hasUnread ? 'text-ink font-medium' : 'text-muted')}>
            {isClosed && <span className="text-muted">Encerrada · </span>}
            {preview}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
