import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useListPagination } from '@/hooks/use-list-pagination'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useGetOrdersQuery } from '@/store/api/orders.api'
import type { OrderRecord } from '@/types/order.types'

const ORDER_CREATE_PATH = '/kassir/buyurtma-yaratish'

const TABLE_HEADERS = [
  'ID',
  'Mijoz ismi',
  'Mijoz raqami',
  'Buyurtma narxi',
  'Umumiy narx',
  'Chegirma',
  'Status',
  'Kassir',
  'Saqlangan vaqti',
  'Amallar',
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Qoralama',
  confirmed: 'Tasdiqlangan',
  cancelled: 'Bekor qilingan',
}

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
        status === 'confirmed' && 'border-sky-500/40 text-sky-600',
        status === 'cancelled' && 'border-destructive/40 text-destructive',
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

export function OrdersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { page, perPage, setPage, setPerPage } = useListPagination(search)

  const ordersQuery = useGetOrdersQuery({
    search: search.trim() || undefined,
    page,
    perPage,
  })

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

  function handleOpenOrder(order: OrderRecord) {
    navigate(`/kassir/buyurtmalar/${order.id}`)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buyurtmalar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {paginationMeta.total} ta buyurtma
          </p>
        </div>
        <Button asChild>
          <Link to={ORDER_CREATE_PATH}>
            <AppIcon name="plus" />
            Yangi buyurtma
          </Link>
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle>Buyurtmalar ro&apos;yxati</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="relative w-full max-w-md shrink-0">
            <AppIcon
              name="search"
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish"
              className="pl-9"
            />
          </div>

          <QueryRefreshIndicator visible={showTableRefreshing} />

          {showTableSkeleton ? (
            <DataTableSkeleton
              columns={10}
              rows={8}
              headers={TABLE_HEADERS}
            />
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {TABLE_HEADERS.map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-muted-foreground h-24 text-center"
                        >
                          Buyurtmalar topilmadi
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">
                            {order.id.slice(-6)}
                          </TableCell>
                          <TableCell>{order.customerName || '—'}</TableCell>
                          <TableCell>{formatPhone(order.customerPhone)}</TableCell>
                          <TableCell>{formatMoney(order.subtotal)}</TableCell>
                          <TableCell>{formatMoney(order.total)}</TableCell>
                          <TableCell>{formatMoney(order.discountTotal)}</TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                          <TableCell>{order.createdByName || '—'}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenOrder(order)}
                            >
                              {order.status === 'draft' ? 'Davom etish' : "Ko'rish"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <DataTablePagination
                meta={paginationMeta}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
