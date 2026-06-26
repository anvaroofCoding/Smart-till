import { WAREHOUSE_STOCK_TABLE_HEADERS } from '@/components/warehouse-stock/warehouse-stock-table-filters'
import { axiosClient } from '@/services/axios-client'
import type { WarehouseStockListResponse } from '@/types/warehouse-stock.types'
import type { WarehouseStockRecord } from '@/types/warehouse-stock.types'

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '')
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsvRow(values: Array<string | number>): string {
  return values.map(escapeCsvCell).join(';')
}

function recordToRow(item: WarehouseStockRecord, index: number): Array<string | number> {
  return [
    index + 1,
    item.id,
    item.product.category.name,
    item.product.name,
    item.product.barcode ?? '',
    item.unitPrice,
    item.sellingPrice,
    item.totalValue,
    item.warehouse.name,
    item.quantity,
  ]
}

async function fetchAllWarehouseStock(): Promise<WarehouseStockRecord[]> {
  const perPage = 100
  let page = 1
  const items: WarehouseStockRecord[] = []

  while (true) {
    const response = await axiosClient.get<WarehouseStockListResponse>(
      '/warehouse-stock',
      { params: { page, perPage } },
    )
    const payload = response.data
    items.push(...payload.data)

    if (page >= payload.meta.totalPages) {
      break
    }

    page += 1
  }

  return items
}

function downloadCsvFile(content: string, filename: string) {
  const blob = new Blob([`\uFEFF${content}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportWarehouseStockToExcel(): Promise<number> {
  const items = await fetchAllWarehouseStock()
  const headers = [...WAREHOUSE_STOCK_TABLE_HEADERS]
  const lines = [
    buildCsvRow(headers),
    ...items.map((item, index) => buildCsvRow(recordToRow(item, index))),
  ]

  const date = new Date().toISOString().slice(0, 10)
  downloadCsvFile(lines.join('\r\n'), `maxsulotlar-soni_${date}.csv`)

  return items.length
}
