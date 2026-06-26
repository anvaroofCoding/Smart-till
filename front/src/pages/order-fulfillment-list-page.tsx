import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  emptyOrderFulfillmentTableFilters,
  ORDER_FULFILLMENT_TABLE_HEADERS,
  orderFulfillmentFiltersToQueryParams,
  type OrderFulfillmentTableFilters,
} from '@/components/orders/order-fulfillment-table-filters'
import { OrderFulfillmentTableFiltersRow } from '@/components/orders/order-fulfillment-table-filters-row'
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
import { Badge } from '@/components/ui/badge'
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
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import {
  formatOrderDisplayId,
  ORDER_STATUS_LABELS,
} from '@/lib/order-display'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useGetOrdersQuery } from '@/store/api/orders.api'

const ORDER_DETAIL_PATH = '/kassir/buyurtmalar'

function formatPhone(value: string) {
  if (!value) return '—'
  return value.startsWith('+') ? value : `+${value}`
}

export function OrderFulfillmentListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<OrderFulfillmentTableFilters>(
    emptyOrderFulfillmentTableFilters,
  )

  const debouncedFilters = useDebouncedValue(filters, 300)
  const filterQuery = useMemo(
    () => orderFulfillmentFiltersToQueryParams(debouncedFilters),
    [debouncedFilters],
  )
  const filterKey = useMemo(() => JSON.stringify(filterQuery), [filterQuery])
  const { page, perPage, setPage, setPerPage } = useListPagination(filterKey)

  const ordersQuery = useGetOrdersQuery({
    ...filterQuery,
    page,
    perPage,
  })

  const { showSkeleton, showRefreshing } = useQueryLoading(ordersQuery)

  usePageMeta({
    title: pageTitle('Buyurtmani chiqim qilish', 'Kassir'),
  })

  useEffect(() => {
    if (!ordersQuery.error) return
    notify.error(getApiErrorMessage(ordersQuery.error, "Ro'yxatni yuklab bo'lmadi"))
  }, [ordersQuery.error])

  const orders = ordersQuery.data?.data ?? []
  const paginationMeta = ordersQuery.data?.meta ?? {
    page: 1,
    perPage,
    total: 0,
    totalPages: 1,
  }

  function handleFilterChange(patch: Partial<OrderFulfillmentTableFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  function openFulfillment(orderId: string) {
    navigate(`${ORDER_DETAIL_PATH}/${orderId}/chiqim`)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Buyurtmani chiqim qilish
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/kassir/buyurtmalar">Buyurtmalar ro&apos;yxati</Link>
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="min-h-0 flex-1 overflow-auto">
          {showSkeleton ? (
            <DataTableSkeleton
              columns={ORDER_FULFILLMENT_TABLE_HEADERS.length}
              rows={8}
              headers={[...ORDER_FULFILLMENT_TABLE_HEADERS]}
            />
          ) : (
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow>
                  {ORDER_FULFILLMENT_TABLE_HEADERS.map((header, index) => (
                    <TableHead
                      key={header || 'open'}
                      className={index === 0 ? 'w-10 px-2' : undefined}
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
                <OrderFulfillmentTableFiltersRow
                  filters={filters}
                  disabled={showRefreshing}
                  onChange={handleFilterChange}
                />
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={ORDER_FULFILLMENT_TABLE_HEADERS.length}
                      className="text-muted-foreground h-24 text-center"
                    >
                      Chiqim kutilayotgan buyurtmalar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => openFulfillment(order.id)}
                    >
                      <TableCell className="w-10 px-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          aria-label="Chiqim qilish"
                          onClick={(event) => {
                            event.stopPropagation()
                            openFulfillment(order.id)
                          }}
                        >
                          <AppIcon name="package" className="size-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        #{formatOrderDisplayId(order.id)}
                      </TableCell>
                      <TableCell>{order.customerName || '—'}</TableCell>
                      <TableCell>{formatPhone(order.customerPhone)}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatMoney(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'border-violet-500/40 text-violet-600',
                          )}
                        >
                          {ORDER_STATUS_LABELS.pending_fulfillment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateDisplay(order.createdAt) || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {!showSkeleton && (
          <DataTablePagination
            meta={paginationMeta}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            disabled={ordersQuery.isFetching}
          />
        )}

        <QueryRefreshIndicator visible={showRefreshing} />
      </div>
    </div>
  )
}
