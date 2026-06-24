import { useEffect, useMemo, useState } from 'react'

import {
  buildProductStockCatalog,
  type ProductStockCatalogEntry,
} from '@/lib/warehouse-stock-catalog'
import { useGetWarehouseStockQuery } from '@/store/api/warehouse-stock.api'
import type { WarehouseStockRecord } from '@/types/warehouse-stock.types'

const STOCK_PAGE_SIZE = 100

export function useWarehouseStockCatalog() {
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<WarehouseStockRecord[]>([])
  const [isComplete, setIsComplete] = useState(false)

  const query = useGetWarehouseStockQuery({
    page,
    perPage: STOCK_PAGE_SIZE,
  })

  useEffect(() => {
    setPage(1)
    setRows([])
    setIsComplete(false)
  }, [])

  useEffect(() => {
    if (!query.data) return

    setRows((prev) => {
      if (page === 1) return query.data.data

      const existingIds = new Set(prev.map((row) => row.id))
      const nextRows = query.data.data.filter((row) => !existingIds.has(row.id))
      return [...prev, ...nextRows]
    })

    if (query.data.meta.page >= query.data.meta.totalPages) {
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
    getEntry: (productId: string): ProductStockCatalogEntry | undefined =>
      catalog.get(productId),
  }
}
