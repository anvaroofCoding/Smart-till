import type { PaginatedResponse } from '@/types/api.types'

export interface ProductCategoryRecord {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ProductCategoriesListResponse =
  PaginatedResponse<ProductCategoryRecord>

export interface CreateProductCategoryRequest {
  name: string
  description?: string
  isActive?: boolean
}

export type UpdateProductCategoryRequest = Partial<CreateProductCategoryRequest>
