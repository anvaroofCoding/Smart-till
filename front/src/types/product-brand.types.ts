import type { PaginatedResponse } from '@/types/api.types'

export interface ProductBrandRecord {
  id: string
  name: string
  description: string
  isActive: boolean
  productsCount: number
  createdAt: string
  updatedAt: string
}

export type ProductBrandsListResponse = PaginatedResponse<ProductBrandRecord>

export interface CreateProductBrandRequest {
  name: string
  description?: string
  isActive?: boolean
}

export type UpdateProductBrandRequest = Partial<CreateProductBrandRequest>
