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
import type { OrderPaymentLine } from '@/types/order.types'

interface OrderPaymentsTableProps {
  total: number
  paidTotal: number
  remainingTotal: number
  payments: OrderPaymentLine[]
  disabled?: boolean
  onRemovePayment: (paymentId: string) => void
}

export function OrderPaymentsTable({
  total,
  paidTotal,
  remainingTotal,
  payments,
  disabled = false,
  onRemovePayment,
}: OrderPaymentsTableProps) {
  return (
    <div className="space-y-4">
      <Table className={BORDERLESS_TABLE_CLASS}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Qabul qilinishi kerak</TableHead>
            <TableHead>Qabul qilindi</TableHead>
            <TableHead>Qoldiq</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-muted/30">
            <TableCell className="tabular-nums font-medium">
              {formatMoney(total)}
            </TableCell>
            <TableCell className="tabular-nums font-medium">
              {formatMoney(paidTotal)}
            </TableCell>
            <TableCell className="tabular-nums font-medium">
              {formatMoney(remainingTotal)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {payments.length > 0 && (
        <Table className={BORDERLESS_TABLE_CLASS}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>To&apos;lov turi</TableHead>
              <TableHead className="text-right">Summa</TableHead>
              <TableHead className="w-12 text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-muted/30">
                <TableCell>
                  <p className="font-medium">{payment.paymentTypeName}</p>
                  {payment.installmentMonths ? (
                    <p className="text-muted-foreground text-xs">
                      {payment.installmentMonths} oy
                      {payment.installmentInterestPercent !== undefined
                        ? ` — ${payment.installmentInterestPercent}%`
                        : ''}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatMoney(payment.amount)}
                </TableCell>
                <TableCell className="text-right">
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive size-8"
                      onClick={() => onRemovePayment(payment.id)}
                      aria-label="To'lovni o'chirish"
                    >
                      <AppIcon name="trash-2" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
