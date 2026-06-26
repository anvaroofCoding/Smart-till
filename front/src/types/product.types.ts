import type { PaginatedResponse } from '@/types/api.types'

export interface ProductRelation {
  id: string
  name: string
}

export interface ProductRecord {
  id: string
  name: string
  code: string
  barcode?: string
  barcodes?: string[]
  description: string
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
  description?: string
  categoryId: string
  brandId: string
  image?: string
  isActive?: boolean
}

export type UpdateProductRequest = Partial<CreateProductRequest>

export interface ProductBarcodeRecord {
  id: string
  productId: string
  value: string
  source: 'system' | 'manual'
  isPrimary: boolean
  createdAt: string
}

export interface CreateProductBarcodeRequest {
  value: string
}
