import type { PaginatedResponse } from '@/types/api.types'

export interface ProductRelation {
  id: string
  name: string
}

export interface ProductRecord {
  id: string
  name: string
  category: ProductRelation
  brand: ProductRelation
  image: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ProductsListResponse = PaginatedResponse<ProductRecord>

export interface CreateProductRequest {
  name: string
  categoryId: string
  brandId: string
  image?: string
  isActive?: boolean
}

export type UpdateProductRequest = Partial<CreateProductRequest>
