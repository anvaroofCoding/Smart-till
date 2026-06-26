import type { PaginatedResponse } from '@/types/api.types'

export interface WarehouseRecord {
  id: string
  name: string
  address: string
  description: string
  isActive: boolean
  dailySalesPlan: number
  createdAt: string
  updatedAt: string
}

export type WarehousesListResponse = PaginatedResponse<WarehouseRecord>

export interface CreateWarehouseRequest {
  name: string
  address?: string
  description?: string
  isActive?: boolean
  dailySalesPlan?: number
}

export type UpdateWarehouseRequest = Partial<CreateWarehouseRequest>
