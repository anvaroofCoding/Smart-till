import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { FormPageSkeleton } from '@/components/loading'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePageMeta } from '@/hooks/use-page-meta'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import {
  formatOrderAddress,
  formatOrderDisplayId,
  formatOrderPhone,
} from '@/lib/order-display'
import { printOrderReceipt, runOrderReceiptPrintFlow } from '@/lib/order-receipt'
import { notify } from '@/lib/notify'
import {
  useGetOrderQuery,
  useRecordOrderReceiptMutation,
} from '@/store/api/orders.api'

const ORDERS_LIST_PATH = '/kassir/buyurtmalar'
const ORDER_CREATE_PATH = '/kassir/buyurtma-yaratish'

export function OrderReceiptPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const orderQuery = useGetOrderQuery(id, { skip: !id })
  const [recordReceipt, receiptState] = useRecordOrderReceiptMutation()

  const order = orderQuery.data
  const canAccess = order?.status === 'pending_fulfillment'
  const autoPrintStartedRef = useRef(false)

  usePageMeta({
    title: pageTitle('Chek chop etish', 'Kassir'),
  })

  useEffect(() => {
    if (!order || !canAccess || autoPrintStartedRef.current) return
    if (order.receiptPrintedAt || order.receiptSkipped) return

    autoPrintStartedRef.current = true

    void (async () => {
      await runOrderReceiptPrintFlow(order, recordReceipt)
      navigate(ORDER_CREATE_PATH)
    })()
  }, [canAccess, id, navigate, order, recordReceipt])

  useEffect(() => {
    if (!orderQuery.error) return
    notify.error(getApiErrorMessage(orderQuery.error, 'Buyurtmani yuklab bo\'lmadi'))
  }, [orderQuery.error])

  async function proceedToFulfillment(action: 'print' | 'skip', print = false) {
    if (!order) return

    try {
      if (print) {
        await printOrderReceipt(order)
      }

      await recordReceipt({ id, body: { action } }).unwrap()
      notify.success(
        action === 'print' ? 'Chek chop etildi' : 'Chek atkaz qilindi',
      )
      navigate(ORDER_CREATE_PATH)
    } catch (err) {
      notify.error(
        getApiErrorMessage(
          err,
          action === 'print'
            ? 'Chekni chop etib bo\'lmadi'
            : 'Chekni atkaz qilib bo\'lmadi',
        ),
      )
    }
  }

  if (orderQuery.isLoading) {
    return <FormPageSkeleton sections={2} fieldsPerSection={3} />
  }

  if (!order) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={ORDERS_LIST_PATH}>
            <AppIcon name="arrow-left" />
            Orqaga
          </Link>
        </Button>
        <p className="text-muted-foreground">Buyurtma topilmadi</p>
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={ORDERS_LIST_PATH}>
            <AppIcon name="arrow-left" />
            Orqaga
          </Link>
        </Button>
        <p className="text-muted-foreground">
          Bu buyurtma uchun chek chiqarish mumkin emas.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={`/kassir/buyurtmalar/${id}`}>
              <AppIcon name="arrow-left" />
              Buyurtmaga qaytish
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Chek — #{formatOrderDisplayId(order.id)}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={receiptState.isLoading}
            onClick={() => void proceedToFulfillment('skip')}
          >
            Chekni atkaz qilish
          </Button>
          <Button
            disabled={receiptState.isLoading}
            onClick={() => void proceedToFulfillment('print', true)}
          >
            {receiptState.isLoading ? (
              <AppIcon name="loader" className="animate-spin" />
            ) : (
              <AppIcon name="clipboard-list" />
            )}
            Chekni chop etish
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chek ko&apos;rinishi</CardTitle>
          <CardDescription>
            {formatDateDisplay(order.createdAt) || '—'} ·{' '}
            {formatOrderPhone(order.customerPhone)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">Mijoz</dt>
              <dd className="font-medium">{order.customerName || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Manzil</dt>
              <dd className="font-medium">{formatOrderAddress(order)}</dd>
            </div>
          </dl>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Maxsulot</TableHead>
                <TableHead className="text-right">Soni</TableHead>
                <TableHead className="text-right">Narx</TableHead>
                <TableHead className="text-right">Jami</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow key={`${item.productId}-${index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(item.lineTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-wrap justify-end gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Chegirma: </span>
              <span className="font-medium tabular-nums">
                {formatMoney(order.discountTotal)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Umumiy: </span>
              <span className="font-semibold tabular-nums">
                {formatMoney(order.total)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">To&apos;landi: </span>
              <span className="font-semibold tabular-nums">
                {formatMoney(order.paidTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
