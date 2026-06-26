export interface OrderFulfillmentTableFilters {
  id: string
  customerName: string
  customerPhone: string
  total: string
  createdAt: string
}

export const emptyOrderFulfillmentTableFilters: OrderFulfillmentTableFilters = {
  id: '',
  customerName: '',
  customerPhone: '',
  total: '',
  createdAt: '',
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.replace(/\s/g, '').replace(',', '.').trim()
  if (!normalized) return undefined

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function orderFulfillmentFiltersToQueryParams(
  filters: OrderFulfillmentTableFilters,
): Record<string, string | number | undefined> {
  return {
    id: filters.id.trim() || undefined,
    customerName: filters.customerName.trim() || undefined,
    customerPhone: filters.customerPhone.trim() || undefined,
    total: parseOptionalNumber(filters.total),
    createdAt: filters.createdAt.trim() || undefined,
    status: 'pending_fulfillment',
  }
}

export const ORDER_FULFILLMENT_TABLE_HEADERS = [
  '',
  'ID',
  'Mijoz',
  'Telefon',
  'Umumiy narx',
  'Status',
  'Vaqt',
] as const
