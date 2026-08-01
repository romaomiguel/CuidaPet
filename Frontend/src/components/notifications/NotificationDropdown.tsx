import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, MessageCircle, CalendarClock, BellOff } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { bookingService } from '@/services/booking.service'
import { chatService }    from '@/services/chat.service'
import { avatarUrl, formatConversationTime } from '@/utils'
import { useServiceCatalog } from '@/hooks/useServiceCatalog'
import clsx from 'clsx'

type NotificationItem = {
  id: string
  icon: React.ReactNode
  avatar: string
  title: string
  subtitle: string
  time: string
  to: string
}

export function NotificationDropdown() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const catalog = useServiceCatalog()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isPetsitter = user?.role === 'petsitter'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: conversations = [] } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn:  () => chatService.listConversations(true),
    refetchInterval: 30000,
  })

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings'],
    queryFn:  bookingService.list,
    enabled:  isPetsitter,
    refetchInterval: 30000,
  })

  const chatItems: NotificationItem[] = conversations
    .filter(c => c.unreadCount > 0)
    .map(c => ({
      id: `chat-${c.bookingId}`,
      icon: <MessageCircle size={13} className="text-primary-500" />,
      avatar: avatarUrl(c.otherUser.name, c.otherUser.avatarUrl ?? undefined),
      title: c.otherUser.name,
      subtitle: c.lastMessage?.isSystem ? c.lastMessage.content : (c.lastMessage?.content ?? 'Nova mensagem'),
      time: c.updatedAt,
      // Tutor e petsitter têm o chat embutido na aba "Mensagens" do respectivo hub de conta.
      to: isPetsitter ? '/dashboard/petsitter?tab=mensagens' : '/conta?tab=mensagens',
    }))

  const bookingItems: NotificationItem[] = isPetsitter
    ? (bookingsData?.data ?? [])
        .filter(b => b.status === 'pending')
        .map(b => ({
          id: `booking-${b.id}`,
          icon: <CalendarClock size={13} className="text-amber-500" />,
          avatar: avatarUrl(b.tutor?.name ?? 'T', b.tutor?.avatarUrl ?? undefined),
          title: b.tutor?.name ?? 'Novo tutor',
          subtitle: `Nova solicitação de ${catalog.label(b.service)}`,
          time: b.createdAt,
          to: '/dashboard/petsitter?tab=pendentes',
        }))
    : []

  const items = [...chatItems, ...bookingItems]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)

  const totalCount = chatItems.length + bookingItems.length

  const handleItemClick = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl text-muted hover:text-primary-600 hover:bg-background transition-all"
        aria-label="Notificações"
      >
        <Bell size={19} />
        {totalCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-secondary-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-card-hover border border-stroke py-2 animate-scale-in z-50">
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="font-semibold text-ink text-sm">Notificações</p>
            {totalCount > 0 && <span className="badge badge-blue">{totalCount} nova{totalCount > 1 ? 's' : ''}</span>}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8 px-4">
                <BellOff size={28} className="text-stroke mb-2" />
                <p className="text-sm text-muted">Nenhuma notificação por aqui</p>
              </div>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.to)}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-background transition-colors text-left"
                >
                  <img src={item.avatar} alt={item.title} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.icon}
                      <p className="text-sm font-semibold text-ink truncate">{item.title}</p>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <span className={clsx('text-[11px] text-muted flex-shrink-0 mt-0.5')}>
                    {formatConversationTime(item.time)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
