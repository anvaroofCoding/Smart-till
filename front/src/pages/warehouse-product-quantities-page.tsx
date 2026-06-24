import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  emptyWarehouseStockTableFilters,
  warehouseStockFiltersToQueryParams,
  type WarehouseStockTableFilters,
} from '@/components/warehouse-stock/warehouse-stock-table-filters'
import { WarehouseStockListTable } from '@/components/warehouse-stock/warehouse-stock-list-table'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useListPagination } from '@/hooks/use-list-pagination'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Maxsulotlar soni
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Omborlardagi maxsulotlar miqdori, kirim narxi va sotiladigan narxi.
            Qatorni bosing yoki filterlar orqali ombor, kategoriya va maxsulot
            bo&apos;yicha qidiring.
          </p>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="package" />
            Ombordagi maxsulotlar
            <Badge variant="secondary">{paginationMeta.total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
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
        </CardContent>
      </Card>
    </div>
  )
}
