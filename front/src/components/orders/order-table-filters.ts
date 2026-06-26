import type { OrderRecord } from '@/types/order.types'

export type OrderStatusFilter = 'all' | OrderRecord['status']

export interface OrderTableFilters {
  id: string
  customerName: string
  customerPhone: string
  subtotal: string
  total: string
  discountTotal: string
  status: OrderStatusFilter
  createdByName: string
  createdAt: string
}

export const emptyOrderTableFilters: OrderTableFilters = {
  id: '',
  customerName: '',
  customerPhone: '',
  subtotal: '',
  total: '',
  discountTotal: '',
  status: 'all',
  createdByName: '',
  createdAt: '',
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.replace(/\s/g, '').replace(',', '.').trim()
  if (!normalized) return undefined

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function orderFiltersToQueryParams(
  filters: OrderTableFilters,
): Record<string, string | number | undefined> {
  return {
    id: filters.id.trim() || undefined,
    customerName: filters.customerName.trim() || undefined,
    customerPhone: filters.customerPhone.trim() || undefined,
    subtotal: parseOptionalNumber(filters.subtotal),
    total: parseOptionalNumber(filters.total),
    discountTotal: parseOptionalNumber(filters.discountTotal),
    status: filters.status === 'all' ? undefined : filters.status,
    createdByName: filters.createdByName.trim() || undefined,
    createdAt: filters.createdAt.trim() || undefined,
  }
}

export const ORDER_TABLE_HEADERS = [
  '',
  'ID',
  'Mijoz ismi',
  'Mijoz raqami',
  'Buyurtma narxi',
  'Umumiy narx',
  'Chegirma',
  'Status',
  'Kassir',
  'Saqlangan vaqti',
] as const
