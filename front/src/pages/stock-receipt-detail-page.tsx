import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { StockReceiptProductDialog } from '@/components/stock-receipts/stock-receipt-product-dialog'
import { TruncatedDescriptionCell } from '@/components/shared/truncated-description-cell'
import { FormPageSkeleton } from '@/components/loading'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
} from '@/components/shared/table-filter-field'
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
import { notify } from '@/lib/notify'
import {
  RECEIPT_PAYMENT_TYPE_LABELS,
  RECEIPT_STATUS_LABELS,
} from '@/lib/stock-receipt'
import { cn } from '@/lib/utils'
import {
  useAddStockReceiptItemMutation,
  useCancelStockReceiptMutation,
  useGetStockReceiptQuery,
  useRemoveStockReceiptItemMutation,
  useSubmitStockReceiptMutation,
} from '@/store/api/stock-receipts.api'

const LIST_PATH = '/omborlar/maxsulot-kirim'

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-semibold tracking-tight">{children}</h2>
  )
}

function ReceiptStatusBadge({
  status,
}: {
  status: 'in_progress' | 'completed' | 'cancelled'
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'completed' && 'border-emerald-500/40 text-emerald-600',
        status === 'in_progress' && 'border-amber-500/40 text-amber-600',
        status === 'cancelled' && 'border-destructive/40 text-destructive',
      )}
    >
      {RECEIPT_STATUS_LABELS[status]}
    </Badge>
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

  const productTableColSpan =
    (isEditable ? 1 : 0) + (receipt.status === 'completed' ? 1 : 0) + 5

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={LIST_PATH}>
              <AppIcon name="arrow-left" />
              Kirimlar ro&apos;yxati
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {receipt.name}
            </h1>
            <ReceiptStatusBadge status={receipt.status} />
          </div>
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

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="min-h-0 flex-1 space-y-6 overflow-auto">
          <section className="space-y-2">
            <SectionTitle>Kirim ma&apos;lumotlari</SectionTitle>
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[38%] max-w-[220px]">Maydon</TableHead>
                  <TableHead>Qiymat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <InfoRow
                  label="Yetkazib beruvchi"
                  value={receipt.supplier.name}
                />
                <InfoRow label="Ombor" value={receipt.warehouse.name} />
                <InfoRow
                  label="To'lov turi"
                  value={RECEIPT_PAYMENT_TYPE_LABELS[receipt.paymentType]}
                />
                <InfoRow
                  label="Valyuta kursi"
                  value={
                    <span className="tabular-nums">
                      {formatMoney(receipt.exchangeRate)}
                    </span>
                  }
                />
                <InfoRow
                  label="Jami summa"
                  value={
                    <span className="font-semibold tabular-nums">
                      {formatMoney(receipt.totalAmount)}
                    </span>
                  }
                />
                {receipt.notes?.trim() ? (
                  <InfoRow
                    label="Izoh"
                    value={
                      <TruncatedDescriptionCell
                        title="Kirim izohi"
                        description={receipt.notes}
                        dialogSubtitle={receipt.name}
                        lines={2}
                        className="max-w-full"
                      />
                    }
                  />
                ) : null}
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
                  <TableHead className="text-right">Miqdor</TableHead>
                  {receipt.status === 'completed' && (
                    <TableHead className="text-right">Qabul miqdori</TableHead>
                  )}
                  <TableHead className="text-right">Narx</TableHead>
                  <TableHead className="text-right">Summa</TableHead>
                  {isEditable && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={productTableColSpan}
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
                      <TableCell className="max-w-[320px] font-medium">
                        <span className="line-clamp-2">{item.productName}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.quantity)}
                      </TableCell>
                      {receipt.status === 'completed' && (
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(item.receivedQuantity ?? 0)}
                        </TableCell>
                      )}
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatMoney(item.totalPrice)}
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
          </section>
        </div>
      </div>

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
              lekin omborga yozilmaydi.
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
              yuborilgandan keyin qabul qilish bo&apos;limida tasdiqlanadi.
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
