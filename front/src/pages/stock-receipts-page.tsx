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
import { notify } from '@/lib/notify'
import {
  RECEIPT_PAYMENT_TYPE_LABELS,
  RECEIPT_STATUS_LABELS,
} from '@/lib/stock-receipt'
import { cn } from '@/lib/utils'
import { useGetStockReceiptsQuery } from '@/store/api/stock-receipts.api'
import type { StockReceiptRecord } from '@/types/stock-receipt.types'

const LIST_PATH = '/omborlar/maxsulot-kirim'
const CREATE_PATH = '/omborlar/maxsulot-kirim/yaratish'

const TABLE_HEADERS = [
  '№',
  'Kirim nomi',
  'Yetkazib beruvchi',
  'Ombor',
  "To'lov",
  'Holat',
  'Maxsulotlar',
  'Amallar',
]

function statusVariant(status: StockReceiptRecord['status']) {
  if (status === 'completed') return 'default'
  if (status === 'in_progress') return 'secondary'
  return 'destructive'
}

export function StockReceiptsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { page, perPage, setPage, setPerPage } = useListPagination(search)

  const receiptsQuery = useGetStockReceiptsQuery({
    search: search.trim() || undefined,
    page,
    perPage,
  })

  const { showSkeleton: showTableSkeleton, showRefreshing: showTableRefreshing } =
    useQueryLoading(receiptsQuery)

  usePageMeta({
    title: pageTitle('Maxsulot kirim qilish', 'Omborlar'),
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Maxsulot kirim qilish
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Yangi kirim yarating, maxsulotlarni qo&apos;shing va qabul qiling.
          </p>
        </div>
        <Button asChild>
          <Link to={CREATE_PATH}>
            <AppIcon name="plus" />
            Yangi kirim
          </Link>
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="package" />
            Kirimlar ro&apos;yxati
          </CardTitle>
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

          <div className="min-h-0 flex-1 overflow-auto">
            {showTableSkeleton ? (
              <DataTableSkeleton
                columns={8}
                rows={6}
                headers={TABLE_HEADERS}
              />
            ) : (
              <Table>
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
                </TableHeader>
                <TableBody>
                  {receipts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Kirimlar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    receipts.map((receipt, index) => {
                      const currentPage = receiptsQuery.data?.meta.page ?? 1
                      const currentPerPage = receiptsQuery.data?.meta.perPage ?? 20
                      const rowNumber =
                        (currentPage - 1) * currentPerPage + index + 1

                      return (
                        <TableRow
                          key={receipt.id}
                          className={cn(
                            (receipt.status === 'completed' ||
                              receipt.status === 'cancelled') &&
                              'opacity-80',
                          )}
                        >
                          <TableCell className="text-muted-foreground text-center tabular-nums">
                            {rowNumber}
                          </TableCell>
                          <TableCell className="font-medium">
                            {receipt.name}
                          </TableCell>
                          <TableCell>{receipt.supplier.name}</TableCell>
                          <TableCell>{receipt.warehouse.name}</TableCell>
                          <TableCell>
                            {RECEIPT_PAYMENT_TYPE_LABELS[receipt.paymentType]}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(receipt.status)}>
                              {RECEIPT_STATUS_LABELS[receipt.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {receipt.itemsCount}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`${LIST_PATH}/${receipt.id}`)
                              }
                            >
                              Ko&apos;rish
                              <AppIcon name="chevron-right" />
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
        </CardContent>
      </Card>
    </div>
  )
}
