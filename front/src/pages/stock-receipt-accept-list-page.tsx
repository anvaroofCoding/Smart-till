import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  emptyStockReceiptTableFilters,
  stockReceiptFiltersToQueryParams,
  type StockReceiptTableFilters,
} from '@/components/stock-receipts/stock-receipt-table-filters'
import { StockReceiptsListTable } from '@/components/stock-receipts/stock-receipts-list-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { useGetStockReceiptsQuery } from '@/store/api/stock-receipts.api'

const LIST_PATH = '/omborlar/kirim-qabul'

export function StockReceiptAcceptListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<StockReceiptTableFilters>({
    ...emptyStockReceiptTableFilters,
    status: 'in_progress',
  })

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () =>
      stockReceiptFiltersToQueryParams(debouncedFilters, {
        submitted: true,
      }),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const receiptsQuery = useGetStockReceiptsQuery({
    ...filterQuery,
    page,
    perPage,
  })

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(receiptsQuery)

  usePageMeta({
    title: pageTitle('Kirimni qabul qilish', 'Omborlar'),
  })

  const receipts = receiptsQuery.data?.data ?? []
  const paginationMeta = receiptsQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }

  useEffect(() => {
    if (!receiptsQuery.error) return
    notify.error(
      getApiErrorMessage(receiptsQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [receiptsQuery.error])

  function handleFilterChange(patch: Partial<StockReceiptTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kirimni qabul qilish
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Jadval ustunlari ostidagi filterlar orqali jarayondagi kirimlarni
            qidiring va qabul qiling.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/omborlar/maxsulot-kirim">
            <AppIcon name="arrow-left" />
            Kirimlar
          </Link>
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="check" />
            Qabul qilish kutilmoqda
            <Badge variant="secondary">{paginationMeta.total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <StockReceiptsListTable
            receipts={receipts}
            filters={filters}
            paginationMeta={paginationMeta}
            showTableSkeleton={showTableSkeleton}
            showTableRefreshing={showTableRefreshing}
            onFilterChange={handleFilterChange}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            emptyMessage="Qabul qilish uchun kirimlar topilmadi"
            renderActions={(receipt) => (
              <Button
                size="sm"
                onClick={() => navigate(`${LIST_PATH}/${receipt.id}`)}
              >
                <AppIcon name="check" />
                Qabul qilish
              </Button>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
