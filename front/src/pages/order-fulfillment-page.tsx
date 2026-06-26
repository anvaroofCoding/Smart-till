import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { FormPageSkeleton } from '@/components/loading'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
} from '@/components/shared/table-filter-field'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { formatMoney } from '@/lib/format-money'
import {
  formatOrderDisplayId,
  formatOrderPhone,
  ORDER_STATUS_LABELS,
} from '@/lib/order-display'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  useCancelOrderMutation,
  useFulfillOrderMutation,
  useGetOrderQuery,
} from '@/store/api/orders.api'

const ORDERS_LIST_PATH = '/kassir/buyurtmalar'
const FULFILLMENT_LIST_PATH = '/kassir/buyurtmani-chiqim-qilish'

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-semibold tracking-tight">{children}</h2>
  )
}

export function OrderFulfillmentPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const orderQuery = useGetOrderQuery(id, { skip: !id })
  const [fulfillOrder, fulfillState] = useFulfillOrderMutation()
  const [cancelOrder, cancelState] = useCancelOrderMutation()
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const order = orderQuery.data
  const canFulfill = order?.status === 'pending_fulfillment'

  usePageMeta({
    title: pageTitle('Buyurtma chiqimi', 'Kassir'),
  })

  useEffect(() => {
    if (!order?.items.length) return
    setCheckedItems(
      Object.fromEntries(
        order.items.map((item, index) => [index, item.fulfilled ?? false]),
      ),
    )
  }, [order?.id, order?.items])

  useEffect(() => {
    if (!orderQuery.error) return
    notify.error(getApiErrorMessage(orderQuery.error, 'Buyurtmani yuklab bo\'lmadi'))
  }, [orderQuery.error])

  const allChecked = useMemo(() => {
    if (!order?.items.length) return false
    return order.items.every((_, index) => checkedItems[index])
  }, [order?.items, checkedItems])

  function toggleItem(index: number, checked: boolean) {
    setCheckedItems((prev) => ({ ...prev, [index]: checked }))
    setValidationError(null)
  }

  function validateFulfillment(): string | null {
    if (!order?.items.length) return 'Maxsulotlar topilmadi'
    if (!allChecked) return 'Barcha maxsulotlarni belgilang'
    return null
  }

  async function handleFulfill() {
    if (!order) return

    const message = validateFulfillment()
    if (message) {
      setValidationError(message)
      setConfirmOpen(false)
      return
    }

    try {
      await fulfillOrder({
        id,
        body: {
          items: order.items.map((_, index) => ({
            index,
            fulfilled: Boolean(checkedItems[index]),
          })),
        },
      }).unwrap()

      notify.success('Buyurtma tasdiqlandi')
      setConfirmOpen(false)
      navigate(FULFILLMENT_LIST_PATH)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Buyurtmani tasdiqlab bo\'lmadi'),
      )
    }
  }

  async function handleCancelOrder() {
    if (!id) return

    try {
      await cancelOrder(id).unwrap()
      notify.success('Buyurtma bekor qilindi')
      setCancelDialogOpen(false)
      navigate(FULFILLMENT_LIST_PATH)
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Buyurtmani bekor qilib bo\'lmadi'))
    }
  }

  if (orderQuery.isLoading) {
    return <FormPageSkeleton sections={2} fieldsPerSection={3} />
  }

  if (!order) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={FULFILLMENT_LIST_PATH}>
            <AppIcon name="arrow-left" />
            Orqaga
          </Link>
        </Button>
        <p className="text-muted-foreground">Buyurtma topilmadi</p>
      </div>
    )
  }

  if (!canFulfill) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={FULFILLMENT_LIST_PATH}>
            <AppIcon name="arrow-left" />
            Orqaga
          </Link>
        </Button>
        <p className="text-muted-foreground">
          Bu buyurtma uchun chiqim qilish mumkin emas (
          {ORDER_STATUS_LABELS[order.status] ?? order.status}).
        </p>
        {order.status === 'confirmed' && (
          <Button asChild variant="outline" className="w-fit">
            <Link to={`${ORDERS_LIST_PATH}/${id}`}>Buyurtmani ko&apos;rish</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={FULFILLMENT_LIST_PATH}>
              <AppIcon name="arrow-left" />
              Chiqim ro&apos;yxati
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Chiqim — #{formatOrderDisplayId(order.id)}
            </h1>
            <Badge
              variant="outline"
              className="border-violet-500/40 text-violet-600"
            >
              {ORDER_STATUS_LABELS.pending_fulfillment}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={cancelState.isLoading || fulfillState.isLoading}
            onClick={() => setCancelDialogOpen(true)}
          >
            Buyurtmani bekor qilish
          </Button>
          <Button
            disabled={!allChecked || fulfillState.isLoading || cancelState.isLoading}
            onClick={() => {
              const message = validateFulfillment()
              if (message) {
                setValidationError(message)
                return
              }
              setValidationError(null)
              setConfirmOpen(true)
            }}
          >
            <AppIcon name="check" />
            Buyurtmani tasdiqlash
          </Button>
        </div>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="min-h-0 flex-1 space-y-6 overflow-auto">
          {validationError && (
            <p className="text-destructive text-sm">{validationError}</p>
          )}

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
                <TableRow>
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    Mijoz
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.customerName || '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    Telefon
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatOrderPhone(order.customerPhone)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    Umumiy narx
                  </TableCell>
                  <TableCell className="text-sm font-semibold tabular-nums">
                    {formatMoney(order.total)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground text-sm font-medium">
                    Maxsulotlar soni
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {order.items.length}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          <section className="space-y-2">
            <SectionTitle>Maxsulotlar</SectionTitle>
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">№</TableHead>
                  <TableHead>Maxsulot nomi</TableHead>
                  <TableHead className="text-right">Soni</TableHead>
                  <TableHead className="text-right">Umumiy narx</TableHead>
                  <TableHead className="w-14 text-center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow
                    key={`${item.productId}-${index}`}
                    className={cn(
                      checkedItems[index] && 'bg-muted/30',
                    )}
                  >
                    <TableCell className="text-muted-foreground text-center tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="max-w-[320px] font-medium">
                      <span className="line-clamp-2">{item.productName}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMoney(item.lineTotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          id={`fulfill-${index}`}
                          checked={Boolean(checkedItems[index])}
                          onCheckedChange={(checked) =>
                            toggleItem(index, checked === true)
                          }
                          aria-label={`${item.productName} tasdiqlash`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buyurtmani tasdiqlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Buyurtma yakuniy tasdiqlanadi va chiqim qilingan hisoblanadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={fulfillState.isLoading}>
              Yo&apos;q
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={fulfillState.isLoading}
              onClick={() => void handleFulfill()}
            >
              {fulfillState.isLoading ? 'Tasdiqlanmoqda...' : 'Ha, tasdiqlash'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buyurtmani bekor qilasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Rostdan ham bu buyurtmani bekor qilmoqchimisiz? Buyurtma
              &quot;Bekor qilingan&quot; holatida saqlanadi va chiqim ro&apos;yxatidan
              olib tashlanadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelState.isLoading}>
              Yo&apos;q
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={cancelState.isLoading}
              onClick={(event) => {
                event.preventDefault()
                void handleCancelOrder()
              }}
            >
              {cancelState.isLoading ? 'Bekor qilinmoqda...' : 'Ha, bekor qilish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
