import type { OrderLineItem } from '@/types/order.types'
import type { WarehouseStockRecord } from '@/types/warehouse-stock.types'

export interface ProductStockCatalogEntry {
  sellingPrice: number
  availableQuantity: number
}

function pickSellingPrice(
  current: number,
  next: number,
): number {
  if (next > 0 && current <= 0) return next
  if (current > 0 && next <= 0) return current
  return Math.max(current, next)
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
      sellingPrice: pickSellingPrice(existing.sellingPrice, row.sellingPrice),
      availableQuantity: existing.availableQuantity + row.quantity,
    })
  }

  return map
}

export function enrichOrderLineWithStock(
  item: OrderLineItem,
  stock: ProductStockCatalogEntry | undefined,
): OrderLineItem {
  if (!stock) return item

  return {
    ...item,
    unitPrice: stock.sellingPrice > 0 ? stock.sellingPrice : item.unitPrice,
    quantity: clampOrderQuantity(item.quantity, stock.availableQuantity),
  }
}

export function enrichOrderItemsWithStock(
  items: OrderLineItem[],
  catalog: Map<string, ProductStockCatalogEntry>,
): OrderLineItem[] {
  return items.map((item) =>
    enrichOrderLineWithStock(item, catalog.get(item.productId)),
  )
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
