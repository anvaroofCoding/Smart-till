import type { OrderRecord } from '@/types/order.types'

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Qoralama',
  pending_fulfillment: 'Chiqim kutilmoqda',
  confirmed: 'Tasdiqlangan',
  cancelled: 'Bekor qilingan',
}
export function formatOrderDisplayId(id: string): string {
  if (id.length >= 8) {
    return String(parseInt(id.slice(0, 8), 16) % 100000)
  }
  return id.slice(-6).toUpperCase()
}

export function formatOrderCode(id: string): string {
  const suffix = id.slice(-6).toUpperCase()
  const prefix = id.length >= 8 ? String(parseInt(id.slice(-8, -6), 16) % 100 || 1) : '1'
  return `${prefix}/${suffix}`
}

export function formatOrderPhone(value: string): string {
  if (!value) return '—'
  return value.startsWith('+') ? value : `+${value}`
}

export function formatOrderAddress(order: OrderRecord): string {
  const parts = [
    order.customerRegion,
    order.customerDistrict,
    order.customerArea,
    order.customerAddress,
  ]
    .map((part) => part.trim())
    .filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : '—'
}

export function formatDisplayValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '—'
  if (typeof value === 'string' && !value.trim()) return '—'
  return String(value)
}

export function getOrderOpenPath(order: Pick<OrderRecord, 'id' | 'status'>): string {
  return `/kassir/buyurtmalar/${order.id}`
}
