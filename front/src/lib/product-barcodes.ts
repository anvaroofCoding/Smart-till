export interface ProductBarcodeCarrier {
  barcode?: string
  barcodes?: string[]
  productBarcode?: string
  productBarcodes?: string[]
}

export function getProductBarcodes(
  product: ProductBarcodeCarrier | null | undefined,
): string[] {
  if (!product) return []

  const values = new Set<string>()

  for (const value of [
    ...(product.barcodes ?? []),
    ...(product.productBarcodes ?? []),
  ]) {
    const trimmed = value.trim()
    if (trimmed) values.add(trimmed)
  }

  const primary = product.barcode?.trim() || product.productBarcode?.trim()
  if (primary) values.add(primary)

  return [...values]
}

export function matchesProductBarcode(
  product: ProductBarcodeCarrier | null | undefined,
  barcode: string,
): boolean {
  const normalized = barcode.trim()
  if (!normalized) return false

  return getProductBarcodes(product).some((value) => value === normalized)
}

export function matchesProductBarcodeSearch(
  product: ProductBarcodeCarrier | null | undefined,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return false

  return getProductBarcodes(product).some((value) => {
    const barcode = value.toLowerCase()
    return barcode.includes(normalized) || barcode === normalized
  })
}
