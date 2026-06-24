import type { OrderLineItem } from '@/types/order.types'

export function getLineSubtotal(item: OrderLineItem): number {
  return item.unitPrice * item.quantity
}

export function getLineTotal(item: OrderLineItem): number {
  return Math.max(0, getLineSubtotal(item) - item.discount)
}

export function getOrderTotals(items: OrderLineItem[]) {
  const subtotal = items.reduce((sum, item) => sum + getLineSubtotal(item), 0)
  const discountTotal = items.reduce((sum, item) => sum + item.discount, 0)
  const total = items.reduce((sum, item) => sum + getLineTotal(item), 0)
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemsCount,
  }
}

export function createLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createPaymentId(): string {
  return `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
