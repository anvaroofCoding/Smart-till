import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  DAILY_BALANCE_TABLE_HEADERS,
  dailyBalanceFiltersToQueryParams,
  emptyDailyBalanceTableFilters,
  type DailyBalanceTableFilters,
} from '@/components/daily-balances/daily-balance-table-filters'
import { DailyBalanceTableFiltersRow } from '@/components/daily-balances/daily-balance-table-filters-row'
import { AppIcon } from '@/components/icons/app-icon'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
} from '@/components/shared/table-filter-field'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useListPagination } from '@/hooks/use-list-pagination'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatDateKeyDisplay } from '@/lib/daily-balance-display'
import { formatDateTimeDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { notify } from '@/lib/notify'
import { useGetDailyBalancesQuery } from '@/store/api/daily-balances.api'
import { useGetWarehousesQuery } from '@/store/api/warehouses.api'
import type { DailyBalanceRecord } from '@/types/daily-balance.types'

const DETAIL_PATH = '/kassir/kunlik-balanslar'

function formatDisplayId(id: string) {
  return id.slice(-4)
}

export function DailyBalancesPage() {
  const navigate = useNavigate()
  const { filterWarehouses } = useUserWarehouseAccess()
  const [filters, setFilters] = useState<DailyBalanceTableFilters>(
    emptyDailyBalanceTableFilters,
  )

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => dailyBalanceFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })
  const balancesQuery = useGetDailyBalancesQuery({
    ...filterQuery,
    page,
    perPage,
  })

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(balancesQuery)

  usePageMeta({ title: pageTitle('Kunlik balanslar', 'Kassir') })

  useEffect(() => {
    if (!balancesQuery.error) return
    notify.error(
      getApiErrorMessage(balancesQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [balancesQuery.error])

  const warehouses = filterWarehouses(warehousesQuery.data?.data ?? [])
  const rows = balancesQuery.data?.data ?? []
  const paginationMeta = balancesQuery.data?.meta ?? {
    page,
    perPage,
    total: 0,
    totalPages: 1,
  }

  function handleFilterChange(patch: Partial<DailyBalanceTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function openBalance(balance: DailyBalanceRecord) {
    navigate(`${DETAIL_PATH}/${balance.id}`)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Kunlik balanslar</h1>
        <QueryRefreshIndicator visible={showTableRefreshing} />
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="min-h-0 flex-1 overflow-auto">
          {showTableSkeleton ? (
            <DataTableSkeleton
              columns={DAILY_BALANCE_TABLE_HEADERS.length + 1}
              rows={8}
              headers={['', ...DAILY_BALANCE_TABLE_HEADERS]}
            />
          ) : (
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 px-2" />
                  {DAILY_BALANCE_TABLE_HEADERS.map((header, index) => (
                    <TableHead
                      key={header}
                      className={
                        index >= 4 && index <= 6 ? 'text-right' : undefined
                      }
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
                <DailyBalanceTableFiltersRow
                  filters={filters}
                  warehouses={warehouses}
                  disabled={showTableRefreshing}
                  onChange={handleFilterChange}
                />
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={DAILY_BALANCE_TABLE_HEADERS.length + 1}
                      className="text-muted-foreground h-24 text-center"
                    >
                      Kunlik balanslar mavjud emas
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => openBalance(row)}
                    >
                      <TableCell className="w-10 px-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          aria-label="Kunlik balansni ko'rish"
                          onClick={(event) => {
                            event.stopPropagation()
                            openBalance(row)
                          }}
                        >
                          <AppIcon
                            name="eye"
                            className="text-primary size-4"
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {(paginationMeta.page - 1) * paginationMeta.perPage +
                          index +
                          1}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDisplayId(row.id)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateKeyDisplay(row.dateKey)}
                      </TableCell>
                      <TableCell>{row.warehouseName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.totals.incomeTotal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.totals.expenseTotal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.transferredToMain)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTimeDisplay(row.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {!showTableSkeleton && (
          <DataTablePagination
            meta={paginationMeta}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            disabled={showTableRefreshing}
          />
        )}
      </div>
    </div>
  )
}
