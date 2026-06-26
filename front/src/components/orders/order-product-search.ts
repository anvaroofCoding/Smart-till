import type { ProductStockCatalogEntry } from '@/lib/warehouse-stock-catalog'
import {
  getProductBarcodes,
  matchesProductBarcode,
  matchesProductBarcodeSearch,
} from '@/lib/product-barcodes'
import type { ProductRecord } from '@/types/product.types'
import type { WarehouseStockRecord } from '@/types/warehouse-stock.types'

export function stockProductToRecord(row: WarehouseStockRecord): ProductRecord {
  const { product } = row
  const barcodes = getProductBarcodes(product)
  return {
    id: product.id,
    name: product.name,
    code: product.code,
    barcode: barcodes[0] ?? product.barcode,
    barcodes,
    description: '',
    category: product.category,
    brand: product.brand,
    image: '',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  }
}

export function matchesOrderProductSearch(
  product: ProductRecord,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return false

  return (
    product.name.toLowerCase().includes(normalized) ||
    product.code.toLowerCase().includes(normalized) ||
    matchesProductBarcodeSearch(product, normalized)
  )
}

export function filterAvailableOrderProducts(
  products: ProductRecord[],
  query: string,
  stockCatalog: Map<string, ProductStockCatalogEntry>,
): ProductRecord[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  return products.filter((product) => {
    if (!product.isActive) return false

    const stock = stockCatalog.get(product.id)
    if (!stock || stock.availableQuantity <= 0) return false

    return matchesOrderProductSearch(product, trimmed)
  })
}

export function findOrderProductByBarcode(
  products: ProductRecord[],
  barcode: string,
  stockCatalog: Map<string, ProductStockCatalogEntry>,
): ProductRecord | null {
  const normalized = barcode.trim()
  if (!normalized) return null

  const inStock = products.filter((product) => {
    if (!product.isActive) return false

    const stock = stockCatalog.get(product.id)
    return Boolean(stock && stock.availableQuantity > 0)
  })

  const exactMatches = inStock.filter((product) =>
    matchesProductBarcode(product, normalized),
  )
  if (exactMatches.length === 1) return exactMatches[0]

  // API qidiruvi qo'shimcha barkod orqali topilgan bitta maxsulotni qaytarishi mumkin.
  if (inStock.length === 1) return inStock[0]

  return null
}

export function buildBarcodeProductIndex(
  rows: WarehouseStockRecord[],
  stockCatalog: Map<string, ProductStockCatalogEntry>,
): Map<string, ProductRecord> {
  const index = new Map<string, ProductRecord>()

  for (const row of rows) {
    if (row.quantity <= 0 || !stockCatalog.has(row.product.id)) continue

    const record = stockProductToRecord(row)
    for (const code of getProductBarcodes(row.product)) {
      if (!index.has(code)) {
        index.set(code, record)
      }
    }
  }

  return index
}

export function findOrderProductByExactBarcode(
  rows: WarehouseStockRecord[],
  barcode: string,
  stockCatalog: Map<string, ProductStockCatalogEntry>,
): ProductRecord | null {
  const normalized = barcode.trim()
  if (!normalized || stockCatalog.size === 0) return null

  const exactMatches = rows
    .filter((row) => row.quantity > 0 && stockCatalog.has(row.product.id))
    .filter((row) => matchesProductBarcode(row.product, normalized))

  return exactMatches.length === 1
    ? stockProductToRecord(exactMatches[0])
    : null
}

export function findOrderProductFromStockRows(
  rows: WarehouseStockRecord[],
  term: string,
  stockCatalog: Map<string, ProductStockCatalogEntry>,
): ProductRecord | null {
  const normalized = term.trim()
  if (!normalized || stockCatalog.size === 0) return null

  const availableRows = rows.filter(
    (row) => row.quantity > 0 && stockCatalog.has(row.product.id),
  )

  const exactBarcodeMatches = availableRows.filter((row) =>
    matchesProductBarcode(row.product, normalized),
  )
  if (exactBarcodeMatches.length === 1) {
    return stockProductToRecord(exactBarcodeMatches[0])
  }

  const products = availableRows.map(stockProductToRecord)
  const matches = filterAvailableOrderProducts(products, normalized, stockCatalog)
  return matches.length === 1 ? matches[0] : null
}
