import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  emptyOrderTableFilters,
  ORDER_TABLE_HEADERS,
  orderFiltersToQueryParams,
  type OrderTableFilters,
} from '@/components/orders/order-table-filters'
import { OrderTableFiltersRow } from '@/components/orders/order-table-filters-row'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import { Badge } from '@/components/ui/badge'
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
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { ORDER_STATUS_LABELS, getOrderOpenPath } from '@/lib/order-display'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useGetOrdersQuery } from '@/store/api/orders.api'
import { useGetUsersQuery } from '@/store/api/users.api'
import type { OrderRecord } from '@/types/order.types'

const ORDER_CREATE_PATH = '/kassir/buyurtma-yaratish'

function formatPhone(value: string) {
  if (!value) return '—'
  return value.startsWith('+') ? value : `+${value}`
}

function formatDate(value?: string) {
  if (!value) return '—'
  return formatDateDisplay(value) || '—'
}

function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'draft' && 'border-amber-500/40 text-amber-600',
        status === 'pending_fulfillment' && 'border-violet-500/40 text-violet-600',
        status === 'confirmed' && 'border-sky-500/40 text-sky-600',
        status === 'cancelled' && 'border-destructive/40 text-destructive',
      )}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

export function OrdersPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<OrderTableFilters>(emptyOrderTableFilters)

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => orderFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const ordersQuery = useGetOrdersQuery({
    ...filterQuery,
    page,
    perPage,
  })
  const usersQuery = useGetUsersQuery({ page: 1, perPage: 200 })

  const cashiers = useMemo(
    () =>
      (usersQuery.data?.data ?? [])
        .filter((user) => user.isActive && user.position === 'kassir')
        .map((user) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
        }))
        .filter((user) => user.name.length > 0)
        .sort((left, right) => left.name.localeCompare(right.name, 'uz')),
    [usersQuery.data],
  )

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(ordersQuery)

  usePageMeta({
    title: pageTitle('Buyurtmalar', 'Kassir'),
  })

  useEffect(() => {
    if (!ordersQuery.error) return
    notify.error(
      getApiErrorMessage(ordersQuery.error, "Ro'yxatni yuklab bo'lmadi"),
    )
  }, [ordersQuery.error])

  const orders = ordersQuery.data?.data ?? []
  const paginationMeta = ordersQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }

  function handleFilterChange(patch: Partial<OrderTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function handleOpenOrder(order: OrderRecord) {
    navigate(getOrderOpenPath(order))
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buyurtmalar</h1>
        </div>
        <Button asChild>
          <Link to={ORDER_CREATE_PATH}>
            <AppIcon name="plus" />
            Yangi buyurtma
          </Link>
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
          <div className="min-h-0 flex-1 overflow-auto">
            {showTableSkeleton ? (
              <DataTableSkeleton
                columns={ORDER_TABLE_HEADERS.length}
                rows={8}
                headers={[...ORDER_TABLE_HEADERS]}
              />
            ) : (
              <Table className={BORDERLESS_TABLE_CLASS}>
                <TableHeader>
                  <TableRow>
                    {ORDER_TABLE_HEADERS.map((header, index) => (
                      <TableHead
                        key={header || 'open'}
                        className={index === 0 ? 'w-10 px-2' : undefined}
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                  <OrderTableFiltersRow
                    filters={filters}
                    cashiers={cashiers}
                    disabled={showTableRefreshing}
                    onChange={handleFilterChange}
                  />
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={ORDER_TABLE_HEADERS.length}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Buyurtmalar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer"
                        onClick={() => handleOpenOrder(order)}
                      >
                        <TableCell className="w-10 px-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            aria-label={
                              order.status === 'draft'
                                ? 'Davom etish'
                                : "Buyurtmani ko'rish"
                            }
                            onClick={(event) => {
                              event.stopPropagation()
                              handleOpenOrder(order)
                            }}
                          >
                            <AppIcon
                              name={order.status === 'draft' ? 'pencil' : 'eye'}
                              className="size-4"
                            />
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {order.id.slice(-6)}
                        </TableCell>
                        <TableCell>{order.customerName || '—'}</TableCell>
                        <TableCell>{formatPhone(order.customerPhone)}</TableCell>
                        <TableCell className="tabular-nums">
                          {formatMoney(order.subtotal)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatMoney(order.total)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatMoney(order.discountTotal)}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>{order.createdByName || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(order.createdAt)}
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

          <QueryRefreshIndicator visible={showTableRefreshing} />
      </div>
    </div>
  )
}
