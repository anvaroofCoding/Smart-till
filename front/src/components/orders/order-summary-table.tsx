import { AppIcon } from '@/components/icons/app-icon'
import { BORDERLESS_TABLE_CLASS } from '@/components/shared/table-filter-field'
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

interface OrderSummaryTableProps {
  itemsCount: number
  subtotal: number
  discountTotal: number
  total: number
  showActions?: boolean
  isConfirming?: boolean
  canConfirm?: boolean
  isCancelling?: boolean
  onCancel?: () => void
  onConfirm?: () => void
}

export function OrderSummaryTable({
  itemsCount,
  subtotal,
  discountTotal,
  total,
  showActions = false,
  isConfirming = false,
  canConfirm = false,
  isCancelling = false,
  onCancel,
  onConfirm,
}: OrderSummaryTableProps) {
  const rows = [
    { label: 'Maxsulotlar soni', value: String(itemsCount) },
    { label: 'Narx', value: formatMoney(subtotal) },
    { label: 'Chegirma', value: formatMoney(discountTotal) },
    { label: 'Umumiy narx', value: formatMoney(total), emphasis: true },
  ]

  return (
    <div className="space-y-4">
      <Table className={BORDERLESS_TABLE_CLASS}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[42%]">Ko&apos;rsatkich</TableHead>
            <TableHead>Qiymat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label} className="hover:bg-muted/30">
              <TableCell className="font-medium whitespace-nowrap">
                {row.label}
              </TableCell>
              <TableCell
                className={
                  row.emphasis ? 'font-semibold tabular-nums' : 'tabular-nums'
                }
              >
                {row.value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="destructive"
            disabled={isCancelling}
            onClick={onCancel}
          >
            Buyurtmani bekor qilish
          </Button>
          <Button
            type="button"
            disabled={isConfirming || !canConfirm}
            onClick={onConfirm}
          >
            {isConfirming ? (
              <AppIcon name="loader" className="animate-spin" />
            ) : null}
            Buyurtmani tasdiqlash
          </Button>
        </div>
      )}
    </div>
  )
}
