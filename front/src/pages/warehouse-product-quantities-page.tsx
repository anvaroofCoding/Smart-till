import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  emptyWarehouseStockTableFilters,
  warehouseStockFiltersToQueryParams,
  type WarehouseStockTableFilters,
} from '@/components/warehouse-stock/warehouse-stock-table-filters'
import { WarehouseStockListTable } from '@/components/warehouse-stock/warehouse-stock-list-table'
import { LIST_PAGE_TABLE_SECTION_CLASS } from '@/components/shared/table-filter-field'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useListPagination } from '@/hooks/use-list-pagination'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { exportWarehouseStockToExcel } from '@/lib/export-warehouse-stock-excel'
import { notify } from '@/lib/notify'
import { useGetProductCategoriesQuery } from '@/store/api/product-categories.api'
import { useGetProductsQuery } from '@/store/api/products.api'
import { useGetWarehousesQuery } from '@/store/api/warehouses.api'
import { useGetWarehouseStockQuery } from '@/store/api/warehouse-stock.api'

const LIST_PATH = '/omborlar/maxsulotlar-soni'

export function WarehouseProductQuantitiesPage() {
  const navigate = useNavigate()
  const { filterWarehouses } = useUserWarehouseAccess()
  const [filters, setFilters] = useState<WarehouseStockTableFilters>(
    emptyWarehouseStockTableFilters,
  )
  const [isExporting, setIsExporting] = useState(false)

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => warehouseStockFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const categoriesQuery = useGetProductCategoriesQuery({ page: 1, perPage: 100 })
  const productsQuery = useGetProductsQuery({ page: 1, perPage: 100 })
  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })
  const stockQuery = useGetWarehouseStockQuery({
    ...filterQuery,
    page,
    perPage,
  })

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(stockQuery)

  usePageMeta({
    title: pageTitle('Maxsulotlar soni', 'Omborlar'),
  })

  const categories = categoriesQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const warehouses = filterWarehouses(warehousesQuery.data?.data ?? [])
  const items = stockQuery.data?.data ?? []
  const paginationMeta = stockQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }

  useEffect(() => {
    if (!stockQuery.error) return
    notify.error(
      getApiErrorMessage(stockQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [stockQuery.error])

  function handleFilterChange(patch: Partial<WarehouseStockTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  async function handleExportExcel() {
    if (isExporting) return

    setIsExporting(true)
    try {
      const total = await exportWarehouseStockToExcel()
      notify.success(
        total > 0
          ? `${total} ta maxsulot Excel faylga yuklandi`
          : 'Eksport qilinadigan maxsulot topilmadi',
      )
    } catch (error) {
      notify.error(
        getApiErrorMessage(error, 'Excel faylni yuklab bo\'lmadi'),
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Maxsulotlar soni
        </h1>
        <Button
          type="button"
          variant="outline"
          onClick={handleExportExcel}
          disabled={isExporting}
        >
          <AppIcon
            name={isExporting ? 'loader' : 'excel'}
            className={isExporting ? 'animate-spin' : undefined}
          />
          Excel
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <WarehouseStockListTable
        items={items}
        filters={filters}
        categories={categories}
        products={products}
        warehouses={warehouses}
        paginationMeta={paginationMeta}
        showTableSkeleton={showTableSkeleton}
        showTableRefreshing={showTableRefreshing}
        onFilterChange={handleFilterChange}
        onPageChange={setPage}
        onPerPageChange={(value) => setPerPage(value as 10 | 20 | 50 | 100)}
        emptyMessage="Omborda maxsulotlar topilmadi"
        onRowClick={(item) => navigate(`${LIST_PATH}/${item.id}`)}
        />
      </div>
    </div>
  )
}
