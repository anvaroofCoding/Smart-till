import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { TransferIncomingTableFiltersRow } from '@/components/warehouse-transfers/transfer-incoming-table-filters-row'
import { TransferQrScannerButton } from '@/components/warehouse-transfers/transfer-qr-scanner-dialog'
import { TransferStatusBadge } from '@/components/warehouse-transfers/transfer-status-badge'
import {
  emptyTransferTableFilters,
  transferFiltersToQueryParams,
  type TransferTableFilters,
} from '@/components/warehouse-transfers/transfer-table-filters'
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
import { useListPagination } from '@/hooks/use-list-pagination'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
import { pageTitle } from '@/config/seo'
import { formatDateDisplay } from '@/lib/date-format'
import { getApiErrorMessage } from '@/lib/api-error'
import { DEFAULT_PER_PAGE } from '@/lib/pagination'
import { notify } from '@/lib/notify'
import { isTransferRecipient } from '@/lib/warehouse-transfer-access'
import { useGetWarehouseTransfersQuery } from '@/store/api/warehouse-transfers.api'
import { useGetWarehousesQuery } from '@/store/api/warehouses.api'

const LIST_PATH = '/transfer/qabul-qilish'
const TRANSFERS_PATH = '/transfer/transferlar'

const TABLE_HEADERS = [
  '№',
  'Nom',
  'Kod',
  'Yuboruvchi ombor',
  'Qabul qiluvchi ombor',
  'Sana',
  'Holat',
  'Amallar',
] as const

export function WarehouseTransferAcceptListPage() {
  const navigate = useNavigate()
  const { user, allWarehouses, filterWarehouses } = useUserWarehouseAccess()
  const [filters, setFilters] = useState<TransferTableFilters>(emptyTransferTableFilters)
  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => transferFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })
  const availableWarehouses = allWarehouses
    ? (warehousesQuery.data?.data ?? [])
    : filterWarehouses(warehousesQuery.data?.data ?? [])

  const transfersQuery = useGetWarehouseTransfersQuery({
    page,
    perPage,
    direction: 'incoming',
    ...filterQuery,
  })

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(transfersQuery)

  usePageMeta({
    title: pageTitle('Transferni qabul qilish', 'Transfer'),
  })

  const transfers = useMemo(
    () =>
      (transfersQuery.data?.data ?? []).filter((transfer) =>
        isTransferRecipient(user, transfer),
      ),
    [transfersQuery.data?.data, user],
  )

  const paginationMeta = transfersQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }

  useEffect(() => {
    if (!transfersQuery.error) return
    notify.error(
      getApiErrorMessage(transfersQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [transfersQuery.error])

  function handleFilterChange(patch: Partial<TransferTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Transferni qabul qilish
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <TransferQrScannerButton size="sm" />
          <Button variant="outline" asChild>
            <Link to={TRANSFERS_PATH}>
              <AppIcon name="arrow-left" />
              Transferlar
            </Link>
          </Button>
        </div>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="min-h-0 flex-1 overflow-auto">
          {showTableSkeleton ? (
            <DataTableSkeleton
              columns={TABLE_HEADERS.length}
              rows={6}
              headers={[...TABLE_HEADERS]}
            />
          ) : (
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow>
                  {TABLE_HEADERS.map((header) => (
                    <TableHead
                      key={header}
                      className={
                        header === '№'
                          ? 'w-12 text-center'
                          : header === 'Amallar'
                            ? 'text-right'
                            : undefined
                      }
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
                <TransferIncomingTableFiltersRow
                  filters={filters}
                  warehouses={availableWarehouses}
                  disabled={showTableRefreshing}
                  onChange={handleFilterChange}
                />
              </TableHeader>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_HEADERS.length}
                      className="text-muted-foreground h-24 text-center"
                    >
                      Qabul qilinadigan transferlar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((transfer, index) => {
                    const currentPage = transfersQuery.data?.meta.page ?? 1
                    const currentPerPage =
                      transfersQuery.data?.meta.perPage ?? DEFAULT_PER_PAGE
                    const rowNumber = (currentPage - 1) * currentPerPage + index + 1

                    return (
                      <TableRow
                        key={transfer.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`${LIST_PATH}/${transfer.id}`)}
                      >
                        <TableCell className="text-muted-foreground text-center tabular-nums">
                          {rowNumber}
                        </TableCell>
                        <TableCell className="max-w-[200px] font-medium">
                          <span className="line-clamp-2">
                            {transfer.name || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {transfer.code}
                        </TableCell>
                        <TableCell>{transfer.fromWarehouseName}</TableCell>
                        <TableCell>{transfer.toWarehouseName}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                          {formatDateDisplay(transfer.transferDate) || '—'}
                        </TableCell>
                        <TableCell>
                          <TransferStatusBadge status={transfer.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                              event.stopPropagation()
                              navigate(`${LIST_PATH}/${transfer.id}`)
                            }}
                            aria-label="Qabul qilish"
                          >
                            <AppIcon name="clipboard-list" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
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

        <QueryRefreshIndicator visible={showTableRefreshing} />
      </div>
    </div>
  )
}
