import type { BookingStatus, ServiceType } from '@/types'

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

export function avatarUrl(name: string, photo?: string): string {
  if (photo) return photo
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4CAF50&color=fff&bold=true&format=svg`
}
