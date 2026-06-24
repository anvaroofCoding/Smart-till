import type { PaginatedMeta } from './api.types'

export interface WarehouseStockRelation {
  id: string
  name: string
}

export interface WarehouseStockProduct {
  id: string
  name: string
  code: string
  category: WarehouseStockRelation
  brand: WarehouseStockRelation
}

export interface WarehouseStockRecord {
  id: string
  product: WarehouseStockProduct
  warehouse: WarehouseStockRelation
  quantity: number
  unitPrice: number
  exchangeRate: number
  totalValue: number
  sellingPrice: number
  markupPercent?: number
  updatedAt: string
}

export interface StockMovementRecord {
  id: string
  sourceType: string
  sourceName: string
  sourceId?: string
  supplier: WarehouseStockRelation
  warehouse: WarehouseStockRelation
  delta: number
  balanceAfter: number
  unitPrice: number
  exchangeRate: number
  totalPrice: number
  notes: string
  createdAt: string
}

export interface WarehouseStockDetailRecord extends WarehouseStockRecord {
  movements: StockMovementRecord[]
  hasMixedUnitPrices: boolean
  previousUnitPrices: number[]
}

export interface WarehouseStockListResponse {
  data: WarehouseStockRecord[]
  meta: PaginatedMeta
}
