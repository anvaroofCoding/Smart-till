export interface WarehouseStockTableFilters {
  id: string
  categoryId: string
  productId: string
  unitPrice: string
  sellingPrice: string
  totalValue: string
  warehouseId: string
  quantity: string
}

export const emptyWarehouseStockTableFilters: WarehouseStockTableFilters = {
  id: '',
  categoryId: '',
  productId: '',
  unitPrice: '',
  sellingPrice: '',
  totalValue: '',
  warehouseId: '',
  quantity: '',
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.replace(/\s/g, '').replace(',', '.').trim()
  if (!normalized) return undefined

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function warehouseStockFiltersToQueryParams(
  filters: WarehouseStockTableFilters,
): Record<string, string | number | undefined> {
  return {
    id: filters.id.trim() || undefined,
    categoryId: filters.categoryId || undefined,
    productId: filters.productId || undefined,
    warehouseId: filters.warehouseId || undefined,
    unitPrice: parseOptionalNumber(filters.unitPrice),
    sellingPrice: parseOptionalNumber(filters.sellingPrice),
    quantity: parseOptionalNumber(filters.quantity),
    totalValue: parseOptionalNumber(filters.totalValue),
  }
}

export const WAREHOUSE_STOCK_TABLE_HEADERS = [
  '№',
  'ID',
  'Maxsulot kategoriyasi',
  'Maxsulot nomi',
  'Oxirgi kirim narxi',
  'Sotiladigan narx',
  'Tovar qiymati',
  'Ombor nomi',
  'Ombordagi soni',
] as const
