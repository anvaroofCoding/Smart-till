import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { OrderQuantityInput } from '@/components/orders/order-quantity-input'
import { FormPageSkeleton } from '@/components/loading'
import { TransferNakladnoyButton } from '@/components/warehouse-transfers/transfer-nakladnoy-button'
import { TransferQrPanel } from '@/components/warehouse-transfers/transfer-qr-panel'
import { TransferQrScannerButton } from '@/components/warehouse-transfers/transfer-qr-scanner-dialog'
import { TransferRouteDisplay } from '@/components/warehouse-transfers/transfer-route-display'
import { TransferStatusBadge } from '@/components/warehouse-transfers/transfer-status-badge'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
  TABLE_FILTER_FIELD_CLASS,
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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldLabel,
} from '@/components/ui/field'
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
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
import { pageTitle } from '@/config/seo'
import { formatDateDisplay } from '@/lib/date-format'
import { getApiErrorMessage } from '@/lib/api-error'
import { getProductBarcodes, matchesProductBarcode } from '@/lib/product-barcodes'
import { notify } from '@/lib/notify'
import {
  canAcceptTransfer,
  isTransferRecipient,
} from '@/lib/warehouse-transfer-access'
import {
  useAcceptWarehouseTransferMutation,
  useGetWarehouseTransferQuery,
  useUpdateAcceptanceProgressMutation,
} from '@/store/api/warehouse-transfers.api'
import type {
  WarehouseTransferItemRecord,
  WarehouseTransferRecord,
} from '@/types/warehouse-transfer.types'

const LIST_PATH = '/transfer/qabul-qilish'

interface AcceptRowState {
  received: boolean
  receivedQuantity: number
}

function formatAmount(value: number) {
  return value.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })
}

function buildInitialRows(
  items: WarehouseTransferItemRecord[],
): Record<string, AcceptRowState> {
  return Object.fromEntries(
    items.map((item) => {
      const receivedQuantity = item.receivedQuantity ?? 0
      const received =
        item.receivedMarked ??
        (receivedQuantity > 0 && receivedQuantity >= item.quantity)

      return [
        item.id,
        { received, receivedQuantity },
      ]
    }),
  )
}

function buildProgressBody(
  transfer: WarehouseTransferRecord,
  rows: Record<string, AcceptRowState>,
) {
  return {
    items: transfer.items.map((item) => ({
      itemId: item.id,
      received: rows[item.id]?.received ?? false,
      receivedQuantity: rows[item.id]?.receivedQuantity ?? 0,
    })),
  }
}

function resolveReceivedFlag(
  quantity: number,
  sentQuantity: number,
  previousReceived: boolean,
): boolean {
  if (quantity >= sentQuantity) return true
  if (quantity <= 0) return false
  return previousReceived
}

function isPartialAccept(
  items: WarehouseTransferItemRecord[],
  rows: Record<string, AcceptRowState>,
): boolean {
  for (const item of items) {
    const row = rows[item.id]
    if (!row?.received) return true

    if (row.receivedQuantity < item.quantity) {
      return true
    }
  }

  return false
}

function findItemByBarcode(
  items: WarehouseTransferItemRecord[],
  barcode: string,
): WarehouseTransferItemRecord | undefined {
  const normalized = barcode.trim()
  if (!normalized) return undefined

  return items.find((item) => matchesProductBarcode(item, normalized))
}

export function WarehouseTransferAcceptPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useUserWarehouseAccess()
  const [rows, setRows] = useState<Record<string, AcceptRowState>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const initializedTransferIdRef = useRef<string | null>(null)
  const saveTimerRef = useRef<number | null>(null)
  const rowsRef = useRef<Record<string, AcceptRowState>>({})

  const transferQuery = useGetWarehouseTransferQuery(id, { skip: !id })
  const [acceptTransfer, acceptState] = useAcceptWarehouseTransferMutation()
  const [updateProgress, progressState] = useUpdateAcceptanceProgressMutation()

  const transfer = transferQuery.data
  const isAcceptable = transfer ? canAcceptTransfer(user, transfer) : false

  usePageMeta({
    title: pageTitle(transfer?.name || transfer?.code || 'Transferni qabul qilish', 'Transfer'),
  })

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  useEffect(() => {
    if (!transfer?.items.length) return
    if (initializedTransferIdRef.current === transfer.id) return

    initializedTransferIdRef.current = transfer.id
    setRows(buildInitialRows(transfer.items))
  }, [transfer?.id, transfer?.items])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const persistProgress = useCallback(
    async (nextRows: Record<string, AcceptRowState>) => {
      if (!transfer || !canAcceptTransfer(user, transfer)) return

      try {
        await updateProgress({
          id: transfer.id,
          body: buildProgressBody(transfer, nextRows),
        }).unwrap()
      } catch (err) {
        notify.error(
          getApiErrorMessage(err, 'Qabul jarayonini saqlab bo\'lmadi'),
        )
      }
    },
    [transfer, updateProgress, user],
  )

  const schedulePersistProgress = useCallback(
    (nextRows: Record<string, AcceptRowState>) => {
      if (!transfer || !canAcceptTransfer(user, transfer)) return

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = window.setTimeout(() => {
        void persistProgress(nextRows).catch(() => undefined)
      }, 400)
    },
    [persistProgress, transfer, user],
  )

  useEffect(() => {
    if (!transferQuery.error) return
    notify.error(
      getApiErrorMessage(transferQuery.error, "Transferni yuklab bo'lmadi"),
    )
  }, [transferQuery.error])

  useEffect(() => {
    if (!transfer || transferQuery.isLoading || transferQuery.isFetching) return

    if (!isTransferRecipient(user, transfer)) {
      notify.error('Bu transferni faqat qabul qiluvchi ombor xodimi ko\'ra oladi')
      navigate(LIST_PATH, { replace: true })
    }
  }, [
    navigate,
    transfer,
    transferQuery.isFetching,
    transferQuery.isLoading,
    user,
  ])

  useEffect(() => {
    if (!isAcceptable || transferQuery.isLoading) return
    window.requestAnimationFrame(() => barcodeInputRef.current?.focus())
  }, [isAcceptable, transferQuery.isLoading, transfer?.id])

  const receivedSummary = useMemo(() => {
    if (!transfer) return []
    return transfer.items
      .filter((item) => rows[item.id]?.received)
      .map((item) => ({
        name: item.productName,
        sent: item.quantity,
        received: rows[item.id]?.receivedQuantity ?? 0,
      }))
  }, [transfer, rows])

  function focusBarcodeInput() {
    window.requestAnimationFrame(() => barcodeInputRef.current?.focus())
  }

  function applyReceivedQuantity(
    item: WarehouseTransferItemRecord,
    nextQuantity: number,
  ) {
    const capped = Math.min(Math.max(0, nextQuantity), item.quantity)

    setRows((prev) => {
      const previous = prev[item.id]
      const nextRows = {
        ...prev,
        [item.id]: {
          receivedQuantity: capped,
          received: resolveReceivedFlag(
            capped,
            item.quantity,
            previous?.received ?? false,
          ),
        },
      }
      schedulePersistProgress(nextRows)
      return nextRows
    })
    setValidationError(null)
  }

  function handleBarcodeScan(rawBarcode?: string) {
    if (!transfer || !isAcceptable) return

    const barcode = (rawBarcode ?? barcodeSearch).trim()
    if (!barcode) return

    const item = findItemByBarcode(transfer.items, barcode)
    if (!item) {
      notify.error('Bu transferda bunday maxsulot topilmadi')
      setBarcodeSearch('')
      focusBarcodeInput()
      return
    }

    const current = rows[item.id]?.receivedQuantity ?? 0
    if (current >= item.quantity) {
      notify.error(
        `${item.productName} uchun yuborilgan miqdordan (${formatAmount(item.quantity)}) oshib ketdi`,
      )
      setBarcodeSearch('')
      focusBarcodeInput()
      return
    }

    applyReceivedQuantity(item, current + 1)
    setBarcodeSearch('')
    focusBarcodeInput()
  }

  function toggleReceived(itemId: string, checked: boolean) {
    const item = transfer?.items.find((entry) => entry.id === itemId)
    if (!item) return

    setRows((prev) => {
      const nextRows = {
        ...prev,
        [itemId]: {
          received: checked,
          receivedQuantity: checked
            ? Math.max(prev[itemId]?.receivedQuantity ?? 0, 1)
            : (prev[itemId]?.receivedQuantity ?? 0),
        },
      }
      schedulePersistProgress(nextRows)
      return nextRows
    })
    setValidationError(null)
  }

  function updateReceivedQuantity(itemId: string, quantity: number) {
    const item = transfer?.items.find((entry) => entry.id === itemId)
    if (!item) return

    applyReceivedQuantity(item, quantity)
  }

  function validateAccept(): string | null {
    if (!transfer) return 'Transfer topilmadi'

    let receivedCount = 0

    for (const item of transfer.items) {
      const row = rows[item.id]
      if (!row?.received) continue

      if (row.receivedQuantity <= 0) {
        return `${item.productName} uchun qabul miqdorini kiriting`
      }
      if (row.receivedQuantity > item.quantity) {
        return `${item.productName} uchun qabul miqdori yuborilgandan oshmasligi kerak`
      }
      receivedCount += 1
    }

    if (receivedCount === 0) {
      return 'Kamida bitta maxsulotni belgilang'
    }

    return null
  }

  async function handleAccept() {
    if (!transfer) return

    const message = validateAccept()
    if (message) {
      setValidationError(message)
      setConfirmOpen(false)
      return
    }

    setValidationError(null)

    try {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
        await persistProgress(rowsRef.current)
      }

      await acceptTransfer({
        id,
        body: {
          items: transfer.items.map((item) => {
            const row = rows[item.id]
            return {
              itemId: item.id,
              received: Boolean(row?.received),
              receivedQuantity: row?.received
                ? row.receivedQuantity
                : undefined,
            }
          }),
        },
      }).unwrap()

      notify.success(
        isPartialAccept(transfer.items, rows)
          ? 'Transfer qisman qabul qilindi'
          : 'Transfer qabul qilindi',
      )
      setConfirmOpen(false)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Transferni qabul qilish amalga oshmadi'),
      )
    }
  }

  if (transferQuery.isLoading) {
    return <FormPageSkeleton sections={2} fieldsPerSection={3} />
  }

  if (!transfer) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={LIST_PATH}>
            <AppIcon name="arrow-left" />
            Orqaga
          </Link>
        </Button>
        <p className="text-muted-foreground">Transfer topilmadi</p>
      </div>
    )
  }

  const tableHeaders = isAcceptable
    ? (['№', 'Maxsulot', 'Yuborilgan', 'Qabul', 'Qabul miqdori', 'Narx'] as const)
    : (['№', 'Maxsulot', 'Yuborilgan', 'Qabul qilingan', 'Narx'] as const)

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
              {transfer.name || transfer.code}
            </h1>
            <TransferStatusBadge status={transfer.status} />
          </div>
          {transfer.name && (
            <p className="text-muted-foreground text-sm">{transfer.code}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <TransferQrScannerButton size="sm" />
          <TransferNakladnoyButton transfer={transfer} />
          {isAcceptable && (
            <Button
              disabled={
                transfer.items.length === 0 ||
                acceptState.isLoading ||
                progressState.isLoading
              }
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
              Qabul qilish
            </Button>
          )}
        </div>
      </div>

      <div className={`${LIST_PAGE_TABLE_SECTION_CLASS} lg:grid lg:grid-cols-[1fr_auto] lg:gap-4`}>
        <div className="min-w-0 space-y-4">
        <div className="shrink-0 space-y-3 px-1">
          <TransferRouteDisplay
            fromWarehouseName={transfer.fromWarehouseName}
            toWarehouseName={transfer.toWarehouseName}
          />
          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Sana:</span>{' '}
              <span className="text-foreground">
                {formatDateDisplay(transfer.transferDate) || '—'}
              </span>
            </div>
            {transfer.notes.trim() && (
              <div>
                <span className="text-muted-foreground">Izoh:</span>{' '}
                <span className="text-foreground">{transfer.notes.trim()}</span>
              </div>
            )}
          </div>
        </div>

        {isAcceptable && (
          <div className="shrink-0 px-1">
            <Field>
              <FieldLabel>Barcode orqali qabul qilish</FieldLabel>
              <Input
                ref={barcodeInputRef}
                value={barcodeSearch}
                placeholder="Barcode skanerlang yoki kiriting"
                className={TABLE_FILTER_FIELD_CLASS}
                autoComplete="off"
                onChange={(event) => setBarcodeSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  handleBarcodeScan()
                }}
              />
            </Field>
          </div>
        )}

        {validationError && (
          <p className="text-destructive shrink-0 px-1 text-sm">{validationError}</p>
        )}

        <div className="min-h-0 flex-1 overflow-auto">
          <Table className={BORDERLESS_TABLE_CLASS}>
            <TableHeader>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableHead
                    key={header}
                    className={
                      header === '№'
                        ? 'w-12 text-center'
                        : header === 'Qabul'
                          ? 'w-24 text-center'
                          : header === 'Yuborilgan' ||
                              header === 'Qabul miqdori' ||
                              header === 'Qabul qilingan' ||
                              header === 'Narx'
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
              {transfer.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableHeaders.length}
                    className="text-muted-foreground h-24 text-center"
                  >
                    Maxsulotlar yo&apos;q
                  </TableCell>
                </TableRow>
              ) : (
                transfer.items.map((item, index) => {
                  const row = rows[item.id]
                  const isReceived = Boolean(row?.received)
                  const receivedQty = row?.receivedQuantity ?? 0

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground text-center tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-0.5">
                          <span>{item.productName}</span>
                          {getProductBarcodes(item).map((barcode) => (
                            <span
                              key={barcode}
                              className="text-muted-foreground text-xs tabular-nums"
                            >
                              {barcode}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(item.quantity)}
                      </TableCell>
                      {isAcceptable ? (
                        <>
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
                            <OrderQuantityInput
                              value={receivedQty}
                              minQuantity={0}
                              maxQuantity={item.quantity}
                              allowDirectInput
                              onChange={(quantity) =>
                                updateReceivedQuantity(item.id, quantity)
                              }
                              onLimitExceeded={() => {
                                notify.error(
                                  `${item.productName} uchun yuborilgan miqdordan (${formatAmount(item.quantity)}) oshib ketdi`,
                                )
                              }}
                              className="ml-auto justify-end"
                            />
                          </TableCell>
                        </>
                      ) : (
                        <TableCell className="text-right tabular-nums">
                          {formatAmount(item.receivedQuantity ?? 0)}
                        </TableCell>
                      )}
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(item.unitPrice)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        </div>

        <div className="mt-4 flex justify-center lg:mt-0 lg:justify-start">
          <TransferQrPanel transfer={transfer} />
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transferni qabul qilasizmi?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  <span className="text-foreground font-medium">
                    {transfer.code}
                  </span>{' '}
                  qabul qilinganda belgilangan maxsulotlar omborga yoziladi.
                  Qisman qabul qilinsa, qolgan miqdor yuboruvchi omborga
                  qaytariladi.
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
                            {formatAmount(item.sent)}
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
