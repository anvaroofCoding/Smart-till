import type { WarehouseStockRecord } from '@/types/warehouse-stock.types'

export interface ProductStockCatalogEntry {
  sellingPrice: number
  availableQuantity: number
}

export function buildProductStockCatalog(
  rows: WarehouseStockRecord[],
): Map<string, ProductStockCatalogEntry> {
  const map = new Map<string, ProductStockCatalogEntry>()

  for (const row of rows) {
    const productId = row.product.id
    const existing = map.get(productId)

    if (!existing) {
      map.set(productId, {
        sellingPrice: row.sellingPrice,
        availableQuantity: row.quantity,
      })
      continue
    }

    map.set(productId, {
      sellingPrice: Math.max(existing.sellingPrice, row.sellingPrice),
      availableQuantity: existing.availableQuantity + row.quantity,
    })
  }

  return map
}

export function clampOrderQuantity(
  quantity: number,
  availableQuantity: number,
): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 1
  const maxQuantity = Math.max(0, Math.floor(availableQuantity))
  if (maxQuantity <= 0) return 1
  return Math.min(Math.floor(quantity), maxQuantity)
}
