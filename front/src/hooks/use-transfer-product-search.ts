import { useCallback, useEffect, useMemo, useState } from 'react'

import { useWarehouseStockByWarehouse } from '@/hooks/use-warehouse-stock-by-warehouse'
import { matchesProductBarcode, matchesProductBarcodeSearch } from '@/lib/product-barcodes'
import type { WarehouseStockRecord } from '@/types/warehouse-stock.types'

interface UseTransferProductSearchOptions {
  warehouseId: string
  excludedProductIds?: string[]
}

function matchesSearch(row: WarehouseStockRecord, term: string): boolean {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return false

  const { product } = row

  return (
    product.name.toLowerCase().includes(normalized) ||
    product.code.toLowerCase().includes(normalized) ||
    matchesProductBarcodeSearch(product, normalized)
  )
}

function filterAvailableRows(
  rows: WarehouseStockRecord[],
  term: string,
  excluded: Set<string>,
): WarehouseStockRecord[] {
  const trimmed = term.trim()
  if (!trimmed) return []

  return rows
    .filter(
      (row) =>
        row.quantity > 0 &&
        !excluded.has(row.product.id) &&
        matchesSearch(row, trimmed),
    )
    .slice(0, 50)
}

function findRowByExactBarcode(
  rows: WarehouseStockRecord[],
  barcode: string,
): WarehouseStockRecord | null {
  const normalized = barcode.trim()
  if (!normalized) return null

  const matches = rows.filter(
    (row) => row.quantity > 0 && matchesProductBarcode(row.product, normalized),
  )

  return matches.length === 1 ? matches[0] : null
}

export function useTransferProductSearch({
  warehouseId,
  excludedProductIds = [],
}: UseTransferProductSearchOptions) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [comboOpen, setComboOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<WarehouseStockRecord | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const stockQuery = useWarehouseStockByWarehouse(warehouseId)
  const excluded = useMemo(() => new Set(excludedProductIds), [excludedProductIds])

  const getRowsForTerm = useCallback(
    (term: string) => filterAvailableRows(stockQuery.rows, term, excluded),
    [excluded, stockQuery.rows],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setSearch('')
    setDebouncedSearch('')
    setSelectedRow(null)
    setComboOpen(false)
    setHighlightedIndex(0)
  }, [warehouseId])

  const availableRows = useMemo(
    () => getRowsForTerm(debouncedSearch),
    [debouncedSearch, getRowsForTerm],
  )

  useEffect(() => {
    setHighlightedIndex(0)
  }, [availableRows, search])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (selectedRow) {
      setSelectedRow(null)
    }
    setComboOpen(value.trim().length > 0)
  }

  function handleSelectRow(row: WarehouseStockRecord) {
    setSelectedRow(row)
    setSearch(`${row.product.name} (${row.product.code})`)
    setComboOpen(false)
  }

  const resolveRowForSubmit = useCallback(
    (term = search): WarehouseStockRecord | null => {
      if (selectedRow) return selectedRow

      const exactBarcode = findRowByExactBarcode(stockQuery.rows, term)
      if (exactBarcode) return exactBarcode

      const immediateRows = getRowsForTerm(term)
      if (immediateRows.length === 1) return immediateRows[0]

      return immediateRows[highlightedIndex] ?? immediateRows[0] ?? null
    },
    [excluded, getRowsForTerm, highlightedIndex, search, selectedRow, stockQuery.rows],
  )

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const hasSearchQuery = search.trim().length > 0

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!comboOpen && hasSearchQuery) {
        setComboOpen(true)
      }
      const rows = getRowsForTerm(search)
      if (rows.length > 0) {
        setHighlightedIndex((prev) => Math.min(prev + 1, rows.length - 1))
      }
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const rows = getRowsForTerm(search)
      if (rows.length > 0) {
        setHighlightedIndex((prev) => Math.max(prev - 1, 0))
      }
      return
    }

    if (event.key === 'Escape') {
      setComboOpen(false)
      return
    }

    if (event.key !== 'Enter') return

    event.preventDefault()
  }

  const reset = useCallback(() => {
    setSelectedRow(null)
    setSearch('')
    setComboOpen(false)
    setHighlightedIndex(0)
  }, [])

  return {
    search,
    comboOpen,
    selectedRow,
    highlightedIndex,
    availableRows,
    stockQuery,
    isLoading: stockQuery.isLoading,
    isStockReady: stockQuery.isComplete,
    setComboOpen,
    handleSearchChange,
    handleSelectRow,
    handleSearchKeyDown,
    resolveRowForSubmit,
    resetSelection: reset,
    getAvailableQuantity: stockQuery.getAvailableQuantity,
  }
}
