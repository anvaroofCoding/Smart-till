export interface OrderLineItem {
  id: string
  productId: string
  productName: string
  productCode: string
  unitPrice: number
  quantity: number
  discount: number
}

export interface OrderPaymentLine {
  id: string
  paymentTypeId: string
  paymentTypeName: string
  amount: number
  installmentMonths?: number
  installmentInterestPercent?: number
}

export interface OrderCustomerInfo {
  name: string
  phone: string
  region: string
  district: string
  area: string
  address: string
  comment: string
}

export interface CreateOrderItemRequest {
  productId: string
  productName: string
  productCode?: string
  unitPrice: number
  quantity: number
  discount?: number
  lineTotal: number
}

export interface CreateOrderPaymentRequest {
  paymentTypeId: string
  paymentTypeName: string
  amount: number
  installmentMonths?: number
  installmentInterestPercent?: number
}

export interface CreateOrderRequest {
  customerName?: string
  customerPhone: string
  customerRegion?: string
  customerDistrict?: string
  customerArea?: string
  customerAddress?: string
  comment?: string
  items: CreateOrderItemRequest[]
  payments: CreateOrderPaymentRequest[]
}

export interface OrderRecord {
  id: string
  customerName: string
  customerPhone: string
  customerRegion: string
  customerDistrict: string
  customerArea: string
  customerAddress: string
  comment: string
  items: Array<{
    productId: string
    productName: string
    productCode: string
    unitPrice: number
    quantity: number
    discount: number
    lineTotal: number
  }>
  payments: Array<{
    paymentTypeId: string
    paymentTypeName: string
    amount: number
    installmentMonths?: number
    installmentInterestPercent?: number
  }>
  itemsCount: number
  subtotal: number
  discountTotal: number
  total: number
  paidTotal: number
  remainingTotal: number
  status: string
  createdAt: string
  updatedAt: string
}
