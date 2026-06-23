import type { PaginatedResponse } from '@/types/api.types'
import type {
  ReceiptPaymentType,
  ReceiptStatus,
} from '@/lib/stock-receipt'

export interface StockReceiptRelation {
  id: string
  name: string
}

export interface StockReceiptItemRecord {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface StockReceiptRecord {
  id: string
  name: string
  paymentType: ReceiptPaymentType
  supplier: StockReceiptRelation
  warehouse: StockReceiptRelation
  exchangeRate: number
  notes: string
  status: ReceiptStatus
  items: StockReceiptItemRecord[]
  itemsCount: number
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export type StockReceiptsListResponse = PaginatedResponse<StockReceiptRecord>

export interface CreateStockReceiptRequest {
  name: string
  paymentType: ReceiptPaymentType
  supplierId: string
  warehouseId: string
  exchangeRate: number
  notes?: string
}

export type UpdateStockReceiptRequest = Partial<CreateStockReceiptRequest>

export interface AddStockReceiptItemRequest {
  productId: string
  quantity: number
  unitPrice: number
}

export interface UpdateStockReceiptItemRequest {
  quantity?: number
  unitPrice?: number
}
