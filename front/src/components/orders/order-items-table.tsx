import { AppIcon } from '@/components/icons/app-icon'
import {
  BORDERLESS_TABLE_CLASS,
  TABLE_FILTER_CELL_CLASS,
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
import { getLineTotal } from '@/components/orders/order-create-utils'
import { OrderQuantityInput } from '@/components/orders/order-quantity-input'
import { formatMoney } from '@/lib/format-money'
import type { ProductStockCatalogEntry } from '@/lib/warehouse-stock-catalog'
import type { OrderLineItem } from '@/types/order.types'

const ITEM_HEADERS = [
  '№',
  'Maxsulot nomi',
  'Narxi',
  'Soni',
  'Chegirma',
  'Jami',
  'Amallar',
] as const

interface OrderItemsTableProps {
  items: OrderLineItem[]
  disabled?: boolean
  getStock: (productId: string) => ProductStockCatalogEntry | undefined
  onQuantityChange: (itemId: string, quantity: number) => void
  onQuantityLimit: (limit: number) => void
  onDiscount: (itemId: string) => void
  onRemove: (itemId: string) => void
}

export function OrderItemsTable({
  items,
  disabled = false,
  getStock,
  onQuantityChange,
  onQuantityLimit,
  onDiscount,
  onRemove,
}: OrderItemsTableProps) {
  return (
    <Table className={BORDERLESS_TABLE_CLASS}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {ITEM_HEADERS.map((header) => (
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
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={ITEM_HEADERS.length}
              className="text-muted-foreground h-24 text-center"
            >
              Maxsulotlar qo&apos;shilmagan
            </TableCell>
          </TableRow>
        ) : (
          items.map((item, index) => {
            const stock = getStock(item.productId)
            const maxQuantity = stock?.availableQuantity ?? 1

            return (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell className="text-center tabular-nums">{index + 1}</TableCell>
                <TableCell className="max-w-[280px] font-medium">
                  <span className="line-clamp-2">{item.productName}</span>
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatMoney(item.unitPrice)}
                </TableCell>
                <TableCell className={TABLE_FILTER_CELL_CLASS}>
                  <OrderQuantityInput
                    value={item.quantity}
                    maxQuantity={maxQuantity}
                    disabled={disabled}
                    onChange={(quantity) => onQuantityChange(item.id, quantity)}
                    onLimitExceeded={onQuantityLimit}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">{formatMoney(item.discount)}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={disabled}
                      onClick={() => onDiscount(item.id)}
                    >
                      Chegirma
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums font-medium">
                  {formatMoney(getLineTotal(item))}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive size-8"
                    disabled={disabled}
                    onClick={() => onRemove(item.id)}
                    aria-label="O'chirish"
                  >
                    <AppIcon name="trash-2" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
