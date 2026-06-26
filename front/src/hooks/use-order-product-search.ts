import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  filterAvailableOrderProducts,
  findOrderProductByBarcode,
  findOrderProductFromStockRows,
} from '@/components/orders/order-product-search'
import { DEFAULT_PER_PAGE } from '@/lib/pagination'
import { useWarehouseStockCatalog } from '@/hooks/use-warehouse-stock-catalog'
import { useGetProductsQuery } from '@/store/api/products.api'
import type { ProductRecord } from '@/types/product.types'

interface UseOrderProductSearchOptions {
  enabled?: boolean
}

export function useOrderProductSearch({
  enabled = true,
}: UseOrderProductSearchOptions = {}) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [comboOpen, setComboOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(
    null,
  )
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const stockCatalogQuery = useWarehouseStockCatalog()
  const stockCatalog = stockCatalogQuery.catalog
  const stockRows = stockCatalogQuery.rows

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const productsQuery = useGetProductsQuery(
    {
      page: 1,
      perPage: DEFAULT_PER_PAGE,
      search: debouncedSearch.trim() || undefined,
      isActive: true,
    },
    { skip: !enabled || !debouncedSearch.trim() },
  )

  const getProductsForTerm = useCallback(
    (term: string) =>
      filterAvailableOrderProducts(
        productsQuery.data?.data ?? [],
        term,
        stockCatalog,
      ),
    [productsQuery.data?.data, stockCatalog],
  )

  const availableProducts = useMemo(
    () => getProductsForTerm(debouncedSearch),
    [debouncedSearch, getProductsForTerm],
  )

  useEffect(() => {
    setHighlightedIndex(0)
  }, [availableProducts, search])

  useEffect(() => {
    if (!enabled || !debouncedSearch.trim() || !stockCatalogQuery.isComplete) {
      return
    }

    const product = findOrderProductByBarcode(
      productsQuery.data?.data ?? [],
      debouncedSearch,
      stockCatalog,
    )
    if (!product) return

    setSelectedProduct(product)
    setSearch(`${product.name} (${product.code})`)
    setComboOpen(false)
  }, [
    debouncedSearch,
    enabled,
    productsQuery.data?.data,
    stockCatalog,
    stockCatalogQuery.isComplete,
  ])

  const resolveProductForSubmit = useCallback(
    (term = search): ProductRecord | null => {
      if (selectedProduct) return selectedProduct

      if (stockCatalogQuery.isComplete) {
        const fromStock = findOrderProductFromStockRows(
          stockRows,
          term,
          stockCatalog,
        )
        if (fromStock) return fromStock
      }

      const immediateMatches = getProductsForTerm(term)
      if (immediateMatches.length === 1) return immediateMatches[0]

      if (comboOpen && immediateMatches.length > 0) {
        return immediateMatches[highlightedIndex] ?? immediateMatches[0] ?? null
      }

      return null
    },
    [
      comboOpen,
      getProductsForTerm,
      highlightedIndex,
      search,
      selectedProduct,
      stockCatalog,
      stockCatalogQuery.isComplete,
      stockRows,
    ],
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    if (selectedProduct) {
      setSelectedProduct(null)
    }
    setComboOpen(value.trim().length > 0)
  }

  function handleSelectProduct(product: ProductRecord) {
    setSelectedProduct(product)
    setSearch(`${product.name} (${product.code})`)
    setComboOpen(false)
  }

  function resetSelection() {
    setSelectedProduct(null)
    setSearch('')
    setComboOpen(false)
    setHighlightedIndex(0)
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const hasSearchQuery = search.trim().length > 0

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!comboOpen && hasSearchQuery) {
        setComboOpen(true)
      }
      const rows = getProductsForTerm(search)
      if (rows.length > 0) {
        setHighlightedIndex((prev) => Math.min(prev + 1, rows.length - 1))
      }
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const rows = getProductsForTerm(search)
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
  }

  return {
    search,
    comboOpen,
    selectedProduct,
    availableProducts,
    stockCatalog,
    isLoading:
      productsQuery.isLoading ||
      productsQuery.isFetching ||
      stockCatalogQuery.isLoading,
    isStockReady: stockCatalogQuery.isComplete,
    setComboOpen,
    handleSearchChange,
    handleSelectProduct,
    handleSearchKeyDown,
    resolveProductForSubmit,
    resetSelection,
  }
}
