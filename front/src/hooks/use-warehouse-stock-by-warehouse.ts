import { useEffect, useMemo, useState } from 'react'

import { buildProductStockCatalog } from '@/lib/warehouse-stock-catalog'
import { DEFAULT_PER_PAGE } from '@/lib/pagination'
import { useGetWarehouseStockQuery } from '@/store/api/warehouse-stock.api'
import type { WarehouseStockRecord } from '@/types/warehouse-stock.types'

const STOCK_PAGE_SIZE = DEFAULT_PER_PAGE

export function useWarehouseStockByWarehouse(warehouseId: string) {
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<WarehouseStockRecord[]>([])
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setPage(1)
    setRows([])
    setIsComplete(false)
  }, [warehouseId])

  const query = useGetWarehouseStockQuery(
    {
      page,
      perPage: STOCK_PAGE_SIZE,
      warehouseId: warehouseId || undefined,
    },
    { skip: !warehouseId },
  )

  useEffect(() => {
    const data = query.data
    if (!data) return

    setRows((prev) => {
      if (page === 1) return data.data

      const existingIds = new Set(prev.map((row) => row.id))
      const nextRows = data.data.filter((row) => !existingIds.has(row.id))
      return [...prev, ...nextRows]
    })

    if (data.meta.page >= data.meta.totalPages) {
      setIsComplete(true)
      return
    }

    setPage((currentPage) => currentPage + 1)
  }, [page, query.data])

  const catalog = useMemo(() => buildProductStockCatalog(rows), [rows])

  return {
    catalog,
    rows,
    isLoading: !isComplete && (query.isLoading || query.isFetching),
    isComplete,
    error: query.error,
    getAvailableQuantity: (productId: string) =>
      catalog.get(productId)?.availableQuantity ?? 0,
  }
}
