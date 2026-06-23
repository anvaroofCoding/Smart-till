import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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
  useAcceptStockReceiptMutation,
  useGetStockReceiptQuery,
} from '@/store/api/stock-receipts.api'
import type { StockReceiptItemRecord } from '@/types/stock-receipt.types'

const LIST_PATH = '/omborlar/kirim-qabul'

interface AcceptRowState {
  received: boolean
  receivedQuantity: string
}

function formatAmount(value: number) {
  return value.toLocaleString('uz-UZ', {
    maximumFractionDigits: 2,
  })
}

function buildInitialRows(items: StockReceiptItemRecord[]): Record<string, AcceptRowState> {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      { received: false, receivedQuantity: String(item.quantity) },
    ]),
  )
}

export function StockReceiptAcceptPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [rows, setRows] = useState<Record<string, AcceptRowState>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const receiptQuery = useGetStockReceiptQuery(id, { skip: !id })
  const [acceptReceipt, acceptState] = useAcceptStockReceiptMutation()

  const receipt = receiptQuery.data
  const isAcceptable =
    receipt?.status === 'in_progress' && Boolean(receipt.submittedAt)

  usePageMeta({
    title: pageTitle(receipt?.name ?? 'Kirimni qabul qilish', 'Omborlar'),
  })

  useEffect(() => {
    if (!receipt?.items.length) return
    setRows(buildInitialRows(receipt.items))
  }, [receipt?.id, receipt?.items])

  useEffect(() => {
    if (!receiptQuery.error) return
    notify.error(
      getApiErrorMessage(receiptQuery.error, "Kirimni yuklab bo'lmadi"),
    )
  }, [receiptQuery.error])

  const receivedSummary = useMemo(() => {
    if (!receipt) return []
    return receipt.items
      .filter((item) => rows[item.id]?.received)
      .map((item) => ({
        name: item.productName,
        ordered: item.quantity,
        received: Number(rows[item.id]?.receivedQuantity ?? 0),
      }))
  }, [receipt, rows])

  function toggleReceived(itemId: string, checked: boolean) {
    const item = receipt?.items.find((entry) => entry.id === itemId)
    if (!item) return

    setRows((prev) => ({
      ...prev,
      [itemId]: {
        received: checked,
        receivedQuantity: checked
          ? prev[itemId]?.receivedQuantity || String(item.quantity)
          : prev[itemId]?.receivedQuantity || String(item.quantity),
      },
    }))
    setValidationError(null)
  }

  function updateReceivedQuantity(itemId: string, value: string) {
    setRows((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        receivedQuantity: value,
      },
    }))
    setValidationError(null)
  }

  function validateAccept(): string | null {
    if (!receipt) return 'Kirim topilmadi'

    let receivedCount = 0

    for (const item of receipt.items) {
      const row = rows[item.id]
      if (!row?.received) continue

      const qty = Number(row.receivedQuantity)
      if (!row.receivedQuantity.trim() || Number.isNaN(qty) || qty <= 0) {
        return `${item.productName} uchun qabul miqdorini kiriting`
      }
      if (qty > item.quantity) {
        return `${item.productName} uchun qabul miqdori buyurtmadan oshmasligi kerak`
      }
      receivedCount += 1
    }

    if (receivedCount === 0) {
      return 'Kamida bitta maxsulotni belgilang'
    }

    return null
  }

  async function handleAccept() {
    if (!receipt) return

    const message = validateAccept()
    if (message) {
      setValidationError(message)
      setConfirmOpen(false)
      return
    }

    setValidationError(null)

    try {
      await acceptReceipt({
        id,
        body: {
          items: receipt.items.map((item) => {
            const row = rows[item.id]
            return {
              itemId: item.id,
              received: Boolean(row?.received),
              receivedQuantity: row?.received
                ? Number(row.receivedQuantity)
                : undefined,
            }
          }),
        },
      }).unwrap()

      notify.success('Kirim qabul qilindi')
      setConfirmOpen(false)
      navigate(LIST_PATH)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Kirimni qabul qilish amalga oshmadi'),
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

  if (!isAcceptable) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={LIST_PATH}>
            <AppIcon name="arrow-left" />
            Orqaga
          </Link>
        </Button>
        <p className="text-muted-foreground">
          {!receipt.submittedAt
            ? 'Bu kirim hali yuborilmagan. Avval kirimni yuborish kerak.'
            : `Bu kirim ${RECEIPT_STATUS_LABELS[receipt.status].toLowerCase()}. Qabul qilib bo'lmaydi.`}
        </p>
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
            <Badge variant="secondary">
              {RECEIPT_STATUS_LABELS[receipt.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Kelgan maxsulotlarni belgilang va qabul miqdorini kiriting.
          </p>
        </div>

        <Button
          disabled={receipt.items.length === 0 || acceptState.isLoading}
          onClick={() => {
            const message = validateAccept()
            if (message) {
              setValidationError(message)
              return
            }
            setValidationError(null)
            setConfirmOpen(true)
          }}
        >
          <AppIcon name="check" />
          Kirimni qabul qilish
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kirim ma&apos;lumotlari</CardTitle>
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
            Kelgan maxsulotni belgilang va haqiqiy miqdorni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-auto">
          {validationError && (
            <p className="text-destructive mb-4 text-sm">{validationError}</p>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">№</TableHead>
                <TableHead>Maxsulot</TableHead>
                <TableHead className="text-right">Buyurtma</TableHead>
                <TableHead className="w-24 text-center">Keldi</TableHead>
                <TableHead className="text-right">Qabul miqdori</TableHead>
                <TableHead className="text-right">Narx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipt.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-24 text-center"
                  >
                    Maxsulotlar qo&apos;shilmagan
                  </TableCell>
                </TableRow>
              ) : (
                receipt.items.map((item, index) => {
                  const row = rows[item.id]
                  const isReceived = Boolean(row?.received)

                  return (
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
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            id={`received-${item.id}`}
                            checked={isReceived}
                            onCheckedChange={(checked) =>
                              toggleReceived(item.id, checked === true)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          max={item.quantity}
                          disabled={!isReceived}
                          value={row?.receivedQuantity ?? ''}
                          onChange={(e) =>
                            updateReceivedQuantity(item.id, e.target.value)
                          }
                          className="ml-auto w-28 text-right tabular-nums"
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(item.unitPrice)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirimni qabul qilasizmi?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  <span className="text-foreground font-medium">
                    {receipt.name}
                  </span>{' '}
                  qabul qilinganda belgilangan maxsulotlar omborga yoziladi.
                </p>
                {receivedSummary.length > 0 && (
                  <div className="rounded-lg border p-3">
                    <p className="text-foreground mb-2 text-sm font-medium">
                      Qabul qilinadigan maxsulotlar
                    </p>
                    <ul className="space-y-1 text-sm">
                      {receivedSummary.map((item) => (
                        <li
                          key={item.name}
                          className="flex items-center justify-between gap-3"
                        >
                          <span>{item.name}</span>
                          <span className="tabular-nums">
                            {formatAmount(item.received)} /{' '}
                            {formatAmount(item.ordered)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acceptState.isLoading}>
              Bekor qilish
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={acceptState.isLoading}
              onClick={() => void handleAccept()}
            >
              {acceptState.isLoading ? 'Qabul qilinmoqda...' : 'Ha, qabul qilish'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
