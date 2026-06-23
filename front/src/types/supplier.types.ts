import type { PaginatedResponse } from '@/types/api.types'
import type { SupplierCurrency } from '@/lib/currency'

export interface SupplierRecord {
  id: string
  name: string
  officialName: string
  phone: string
  address: string
  comment: string
  currency: SupplierCurrency
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type SuppliersListResponse = PaginatedResponse<SupplierRecord>

export interface CreateSupplierRequest {
  name: string
  officialName?: string
  phone?: string
  address?: string
  comment?: string
  currency?: SupplierCurrency
  isActive?: boolean
}

export type UpdateSupplierRequest = Partial<CreateSupplierRequest>
