import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { CreateTransferDialog } from '@/components/warehouse-transfers/create-transfer-dialog'
import { TransferOutgoingTableFiltersRow } from '@/components/warehouse-transfers/transfer-outgoing-table-filters-row'
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
import { resolveSenderWarehouseId } from '@/lib/transfer-sender-warehouse'
import { isTransferSender } from '@/lib/warehouse-transfer-access'
import {
  useGetTransferDestinationWarehousesQuery,
  useGetWarehouseTransfersQuery,
} from '@/store/api/warehouse-transfers.api'
import { useGetWarehousesQuery } from '@/store/api/warehouses.api'
import type { WarehouseTransferRecord } from '@/types/warehouse-transfer.types'

const CREATE_PATH = '/transfer/transferlar/yaratish'

const TABLE_HEADERS = [
  '№',
  'Nom',
  'Kod',
  'Qayerdan',
  'Qayerga',
  'Sana',
  'Maxsulotlar',
  'Holat',
  'Amallar',
] as const

function getTransferEditPath(transfer: WarehouseTransferRecord) {
  return `${CREATE_PATH}?draftId=${transfer.id}`
}

function getTransferViewPath(transfer: WarehouseTransferRecord) {
  return `/transfer/transferlar/${transfer.id}`
}

export function WarehouseTransfersPage() {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [filters, setFilters] = useState<TransferTableFilters>(emptyTransferTableFilters)
  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => transferFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })
  const {
    allWarehouses,
    warehouseIds,
    filterWarehouses,
    isLoading: isLoadingAccess,
    user,
  } = useUserWarehouseAccess()

  const availableWarehouses = allWarehouses
    ? (warehousesQuery.data?.data ?? [])
    : filterWarehouses(warehousesQuery.data?.data ?? [])

  const fromWarehouseId = useMemo(
    () =>
      resolveSenderWarehouseId(warehouseIds, availableWarehouses, allWarehouses),
    [allWarehouses, availableWarehouses, warehouseIds],
  )

  const fromWarehouseName = useMemo(
    () =>
      availableWarehouses.find((warehouse) => warehouse.id === fromWarehouseId)
        ?.name ?? '—',
    [availableWarehouses, fromWarehouseId],
  )

  const destinationWarehousesQuery = useGetTransferDestinationWarehousesQuery(
    fromWarehouseId,
    { skip: !fromWarehouseId },
  )
  const destinationWarehouses = destinationWarehousesQuery.data ?? []

  const transfersQuery = useGetWarehouseTransfersQuery(
    {
      page,
      perPage,
      direction: 'outgoing',
      ...filterQuery,
    },
    { refetchOnMountOrArgChange: true },
  )

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(transfersQuery)

  usePageMeta({
    title: pageTitle('Transferlar', 'Transfer'),
  })

  const transfers = transfersQuery.data?.data ?? []

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

  function handleOpenCreate() {
    if (isLoadingAccess || warehousesQuery.isLoading) {
      notify.error('Ma\'lumotlar yuklanmoqda, biroz kuting')
      return
    }

    if (!fromWarehouseId) {
      notify.error('Sizga ombor biriktirilmagan')
      return
    }

    if (destinationWarehousesQuery.isLoading || destinationWarehousesQuery.isFetching) {
      notify.error('Omborlar yuklanmoqda, biroz kuting')
      return
    }

    if (destinationWarehouses.length === 0) {
      notify.error('Boshqa faol ombor topilmadi')
      return
    }

    setCreateOpen(true)
  }

  function openTransfer(transfer: WarehouseTransferRecord) {
    if (transfer.status === 'draft' && isTransferSender(user, transfer)) {
      navigate(getTransferEditPath(transfer))
      return
    }

    navigate(getTransferViewPath(transfer))
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transferlar</h1>
        </div>
        <Button onClick={handleOpenCreate}>
          <AppIcon name="plus" />
          Yangi transfer
        </Button>
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
                            : header === 'Maxsulotlar'
                              ? 'text-right'
                              : undefined
                      }
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
                <TransferOutgoingTableFiltersRow
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
                      Transferlar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((transfer, index) => {
                    const currentPage = transfersQuery.data?.meta.page ?? 1
                    const currentPerPage =
                      transfersQuery.data?.meta.perPage ?? DEFAULT_PER_PAGE
                    const rowNumber = (currentPage - 1) * currentPerPage + index + 1
                    const canEdit =
                      transfer.status === 'draft' && isTransferSender(user, transfer)

                    return (
                      <TableRow
                        key={transfer.id}
                        className="cursor-pointer"
                        onClick={() => openTransfer(transfer)}
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
                        <TableCell>{transfer.toWarehouseName || '—'}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                          {formatDateDisplay(transfer.transferDate) || '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {transfer.items.length}
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
                              openTransfer(transfer)
                            }}
                            aria-label={canEdit ? 'Tahrirlash' : 'Ko\'rish'}
                          >
                            <AppIcon name={canEdit ? 'pencil' : 'eye'} />
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

      <CreateTransferDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        fromWarehouseId={fromWarehouseId}
        fromWarehouseName={fromWarehouseName}
        destinationWarehouses={destinationWarehouses}
        onCreated={(draftId) => {
          navigate(`${CREATE_PATH}?draftId=${draftId}`)
        }}
      />
    </div>
  )
}
