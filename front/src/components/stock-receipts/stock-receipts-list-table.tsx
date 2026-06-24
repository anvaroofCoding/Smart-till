import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import {
  RECEIPT_PAYMENT_TYPE_LABELS,
  RECEIPT_STATUS_LABELS,
} from '@/lib/stock-receipt'
import { cn } from '@/lib/utils'
import type { PaginatedMeta } from '@/types/api.types'
import type { StockReceiptRecord } from '@/types/stock-receipt.types'
import {
  STOCK_RECEIPT_TABLE_HEADERS,
  type StockReceiptTableFilters,
} from './stock-receipt-table-filters'
import { StockReceiptTableFiltersRow } from './stock-receipt-table-filters-row'

function statusVariant(status: StockReceiptRecord['status']) {
  if (status === 'completed') return 'default'
  if (status === 'in_progress') return 'secondary'
  return 'destructive'
}

interface StockReceiptsListTableProps {
  receipts: StockReceiptRecord[]
  filters: StockReceiptTableFilters
  paginationMeta: PaginatedMeta
  showTableSkeleton: boolean
  showTableRefreshing: boolean
  onFilterChange: (patch: Partial<StockReceiptTableFilters>) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onRowClick: (receipt: StockReceiptRecord) => void
  emptyMessage: string
}

export function StockReceiptsListTable({
  receipts,
  filters,
  paginationMeta,
  showTableSkeleton,
  showTableRefreshing,
  onFilterChange,
  onPageChange,
  onPerPageChange,
  onRowClick,
  emptyMessage,
}: StockReceiptsListTableProps) {
  const columnCount = STOCK_RECEIPT_TABLE_HEADERS.length

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
        {showTableSkeleton ? (
          <DataTableSkeleton
            columns={columnCount}
            rows={6}
            headers={[...STOCK_RECEIPT_TABLE_HEADERS]}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {STOCK_RECEIPT_TABLE_HEADERS.map((header) => (
                  <TableHead
                    key={header}
                    className={
                      header === '№'
                        ? 'w-12 text-center'
                        : header === 'ID'
                          ? 'min-w-[100px]'
                          : undefined
                    }
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
              <StockReceiptTableFiltersRow
                filters={filters}
                disabled={showTableRefreshing}
                onChange={onFilterChange}
              />
            </TableHeader>
            <TableBody>
              {receipts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="text-muted-foreground h-24 text-center"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt, index) => {
                  const rowNumber =
                    (paginationMeta.page - 1) * paginationMeta.perPage +
                    index +
                    1

                  return (
                    <TableRow
                      key={receipt.id}
                      className={cn(
                        'hover:bg-muted/50 cursor-pointer',
                        (receipt.status === 'completed' ||
                          receipt.status === 'cancelled') &&
                          'opacity-80',
                      )}
                      onClick={() => onRowClick(receipt)}
                    >
                      <TableCell className="text-muted-foreground text-center tabular-nums">
                        {rowNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {receipt.id.slice(-8)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {receipt.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(receipt.status)}>
                          {RECEIPT_STATUS_LABELS[receipt.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {RECEIPT_PAYMENT_TYPE_LABELS[receipt.paymentType]}
                      </TableCell>
                      <TableCell>{receipt.supplier.name}</TableCell>
                      <TableCell>{receipt.warehouse.name}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatDateDisplay(receipt.createdAt)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(receipt.exchangeRate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(receipt.totalAmount)}
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
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          disabled={showTableRefreshing}
        />
      )}

      <QueryRefreshIndicator visible={showTableRefreshing} />
    </>
  )
}
