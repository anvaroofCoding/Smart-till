import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  emptyStockReceiptTableFilters,
  stockReceiptFiltersToQueryParams,
  type StockReceiptTableFilters,
} from '@/components/stock-receipts/stock-receipt-table-filters'
import { StockReceiptsListTable } from '@/components/stock-receipts/stock-receipts-list-table'
import { LIST_PAGE_TABLE_SECTION_CLASS } from '@/components/shared/table-filter-field'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useListPagination } from '@/hooks/use-list-pagination'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { useGetStockReceiptsQuery } from '@/store/api/stock-receipts.api'

const LIST_PATH = '/omborlar/kirim-qabul'
const DETAIL_PATH = '/omborlar/maxsulot-kirim'

export function StockReceiptAcceptListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<StockReceiptTableFilters>(
    emptyStockReceiptTableFilters,
  )

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
        </div>
        <Button variant="outline" asChild>
          <Link to="/omborlar/maxsulot-kirim">
            <AppIcon name="arrow-left" />
            Kirimlar
          </Link>
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <StockReceiptsListTable
          receipts={receipts}
          filters={filters}
          paginationMeta={paginationMeta}
          showTableSkeleton={showTableSkeleton}
          showTableRefreshing={showTableRefreshing}
          onFilterChange={handleFilterChange}
          onPageChange={setPage}
          onPerPageChange={(value) => setPerPage(value as 10 | 20 | 50 | 100)}
          emptyMessage="Yuborilgan kirimlar topilmadi"
          onRowClick={(receipt) => {
            if (receipt.status === 'in_progress') {
              navigate(`${LIST_PATH}/${receipt.id}`)
              return
            }
            navigate(`${DETAIL_PATH}/${receipt.id}`)
          }}
        />
      </div>
    </div>
  )
}
