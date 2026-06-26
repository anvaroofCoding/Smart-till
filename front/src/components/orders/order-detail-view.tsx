import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { TruncatedDescriptionCell } from '@/components/shared/truncated-description-cell'
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
import {
  formatDisplayValue,
  formatOrderAddress,
  formatOrderCode,
  formatOrderDisplayId,
  formatOrderPhone,
  ORDER_STATUS_LABELS,
} from '@/lib/order-display'
import { formatMoney } from '@/lib/format-money'
import { canPrintOrderReceipt, printOrderReceipt } from '@/lib/order-receipt'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import type { OrderRecord } from '@/types/order.types'

interface OrderDetailViewProps {
  order: OrderRecord
  listPath: string
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

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-semibold tracking-tight">{children}</h2>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground w-[38%] max-w-[220px] align-top text-sm font-medium whitespace-normal">
        {label}
      </TableCell>
      <TableCell className="min-w-0 align-top text-sm break-words whitespace-normal [overflow-wrap:anywhere]">
        {value}
      </TableCell>
    </TableRow>
  )
}

export function OrderDetailView({ order, listPath }: OrderDetailViewProps) {
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)
  const showReceiptButton = canPrintOrderReceipt(order.status)

  async function handleReprintReceipt() {
    if (isPrintingReceipt) return

    setIsPrintingReceipt(true)
    try {
      await printOrderReceipt(order)
      notify.success('Chek qayta chop etildi')
    } catch {
      notify.error('Chekni chop etib bo\'lmadi')
    } finally {
      setIsPrintingReceipt(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={listPath}>
              <AppIcon name="arrow-left" />
              Buyurtmalar ro&apos;yxati
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Buyurtma #{formatOrderDisplayId(order.id)}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
        {(showReceiptButton || order.status === 'pending_fulfillment') && (
          <div className="flex flex-wrap gap-2">
            {showReceiptButton && (
              <Button
                type="button"
                variant="outline"
                disabled={isPrintingReceipt}
                onClick={() => void handleReprintReceipt()}
              >
                <AppIcon
                  name={isPrintingReceipt ? 'loader' : 'clipboard-list'}
                  className={isPrintingReceipt ? 'animate-spin' : undefined}
                />
                Chekni qayta chiqarish
              </Button>
            )}
            {order.status === 'pending_fulfillment' && (
              <Button asChild>
                <Link to={`/kassir/buyurtmalar/${order.id}/chiqim`}>
                  <AppIcon name="package" />
                  Chiqim qilish
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="min-h-0 flex-1 space-y-6 overflow-auto">
          <section className="space-y-2">
            <SectionTitle>Buyurtma ma&apos;lumotlari</SectionTitle>
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[38%] max-w-[220px]">Maydon</TableHead>
                  <TableHead>Qiymat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <InfoRow label="ID" value={formatOrderDisplayId(order.id)} />
                <InfoRow label="Buyurtma kodi" value={formatOrderCode(order.id)} />
                <InfoRow
                  label="Mijoz ismi"
                  value={formatDisplayValue(order.customerName)}
                />
                <InfoRow
                  label="Mijoz raqami"
                  value={formatOrderPhone(order.customerPhone)}
                />
                <InfoRow
                  label="Mijoz manzili"
                  value={formatOrderAddress(order)}
                />
                <InfoRow
                  label="Buyurtmaga izoh"
                  value={
                    order.comment?.trim() ? (
                      <TruncatedDescriptionCell
                        title="Buyurtmaga izoh"
                        description={order.comment}
                        dialogSubtitle={`Buyurtma #${formatOrderDisplayId(order.id)}`}
                        lines={2}
                        className="max-w-full"
                      />
                    ) : (
                      '—'
                    )
                  }
                />
                <InfoRow
                  label="Buyurtma narxi"
                  value={
                    <span className="tabular-nums">{formatMoney(order.subtotal)}</span>
                  }
                />
                <InfoRow
                  label="Buyurtmaga chegirma"
                  value={
                    order.discountTotal > 0 ? (
                      <span className="tabular-nums">
                        {formatMoney(order.discountTotal)}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <InfoRow
                  label="Umumiy narx"
                  value={
                    <span className="tabular-nums font-semibold">
                      {formatMoney(order.total)}
                    </span>
                  }
                />
                <InfoRow
                  label="Kassir"
                  value={formatDisplayValue(order.createdByName)}
                />
              </TableBody>
            </Table>
          </section>

          <section className="space-y-2">
            <SectionTitle>Buyurtma maxsulotlari</SectionTitle>
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">№</TableHead>
                  <TableHead>Maxsulot nomi</TableHead>
                  <TableHead className="text-right">Maxsulot soni</TableHead>
                  <TableHead className="text-right">Maxsulot narxi</TableHead>
                  <TableHead className="text-right">Chegirma</TableHead>
                  <TableHead className="text-right">Umumiy narx</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground h-24 text-center"
                    >
                      Maxsulotlar yo&apos;q
                    </TableCell>
                  </TableRow>
                ) : (
                  order.items.map((item, index) => (
                    <TableRow key={`${item.productId}-${index}`}>
                      <TableCell className="text-muted-foreground text-center tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell className="max-w-[320px] font-medium">
                        <span className="line-clamp-2">{item.productName}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.discount > 0 ? formatMoney(item.discount) : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatMoney(item.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>

          <section className="space-y-2">
            <SectionTitle>Buyurtma to&apos;lovlari</SectionTitle>
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">№</TableHead>
                  <TableHead>To&apos;lov turi</TableHead>
                  <TableHead className="text-right">To&apos;lov miqdori</TableHead>
                  <TableHead className="text-right">
                    Muddatli to&apos;lov muddati
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.payments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground h-24 text-center"
                    >
                      To&apos;lovlar yo&apos;q
                    </TableCell>
                  </TableRow>
                ) : (
                  order.payments.map((payment, index) => (
                    <TableRow key={`${payment.paymentTypeId}-${index}`}>
                      <TableCell className="text-muted-foreground text-center tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.paymentTypeName}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-normal">
                        {payment.installmentMonths
                          ? `${payment.installmentMonths} oy${
                              payment.installmentInterestPercent !== undefined
                                ? ` — ${payment.installmentInterestPercent}%`
                                : ''
                            }`
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>
        </div>
      </div>
    </div>
  )
}
