import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { StockReceiptProductDialog } from '@/components/stock-receipts/stock-receipt-product-dialog'
import { FormPageSkeleton } from '@/components/loading'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
import { notify } from '@/lib/notify'
import {
  RECEIPT_PAYMENT_TYPE_LABELS,
  RECEIPT_STATUS_LABELS,
} from '@/lib/stock-receipt'
import {
  useAddStockReceiptItemMutation,
  useCancelStockReceiptMutation,
  useGetStockReceiptQuery,
  useRemoveStockReceiptItemMutation,
  useSubmitStockReceiptMutation,
} from '@/store/api/stock-receipts.api'

const LIST_PATH = '/omborlar/maxsulot-kirim'

function formatAmount(value: number) {
  return value.toLocaleString('uz-UZ', {
    maximumFractionDigits: 2,
  })
}

function statusVariant(status: 'in_progress' | 'completed' | 'cancelled') {
  if (status === 'completed') return 'default'
  if (status === 'in_progress') return 'secondary'
  return 'destructive'
}

function statusDescription(
  status: 'in_progress' | 'completed' | 'cancelled',
  submittedAt?: string,
) {
  if (status === 'completed') {
    return 'Kirim qabul qilindi. Maxsulotlar omborga yozilgan.'
  }
  if (status === 'cancelled') {
    return 'Kirim bekor qilingan. Ma\'lumotlar saqlangan, lekin omborga yozilmagan.'
  }
  if (submittedAt) {
    return 'Kirim yuborilgan va Jarayonda. Qabul qilish bo\'limidan tasdiqlang.'
  }
  return 'Maxsulotlarni qo\'shing va tayyor bo\'lgach yuboring.'
}

export function StockReceiptDetailPage() {
  const { id = '' } = useParams()
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)

  const receiptQuery = useGetStockReceiptQuery(id, { skip: !id })
  const [addItem, addItemState] = useAddStockReceiptItemMutation()
  const [removeItem] = useRemoveStockReceiptItemMutation()
  const [cancelReceipt, cancelState] = useCancelStockReceiptMutation()
  const [submitReceipt, submitState] = useSubmitStockReceiptMutation()

  const receipt = receiptQuery.data
  const isInProgress = receipt?.status === 'in_progress'
  const isEditable = isInProgress && !receipt?.submittedAt
  const canCancel = isInProgress
  const canSubmit = isEditable

  usePageMeta({
    title: pageTitle(receipt?.name ?? 'Kirim', 'Omborlar'),
  })

  useEffect(() => {
    if (!receiptQuery.error) return
    notify.error(
      getApiErrorMessage(receiptQuery.error, "Kirimni yuklab bo'lmadi"),
    )
  }, [receiptQuery.error])

  async function handleAddProduct(values: {
    productId: string
    quantity: number
    unitPrice: number
  }) {
    try {
      await addItem({ id, body: values }).unwrap()
      notify.success("Maxsulot qo'shildi")
      setProductDialogOpen(false)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, "Maxsulot qo'shish amalga oshmadi"),
      )
    }
  }

  async function handleRemoveItem(itemId: string) {
    setRemovingItemId(itemId)
    try {
      await removeItem({ id, itemId }).unwrap()
      notify.success("Maxsulot o'chirildi")
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, "Maxsulotni o'chirib bo'lmadi"),
      )
    } finally {
      setRemovingItemId(null)
    }
  }

  async function handleCancel() {
    try {
      await cancelReceipt(id).unwrap()
      notify.success('Kirim bekor qilindi')
      setCancelDialogOpen(false)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Kirimni bekor qilish amalga oshmadi'),
      )
    }
  }

  async function handleSubmit() {
    try {
      await submitReceipt(id).unwrap()
      notify.success('Kirim yuborildi')
      setSubmitDialogOpen(false)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Kirimni yuborish amalga oshmadi'),
      )
    }
  }

  if (receiptQuery.isLoading) {
    return <FormPageSkeleton sections={2} fieldsPerSection={3} />
  }

  if (!receipt) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={LIST_PATH}>
            <AppIcon name="arrow-left" />
            Orqaga
          </Link>
        </Button>
        <p className="text-muted-foreground">Kirim topilmadi</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {receipt.name}
            </h1>
            <Badge variant={statusVariant(receipt.status)}>
              {RECEIPT_STATUS_LABELS[receipt.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {statusDescription(receipt.status, receipt.submittedAt)}
          </p>
        </div>

        {(canSubmit || canCancel) && (
          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <Button onClick={() => setProductDialogOpen(true)}>
                <AppIcon name="plus" />
                Maxsulot qo&apos;shish
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                disabled={cancelState.isLoading}
                onClick={() => setCancelDialogOpen(true)}
              >
                <AppIcon name="x" />
                Bekor qilish
              </Button>
            )}
            {canSubmit && (
              <Button
                variant="default"
                disabled={receipt.items.length === 0 || submitState.isLoading}
                onClick={() => setSubmitDialogOpen(true)}
              >
                <AppIcon name="chevron-right" />
                Yuborish
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kirim ma&apos;lumotlari</CardTitle>
          <CardDescription>Asosiy ma&apos;lumotlar</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted-foreground text-sm">Yetkazib beruvchi</dt>
              <dd className="font-medium">{receipt.supplier.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Ombor</dt>
              <dd className="font-medium">{receipt.warehouse.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">To&apos;lov turi</dt>
              <dd className="font-medium">
                {RECEIPT_PAYMENT_TYPE_LABELS[receipt.paymentType]}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Valyuta kursi</dt>
              <dd className="font-medium tabular-nums">
                {formatAmount(receipt.exchangeRate)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Jami summa</dt>
              <dd className="font-medium tabular-nums">
                {formatAmount(receipt.totalAmount)}
              </dd>
            </div>
            {receipt.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-muted-foreground text-sm">Izoh</dt>
                <dd className="mt-1 text-sm">{receipt.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="package" />
            Maxsulotlar
          </CardTitle>
          <CardDescription>
            {receipt.items.length} ta maxsulot qo&apos;shilgan
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">№</TableHead>
                <TableHead>Maxsulot</TableHead>
                <TableHead className="text-right">Miqdor</TableHead>
                {receipt.status === 'completed' && (
                  <TableHead className="text-right">Qabul miqdori</TableHead>
                )}
                <TableHead className="text-right">Narx</TableHead>
                <TableHead className="text-right">Summa</TableHead>
                {isEditable && (
                  <TableHead className="text-right">Amallar</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipt.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      isEditable
                        ? 6
                        : receipt.status === 'completed'
                          ? 6
                          : 5
                    }
                    className="text-muted-foreground h-24 text-center"
                  >
                    Maxsulotlar qo&apos;shilmagan
                  </TableCell>
                </TableRow>
              ) : (
                receipt.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground text-center tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(item.quantity)}
                    </TableCell>
                    {receipt.status === 'completed' && (
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(item.receivedQuantity ?? 0)}
                      </TableCell>
                    )}
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(item.totalPrice)}
                    </TableCell>
                    {isEditable && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={removingItemId === item.id}
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label="O'chirish"
                          className="text-destructive hover:text-destructive"
                        >
                          <AppIcon name="trash-2" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StockReceiptProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        excludedProductIds={receipt.items.map((item) => item.productId)}
        isSaving={addItemState.isLoading}
        onSubmit={handleAddProduct}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirimni bekor qilasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-foreground font-medium">{receipt.name}</span>{' '}
              bekor qilinganda barcha qo&apos;shilgan maxsulotlar saqlanib qoladi,
              lekin omborga yozilmaydi. Holat &quot;Bekor qilindi&quot; bo&apos;ladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelState.isLoading}>
              Yo&apos;q
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelState.isLoading}
              onClick={() => void handleCancel()}
            >
              {cancelState.isLoading ? 'Bekor qilinmoqda...' : 'Ha, bekor qilish'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirimni yuborasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-foreground font-medium">{receipt.name}</span>{' '}
              yuborilgandan keyin holat &quot;Jarayonda&quot; bo&apos;lib qoladi.
              Qabul qilish faqat &quot;Kirimni qabul qilish&quot; bo&apos;limida
              amalga oshiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitState.isLoading}>
              Bekor qilish
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={submitState.isLoading}
              onClick={() => void handleSubmit()}
            >
              {submitState.isLoading ? 'Yuborilmoqda...' : 'Ha, yuborish'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
