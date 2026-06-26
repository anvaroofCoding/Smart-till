import type { PaginatedResponse } from './api.types'

export type WarehouseTransferStatus = 'draft' | 'sent' | 'completed'

export interface WarehouseTransferItemRecord {
  id: string
  productId: string
  productName: string
  productBarcode?: string
  productBarcodes?: string[]
  quantity: number
  unitPrice: number
  receivedQuantity?: number
  receivedMarked?: boolean
}

export interface WarehouseTransferRecord {
  id: string
  code: string
  name: string
  fromWarehouseId: string
  fromWarehouseName: string
  toWarehouseId?: string
  toWarehouseName?: string
  transferDate: string
  status: WarehouseTransferStatus
  items: WarehouseTransferItemRecord[]
  notes: string
  sentAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type WarehouseTransfersListResponse = PaginatedResponse<WarehouseTransferRecord>

export interface TransferDestinationWarehouse {
  id: string
  name: string
}

export interface CreateWarehouseTransferItemRequest {
  productId: string
  quantity: number
}

export interface SendWarehouseTransferDraftRequest {
  toWarehouseId?: string
  transferDate?: string
  notes?: string
}

export interface CreateWarehouseTransferDraftRequest {
  fromWarehouseId: string
  name: string
  toWarehouseId: string
  transferDate?: string
  notes?: string
  items?: CreateWarehouseTransferItemRequest[]
}

export interface UpdateWarehouseTransferDraftRequest {
  items: CreateWarehouseTransferItemRequest[]
}

export interface CreateWarehouseTransferRequest {
  fromWarehouseId: string
  toWarehouseId: string
  transferDate: string
  items: CreateWarehouseTransferItemRequest[]
  notes?: string
}

export interface AcceptWarehouseTransferItemRequest {
  itemId: string
  received: boolean
  receivedQuantity?: number
}

export interface AcceptWarehouseTransferRequest {
  items: AcceptWarehouseTransferItemRequest[]
}

export interface UpdateAcceptanceProgressItemRequest {
  itemId: string
  received: boolean
  receivedQuantity: number
}

export interface UpdateAcceptanceProgressRequest {
  items: UpdateAcceptanceProgressItemRequest[]
}
