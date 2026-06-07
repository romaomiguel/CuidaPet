// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'tutor' | 'petsitter' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  cpf?: string
  avatar?: string
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
  cpf: string
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
  identityProof?: string
  addressProof?: string
  acceptedSpecies?: PetSpecies[]
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
  review?: Review
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
  createdAt: string
}

export interface ReviewPayload {
  bookingId: string
  rating: number
  comment?: string
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
