export type UserRole = 'admin' | 'scanner' | 'driver'

export type UserPosition =
  | 'admin'
  | 'kassir'
  | 'omborchi'
  | 'menejer'
  | 'sotuvchi'

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiErrorBody {
  status?: number
  statusCode?: number
  message: string | string[]
  error?: string
}

export interface PaginatedMeta {
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginatedMeta
}

export interface AuthTokens {
  accessToken: string
  tokenType: string
  expiresIn: string
}

export interface AuthUser {
  id: string
  email: string
  login: string
  firstName: string
  lastName: string
  fullName: string
  role: UserRole
  position: UserPosition
  phone: string
  birthDate?: string
  allowedPages: string[]
}

export interface LoginRequest {
  login: string
  password: string
}

export interface LoginResponse {
  tokens: AuthTokens
  user: AuthUser
}

export interface MeResponse {
  user: AuthUser
}

export interface InventoryItem {
  id: string
  sku: string
  name: string
  quantity: number
  location: string
  updatedAt: string
}

export interface InventorySummary {
  warehouseId: string
  totalItems: number
  totalQuantity: number
  lowStockCount: number
  items: InventoryItem[]
}
