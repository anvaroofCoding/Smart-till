import type {
  ReceiptPaymentType,
  ReceiptStatus,
} from '@/lib/stock-receipt'

export interface StockReceiptTableFilters {
  id: string
  name: string
  status: 'all' | ReceiptStatus
  paymentType: 'all' | ReceiptPaymentType
  supplierName: string
  warehouseName: string
  createdAt: string
  exchangeRate: string
  totalAmount: string
}

export const emptyStockReceiptTableFilters: StockReceiptTableFilters = {
  id: '',
  name: '',
  status: 'all',
  paymentType: 'all',
  supplierName: '',
  warehouseName: '',
  createdAt: '',
  exchangeRate: '',
  totalAmount: '',
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.replace(/\s/g, '').replace(',', '.').trim()
  if (!normalized) return undefined

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function stockReceiptFiltersToQueryParams(
  filters: StockReceiptTableFilters,
  options?: { fixedStatus?: ReceiptStatus; submitted?: boolean },
): Record<string, string | number | boolean | undefined> {
  const status =
    options?.fixedStatus ??
    (filters.status === 'all' ? undefined : filters.status)

  return {
    id: filters.id.trim() || undefined,
    name: filters.name.trim() || undefined,
    status,
    paymentType:
      filters.paymentType === 'all' ? undefined : filters.paymentType,
    supplierName: filters.supplierName.trim() || undefined,
    warehouseName: filters.warehouseName.trim() || undefined,
    createdAt: filters.createdAt.trim() || undefined,
    exchangeRate: parseOptionalNumber(filters.exchangeRate),
    totalAmount: parseOptionalNumber(filters.totalAmount),
    submitted: options?.submitted,
  }
}

export const STOCK_RECEIPT_TABLE_HEADERS = [
  '№',
  'ID',
  'Kirim nomi',
  'Holat',
  "To'lov turi",
  'Yetkazib beruvchi',
  'Ombor',
  'Saqlangan vaqti',
  'Kurs',
  'Umumiy narx',
] as const
