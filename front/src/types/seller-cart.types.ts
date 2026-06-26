export interface SellerCartItem {
  productId: string
  productName: string
  productCode: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface SellerCartRecord {
  id: string
  cardNumber: string
  sellerId: string
  sellerName?: string
  warehouseId?: string
  items: SellerCartItem[]
  itemsCount: number
  subtotal: number
  status: string
  claimedOrderId?: string
  createdAt: string
  updatedAt: string
}

export interface SellerCartListResponse {
  data: SellerCartRecord[]
}

export interface AddSellerCartItemRequest {
  productId: string
  productName: string
  productCode?: string
  unitPrice: number
  quantity?: number
}

export interface UpdateSellerCartItemRequest {
  quantity: number
}
