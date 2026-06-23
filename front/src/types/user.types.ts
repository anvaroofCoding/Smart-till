import type { PaginatedMeta, UserPosition } from '@/types/api.types'

export interface UserRecord {
  id: string
  firstName: string
  lastName: string
  login: string
  email: string
  phone: string
  age: number
  birthDate?: string
  position: UserPosition
  allowedPages: string[]
  avatar: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UsersListResponse {
  data: UserRecord[]
  meta: PaginatedMeta
}

export interface UsersStats {
  total: number
  active: number
  inactive: number
  profileAccessLevel: number
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  login: string
  password: string
  phone?: string
  birthDate?: string
  position: UserPosition
  allowedPages?: string[]
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  login?: string
  password?: string
  phone?: string
  birthDate?: string
  position?: UserPosition
  allowedPages?: string[]
  isActive?: boolean
}

export const POSITION_LABELS: Record<UserPosition, string> = {
  admin: 'Administrator',
  kassir: 'Kassir',
  omborchi: 'Omborchi',
  menejer: 'Menejer',
  sotuvchi: 'Sotuvchi',
}
