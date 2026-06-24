import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/format-money'
import type { PaginatedMeta } from '@/types/api.types'
import type { ProductCategoryRecord } from '@/types/product-category.types'
import type { ProductRecord } from '@/types/product.types'
import type { WarehouseRecord } from '@/types/warehouse.types'
import type { WarehouseStockRecord } from '@/types/warehouse-stock.types'
import {
  WAREHOUSE_STOCK_TABLE_HEADERS,
  type WarehouseStockTableFilters,
} from './warehouse-stock-table-filters'
import { WarehouseStockTableFiltersRow } from './warehouse-stock-table-filters-row'

interface WarehouseStockListTableProps {
  items: WarehouseStockRecord[]
  filters: WarehouseStockTableFilters
  categories: ProductCategoryRecord[]
  products: ProductRecord[]
  warehouses: WarehouseRecord[]
  paginationMeta: PaginatedMeta
  showTableSkeleton: boolean
  showTableRefreshing: boolean
  onFilterChange: (patch: Partial<WarehouseStockTableFilters>) => void
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onRowClick: (item: WarehouseStockRecord) => void
  emptyMessage: string
}

export function WarehouseStockListTable({
  items,
  filters,
  categories,
  products,
  warehouses,
  paginationMeta,
  showTableSkeleton,
  showTableRefreshing,
  onFilterChange,
  onPageChange,
  onPerPageChange,
  onRowClick,
  emptyMessage,
}: WarehouseStockListTableProps) {
  const columnCount = WAREHOUSE_STOCK_TABLE_HEADERS.length

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
        {showTableSkeleton ? (
          <DataTableSkeleton
            columns={columnCount}
            rows={6}
            headers={[...WAREHOUSE_STOCK_TABLE_HEADERS]}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {WAREHOUSE_STOCK_TABLE_HEADERS.map((header) => (
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
              <WarehouseStockTableFiltersRow
                filters={filters}
                categories={categories}
                products={products}
                warehouses={warehouses}
                disabled={showTableRefreshing}
                onChange={onFilterChange}
              />
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="text-muted-foreground h-24 text-center"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => {
                  const rowNumber =
                    (paginationMeta.page - 1) * paginationMeta.perPage +
                    index +
                    1

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => onRowClick(item)}
                    >
                      <TableCell className="text-muted-foreground text-center tabular-nums">
                        {rowNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {item.id.slice(-8)}
                      </TableCell>
                      <TableCell>{item.product.category.name}</TableCell>
                      <TableCell className="font-medium">
                        {item.product.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="font-medium">
                          {formatMoney(item.sellingPrice)}
                          {item.markupPercent !== undefined ? (
                            <sup className="text-muted-foreground ml-0.5 text-[0.65em] font-normal leading-none">
                              +{item.markupPercent}%
                            </sup>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.totalValue)}
                      </TableCell>
                      <TableCell>{item.warehouse.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
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
