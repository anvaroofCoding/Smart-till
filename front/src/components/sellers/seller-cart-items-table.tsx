import { AppIcon } from '@/components/icons/app-icon'
import { OrderQuantityInput } from '@/components/orders/order-quantity-input'
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
import { formatMoney } from '@/lib/format-money'
import type { ProductStockCatalogEntry } from '@/lib/warehouse-stock-catalog'
import type { SellerCartItem } from '@/types/seller-cart.types'

const TABLE_HEADERS = [
  '№',
  'Maxsulot nomi',
  'Narxi',
  'Soni',
  'Jami',
  'Amallar',
] as const

interface SellerCartItemsTableProps {
  items: SellerCartItem[]
  disabled?: boolean
  getStock: (productId: string) => ProductStockCatalogEntry | undefined
  onQuantityChange: (productId: string, quantity: number) => void
  onQuantityLimit: (limit: number) => void
  onRemove: (productId: string) => void
}

export function SellerCartItemsTable({
  items,
  disabled = false,
  getStock,
  onQuantityChange,
  onQuantityLimit,
  onRemove,
}: SellerCartItemsTableProps) {
  return (
    <Table className={BORDERLESS_TABLE_CLASS}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
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
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={TABLE_HEADERS.length}
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
              <TableRow key={item.productId} className="hover:bg-muted/30">
                <TableCell className="text-center tabular-nums">
                  {index + 1}
                </TableCell>
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
                    onChange={(quantity) =>
                      onQuantityChange(item.productId, quantity)
                    }
                    onLimitExceeded={onQuantityLimit}
                  />
                </TableCell>
                <TableCell className="tabular-nums font-medium">
                  {formatMoney(item.lineTotal)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    onClick={() => onRemove(item.productId)}
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
