// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'tutor' | 'petsitter' | 'admin' | 'partner'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  cpf?: string
  bio?: string
  avatar?: string
  /** Signed URL (curta duração) pra exibir o avatar — computada pelo backend a cada
   * resposta; `avatar` é só o path interno no Storage, não é diretamente renderizável. */
  avatarUrl?: string | null
  role: UserRole
  isActive?: boolean
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: UserRole
  cpf?: string
  phone?: string
}

export interface AuthResponse {
  user: User
  access_token: string
}

// ─── Petsitter ────────────────────────────────────────────────────────────────
export type ServiceType =
  | 'hospedagem'
  | 'passeio'
  | 'adestramento'
  | 'banho_e_tosa'
  | 'visita'
  | 'creche'

export interface PetsitterProfile {
  id: string
  userId: string
  user: User
  bio: string
  services: ServiceType[]
  pricePerHour: number
  location: string
  city: string
  state: string
  rating: number
  totalReviews: number
  scheduleConfig?: Record<string, { enabled: boolean; start?: string; end?: string }>
  isAvailable: boolean
  photos: string[]
  pricingConfig?: Record<ServiceType, { type: 'fixed' | 'per_hour'; price: number }>
  capacityPerDay: number
  status: 'pending' | 'approved' | 'rejected'
  /** Path interno no Storage (não é URL renderizável) — presença indica que o
   * documento foi enviado. Pra visualizar, buscar signed URL via petsitterService. */
  identityProof?: string
  addressProof?: string
  acceptedSpecies?: PetSpecies[]
  offersLocationSharing: boolean
  hasAirConditioning: boolean
  homeType: 'casa' | 'apartamento' | null
  hasBackyard: boolean
  walkSchedule: 'manha' | 'noite' | null
}

/**
 * Shape devolvido por `GET /petsitters/admin/list` (admin only). Não é uma URL/path de
 * documento — só um indicador booleano de presença, pra decidir se mostra o botão
 * "ver documento" sem expor path nenhum na listagem.
 */
export type AdminPetsitterProfile = Omit<PetsitterProfile, 'identityProof' | 'addressProof'> & {
  hasIdentityProof: boolean
  hasAddressProof: boolean
}

export interface PetsitterFilters {
  search?: string
  service?: ServiceType | ''
  city?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  availability?: string
}

// ─── Partner (B2B) ─────────────────────────────────────────────────────────────
export type PartnerType = 'clinica' | 'petshop'

export interface PartnerProfile {
  id: string
  userId: string
  user: { name: string; email: string; isActive: boolean }
  type: PartnerType
  businessName: string
  cnpj?: string
  address: string
  city: string
  state: string
  servicesOffered: ServiceType[]
  createdAt: string
}

export interface CreatePartnerPayload {
  name: string
  email: string
  password: string
  type: PartnerType
  businessName: string
  cnpj?: string
  address: string
  city: string
  state: string
  servicesOffered?: ServiceType[]
}

export interface UpdatePartnerPayload {
  businessName?: string
  address?: string
  city?: string
  state?: string
  servicesOffered?: ServiceType[]
}

// ─── Pet ──────────────────────────────────────────────────────────────────────
export type PetSpecies = 'cachorro' | 'gato' | 'ave' | 'roedor' | 'reptil' | 'outro'

export interface Pet {
  id: string
  tutorId: string
  name: string
  species: PetSpecies
  breed?: string
  age: number
  weight?: number
  notes?: string
  energyLevel?: 'baixo' | 'medio' | 'alto'
  socialLevel?: 'exclusivo' | 'sociavel'
  medicalRestrictions?: string
  feedingInstructions?: string
  photo?: string
  createdAt: string
}

export interface PetPayload {
  name: string
  species: PetSpecies
  breed?: string
  age: number
  weight?: number
  notes?: string
  energyLevel?: 'baixo' | 'medio' | 'alto'
  socialLevel?: 'exclusivo' | 'sociavel'
  medicalRestrictions?: string
  feedingInstructions?: string
  photo?: string
}

// ─── Booking ──────────────────────────────────────────────────────────────────
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'

export interface Booking {
  id: string
  tutorId: string
  petsitterId: string
  pets: Pet[]
  petsitter: PetsitterProfile
  tutor: User
  service: ServiceType
  startDate: string
  endDate: string
  status: BookingStatus
  totalPrice: number
  notes?: string
  createdAt: string
  /** Presença indica que o booking já foi avaliado — GET /bookings inclui só id/rating/tags,
   * nunca o objeto Review inteiro (comentário etc. não são necessários pra essa tela). */
  review?: { id: string; rating: number; tags: string[] } | null
}

export interface BookingPayload {
  petsitterId: string
  petIds: string[]
  service: ServiceType
  startDate: string
  endDate: string
  notes?: string
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string
  bookingId: string
  tutorId: string
  petsitterId: string
  tutor: User
  rating: number
  comment?: string
  tags: string[]
  createdAt: string
}

export interface ReviewPayload {
  bookingId: string
  petsitterId: string
  rating: number
  comment?: string
  tags?: string[]
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  senderId: string | null
  isSystem: boolean
  content: string
  createdAt: string
  readAt: string | null
}

export interface ChatConversation {
  bookingId: string
  service: ServiceType
  status: BookingStatus
  /** Necessário pra calcular no cliente se o chat ainda está na janela de envio (mesma
   * regra do backend: accepted, ou completed há menos de 48h). Null se nunca foi concluído. */
  completedAt: string | null
  otherUser: {
    id: string
    name: string
    avatarUrl: string | null
  }
  lastMessage: {
    content: string
    createdAt: string
    senderId: string | null
    isSystem: boolean
  } | null
  unreadCount: number
  updatedAt: string
}

// ─── Localização (check-in manual) ─────────────────────────────────────────────
export interface LocationCheckIn {
  id: string
  bookingId: string
  latitude: number
  longitude: number
  createdAt: string
}

// ─── Central de Ajuda — mensagens de suporte ───────────────────────────────────
export interface SupportMessage {
  id: string
  name: string
  email: string
  contact?: string
  question: string
  resolved: boolean
  createdAt: string
}

export interface SupportMessagePayload {
  name: string
  email: string
  contact?: string
  question: string
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── API Error ────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}
