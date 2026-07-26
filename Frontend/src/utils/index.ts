import type { BookingStatus, ServiceType } from '@/types'

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export const serviceLabels: Record<ServiceType, string> = {
  hospedagem: 'Hospedagem',
  passeio: 'Passeio',
  adestramento: 'Adestramento',
  banho_e_tosa: 'Banho & Tosa',
  visita: 'Visita Domiciliar',
  creche: 'Creche',
}

export const speciesLabels: Record<string, string> = {
  cachorro: '🐶 Cachorro',
  gato: '🐱 Gato',
  ave: '🐦 Ave',
  roedor: '🐭 Roedor',
  reptil: '🦎 Réptil',
  outro: '🐾 Outro',
}

export const bookingStatusConfig: Record<
  BookingStatus,
  { label: string; badgeClass: string }
> = {
  pending:   { label: 'Pendente',   badgeClass: 'badge-yellow' },
  accepted:  { label: 'Aceito',     badgeClass: 'badge-green'  },
  declined:  { label: 'Recusado',   badgeClass: 'badge-red'    },
  cancelled: { label: 'Cancelado',  badgeClass: 'badge-red'    },
  completed: { label: 'Concluído',  badgeClass: 'badge-blue'   },
}

/** Aplica máscara (00) 00000-0000 conforme o usuário digita */
export function maskPhone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  return nums
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function avatarUrl(name: string, photo?: string): string {
  if (photo) return photo
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4CAF50&color=fff&bold=true&format=svg`
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

/** Divisor de data na thread: "Hoje", "Ontem", ou a data por extenso (com ano só se != atual). */
export function formatDayDivider(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()

  if (isSameCalendarDay(d, now)) return 'Hoje'

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameCalendarDay(d, yesterday)) return 'Ontem'

  const sameYear = d.getFullYear() === now.getFullYear()
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(d)
}

/** Horário da bolha de mensagem — "14:32". */
export function formatMessageTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

/** Timestamp curto pra prévia na lista de conversas: "agora", "5 min", "14:32", "ontem", "19/07/2026". */
export function formatConversationTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin} min`
  if (isSameCalendarDay(d, now)) return formatMessageTime(d)

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameCalendarDay(d, yesterday)) return 'ontem'

  return formatDateShort(d)
}

const CHAT_CLOSE_WINDOW_MS = 48 * 60 * 60 * 1000

/** Espelha ChatService.canSend do backend — só pra decidir a UI (input habilitado/aviso de
 * encerrada) sem esperar uma tentativa de envio falhar. O backend é sempre a autoridade real. */
export function canSendChatMessage(status: BookingStatus, completedAt: string | null): boolean {
  if (status === 'accepted') return true
  if (status === 'completed' && completedAt) {
    return Date.now() - new Date(completedAt).getTime() < CHAT_CLOSE_WINDOW_MS
  }
  return false
}
