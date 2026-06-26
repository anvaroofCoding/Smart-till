import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { OrderQuantityInput } from '@/components/orders/order-quantity-input'
import { FormPageSkeleton } from '@/components/loading'
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
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueriesLoading } from '@/hooks/use-query-loading'
import { useTransferProductSearch } from '@/hooks/use-transfer-product-search'
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
import { pageTitle } from '@/config/seo'
import { toIsoDateString, formatDateDisplay } from '@/lib/date-format'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { resolveSenderWarehouseId } from '@/lib/transfer-sender-warehouse'
import { cn } from '@/lib/utils'
import {
  useGetWarehouseTransferQuery,
  useSendWarehouseTransferDraftMutation,
  useUpdateWarehouseTransferDraftMutation,
} from '@/store/api/warehouse-transfers.api'
import { useGetWarehousesQuery } from '@/store/api/warehouses.api'
import type { WarehouseStockRecord } from '@/types/warehouse-stock.types'

const LIST_PATH = '/transfer/transferlar'

interface TransferLine {
  productId: string
  productName: string
  productCode: string
  quantity: number
  unitPrice: number
}

function mapDraftItemsToLines(
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }>,
): TransferLine[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    productCode: '',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }))
}

function formatAmount(value: number) {
  return value.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })
}

export function WarehouseTransferCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const draftIdFromUrl = searchParams.get('draftId')

  const [draftId, setDraftId] = useState<string | null>(draftIdFromUrl)
  const [transferName, setTransferName] = useState('')
  const [lines, setLines] = useState<TransferLine[]>([])
  const [notes, setNotes] = useState('')
  const [sendOpen, setSendOpen] = useState(false)
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [toWarehouseName, setToWarehouseName] = useState('')
  const [transferDate, setTransferDate] = useState(() => toIsoDateString(new Date()))
  const [error, setError] = useState<string | null>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const saveTimerRef = useRef<number | null>(null)
  const draftIdRef = useRef<string | null>(draftIdFromUrl)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    draftIdRef.current = draftId
  }, [draftId])

  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })
  const {
    isLoading: isLoadingAccess,
    allWarehouses,
    warehouseIds,
    warehouses: assignedWarehouses,
    filterWarehouses,
  } = useUserWarehouseAccess()
  const [updateDraft] = useUpdateWarehouseTransferDraftMutation()
  const [sendDraft, sendState] = useSendWarehouseTransferDraftMutation()

  const availableWarehouses = allWarehouses
    ? (warehousesQuery.data?.data ?? [])
    : filterWarehouses(warehousesQuery.data?.data ?? [])

  const fromWarehouseId = useMemo(
    () =>
      resolveSenderWarehouseId(warehouseIds, availableWarehouses, allWarehouses),
    [allWarehouses, availableWarehouses, warehouseIds],
  )

  const shouldLoadDraft = Boolean(draftIdFromUrl) && !draftLoaded

  const draftByIdQuery = useGetWarehouseTransferQuery(draftIdFromUrl ?? '', {
    skip: !shouldLoadDraft,
  })

  const fromWarehouseName = useMemo(() => {
    const warehouse = availableWarehouses.find(
      (item) => item.id === fromWarehouseId,
    )
    if (warehouse) return warehouse.name

    const assigned = assignedWarehouses.find((item) => item.id === fromWarehouseId)
    return assigned?.name ?? '—'
  }, [assignedWarehouses, availableWarehouses, fromWarehouseId])

  const excludedProductIds = useMemo(
    () => lines.map((line) => line.productId),
    [lines],
  )

  const {
    search,
    comboOpen,
    selectedRow,
    availableRows,
    isLoading: isSearchLoading,
    isStockReady,
    setComboOpen,
    handleSearchChange,
    handleSelectRow,
    resetSelection,
    resolveRowForSubmit,
    handleSearchKeyDown,
    highlightedIndex,
    getAvailableQuantity,
  } = useTransferProductSearch({
    warehouseId: fromWarehouseId,
    excludedProductIds,
  })

  const { showSkeleton } = useQueriesLoading([
    warehousesQuery,
    { isLoading: isLoadingAccess, isFetching: isLoadingAccess },
    ...(shouldLoadDraft ? [draftByIdQuery] : []),
  ])

  usePageMeta({
    title: pageTitle(draftId ? 'Transferni tahrirlash' : 'Yangi transfer', 'Transfer'),
  })

  useEffect(() => {
    if (draftLoaded || showSkeleton) return

    if (!draftIdFromUrl) {
      navigate(LIST_PATH, { replace: true })
      return
    }

    if (draftByIdQuery.isLoading || draftByIdQuery.isFetching) return

    if (draftByIdQuery.isError || draftByIdQuery.data?.status !== 'draft') {
      notify.error('Jarayondagi transfer topilmadi')
      navigate(LIST_PATH, { replace: true })
      return
    }

    const draft = draftByIdQuery.data
    setDraftId(draft.id)
    setTransferName(draft.name)
    setLines(mapDraftItemsToLines(draft.items))
    setNotes(draft.notes)
    setToWarehouseId(draft.toWarehouseId ?? '')
    setToWarehouseName(draft.toWarehouseName ?? '')
    setTransferDate(draft.transferDate || toIsoDateString(new Date()))
    setDraftLoaded(true)
  }, [
    draftByIdQuery.data,
    draftByIdQuery.isError,
    draftByIdQuery.isFetching,
    draftByIdQuery.isLoading,
    draftIdFromUrl,
    draftLoaded,
    navigate,
    showSkeleton,
  ])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const persistDraft = useCallback(
    async (nextLines: TransferLine[]) => {
      if (!draftIdRef.current) {
        notify.error('Transfer topilmadi')
        throw new Error('Missing draftId')
      }

      const items = nextLines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      }))

      setIsSavingDraft(true)

      try {
        await updateDraft({
          id: draftIdRef.current,
          body: { items },
        }).unwrap()
      } catch (err) {
        notify.error(
          getApiErrorMessage(err, 'Transferni saqlab bo\'lmadi'),
        )
        throw err
      } finally {
        setIsSavingDraft(false)
      }
    },
    [updateDraft],
  )

  const schedulePersistDraft = useCallback(
    (nextLines: TransferLine[]) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = window.setTimeout(() => {
        void persistDraft(nextLines)
      }, 400)
    },
    [persistDraft],
  )

  useEffect(() => {
    if (!sendOpen) return
    setError(null)
  }, [sendOpen])

  function focusProductSearch() {
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  useEffect(() => {
    if (showSkeleton || !fromWarehouseId) return
    focusProductSearch()
  }, [fromWarehouseId, showSkeleton])

  async function handleAddProduct(row?: WarehouseStockRecord | null) {
    const target = row ?? resolveRowForSubmit()

    if (!target) {
      if (!isStockReady) {
        notify.error('Ombor qoldiqlari hali yuklanmoqda')
        return
      }
      if (search.trim()) {
        notify.error('Maxsulot topilmadi')
      }
      focusProductSearch()
      return
    }

    const availableQuantity = getAvailableQuantity(target.product.id)
    if (availableQuantity <= 0) {
      notify.error('Omborda bu maxsulot qolmagan')
      focusProductSearch()
      return
    }

    const existingLine = lines.find((line) => line.productId === target.product.id)
    const nextQuantity = existingLine ? existingLine.quantity + 1 : 1

    if (nextQuantity > availableQuantity) {
      notify.error(`Omborda faqat ${formatAmount(availableQuantity)} dona mavjud`)
      focusProductSearch()
      return
    }

    const nextLines = existingLine
      ? lines.map((line) =>
          line.productId === target.product.id
            ? { ...line, quantity: nextQuantity }
            : line,
        )
      : [
          ...lines,
          {
            productId: target.product.id,
            productName: target.product.name,
            productCode: target.product.code,
            quantity: 1,
            unitPrice: target.unitPrice,
          },
        ]

    setLines(nextLines)
    resetSelection()
    setError(null)

    try {
      await persistDraft(nextLines)
    } catch {
      setLines(lines)
    } finally {
      focusProductSearch()
    }
  }

  function updateLineQuantity(productId: string, quantity: number) {
    const nextLines = lines.map((line) =>
      line.productId === productId ? { ...line, quantity } : line,
    )
    setLines(nextLines)
    setError(null)
    schedulePersistDraft(nextLines)
  }

  async function removeLine(productId: string) {
    const previousLines = lines
    const nextLines = lines.filter((line) => line.productId !== productId)
    setLines(nextLines)
    setError(null)

    try {
      await persistDraft(nextLines)
    } catch {
      setLines(previousLines)
    }
  }

  function validateLines(): string | null {
    if (!fromWarehouseId) return 'Sizga ombor biriktirilmagan'
    if (lines.length === 0) return 'Kamida bitta maxsulot qo\'shing'

    for (const line of lines) {
      const qty = line.quantity
      if (!Number.isFinite(qty) || qty <= 0) {
        return `${line.productName} uchun miqdorni kiriting`
      }
      const available = getAvailableQuantity(line.productId)
      if (qty > available) {
        return `${line.productName} uchun omborda yetarli miqdor yo'q (mavjud: ${available})`
      }
    }

    return null
  }

  function validateSend(): string | null {
    const linesError = validateLines()
    if (linesError) return linesError
    if (!toWarehouseId) return 'Qabul qiluvchi ombor tanlanmagan'
    if (!transferDate.trim()) return 'Sanani tanlang'
    if (fromWarehouseId === toWarehouseId) {
      return 'Yuboruvchi va qabul qiluvchi ombor bir xil bo\'lmasligi kerak'
    }
    return null
  }

  async function handleSend() {
    const message = validateSend()
    if (message) {
      setError(message)
      return
    }

    if (!draftId) {
      setError('Avval kamida bitta maxsulot qo\'shing')
      return
    }

    setError(null)

    try {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
        await persistDraft(lines)
      }

      await sendDraft({
        id: draftId,
        body: {
          toWarehouseId,
          transferDate,
          notes: notes.trim() || undefined,
        },
      }).unwrap()

      notify.success('Transfer yuborildi')
      setSendOpen(false)
      navigate(LIST_PATH)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Transferni yuborish amalga oshmadi'),
      )
    }
  }

  if (showSkeleton) {
    return <FormPageSkeleton sections={2} fieldsPerSection={4} />
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
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {transferName || 'Transferni tahrirlash'}
            </h1>
            {draftId && (
              <p className="text-muted-foreground mt-1 text-sm">
                {toWarehouseName ? `Qayerga: ${toWarehouseName}` : null}
                {toWarehouseName && transferDate ? ' · ' : null}
                {transferDate
                  ? `Sana: ${formatDateDisplay(transferDate)}`
                  : null}
              </p>
            )}
            {isSavingDraft && (
              <p className="text-muted-foreground mt-1 text-sm">Saqlanmoqda...</p>
            )}
          </div>
        </div>

        <Button
          disabled={lines.length === 0 || !draftId || sendState.isLoading || isSavingDraft}
          onClick={() => {
            const message = validateLines()
            if (message) {
              setError(message)
              return
            }
            setError(null)
            setSendOpen(true)
          }}
        >
          <AppIcon name="truck" />
          Yuborish
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="text-muted-foreground shrink-0 grid gap-2 px-1 text-sm sm:grid-cols-2">
          <div>
            Yuboruvchi ombor:{' '}
            <span className="text-foreground font-medium">{fromWarehouseName}</span>
          </div>
          {toWarehouseName && (
            <div>
              Qabul qiluvchi ombor:{' '}
              <span className="text-foreground font-medium">{toWarehouseName}</span>
            </div>
          )}
          {notes.trim() && (
            <div>
              Izoh:{' '}
              <span className="text-foreground">{notes.trim()}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 px-1 lg:flex-row lg:items-end">
          <div className="relative w-full flex-1">
            <Field>
              <FieldLabel>Maxsulot qidirish</FieldLabel>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverAnchor asChild>
                  <Input
                    ref={searchInputRef}
                    value={search}
                    disabled={!fromWarehouseId}
                    placeholder={
                      fromWarehouseId
                        ? 'Qidiring'
                        : 'Sizga ombor biriktirilmagan'
                    }
                    className={TABLE_FILTER_FIELD_CLASS}
                    autoComplete="off"
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(event) => {
                      handleSearchKeyDown(event)
                      if (event.key !== 'Enter') return
                      if (
                        !fromWarehouseId ||
                        isSearchLoading ||
                        !isStockReady
                      ) {
                        return
                      }
                      void handleAddProduct()
                    }}
                  />
                </PopoverAnchor>
                {comboOpen && search.trim() && (
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <ScrollArea className="max-h-60">
                      {isSearchLoading || !isStockReady ? (
                        <p className="text-muted-foreground p-3 text-sm">
                          Yuklanmoqda...
                        </p>
                      ) : availableRows.length === 0 ? (
                        <p className="text-muted-foreground p-3 text-sm">
                          Maxsulot topilmadi
                        </p>
                      ) : (
                        <ul>
                          {availableRows.map((row) => (
                            <li key={row.id}>
                              <button
                                type="button"
                                className={cn(
                                  'hover:bg-accent flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm',
                                  (selectedRow?.id === row.id ||
                                    (!selectedRow &&
                                      availableRows[highlightedIndex]?.id ===
                                        row.id)) &&
                                    'bg-accent',
                                )}
                                onClick={() => handleSelectRow(row)}
                              >
                                <span className="font-medium">
                                  {row.product.name}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {row.product.code} · Mavjud:{' '}
                                  {formatAmount(row.quantity)}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                )}
              </Popover>
            </Field>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={
              !fromWarehouseId ||
              isSearchLoading ||
              !isStockReady ||
              (!selectedRow && !search.trim())
            }
            onClick={() => void handleAddProduct()}
          >
            <AppIcon name="plus" />
            Qo&apos;shish
          </Button>
        </div>

        {error && (
          <div className="px-4 pt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto">
          <Table className={BORDERLESS_TABLE_CLASS}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">№</TableHead>
                <TableHead>Maxsulot</TableHead>
                <TableHead className="text-right">Mavjud</TableHead>
                <TableHead className="text-right">Miqdor</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground h-24 text-center"
                  >
                    Maxsulotlar qo&apos;shilmagan
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line, index) => (
                  <TableRow key={line.productId}>
                    <TableCell className="text-muted-foreground text-center tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{line.productName}</div>
                      <div className="text-muted-foreground text-xs">
                        {line.productCode}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(getAvailableQuantity(line.productId))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="ml-auto flex justify-end">
                        <OrderQuantityInput
                          value={line.quantity}
                          maxQuantity={getAvailableQuantity(line.productId)}
                          allowDirectInput={false}
                          onChange={(quantity) =>
                            updateLineQuantity(line.productId, quantity)
                          }
                          onLimitExceeded={(maxQuantity) => {
                            notify.error(
                              `Omborda faqat ${formatAmount(maxQuantity)} dona mavjud`,
                            )
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.productId)}
                        aria-label="O'chirish"
                      >
                        <AppIcon name="trash-2" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={sendOpen} onOpenChange={setSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transferni yuborish</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Transfer:</span>{' '}
                  <span className="text-foreground font-medium">
                    {transferName || '—'}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Qabul qiluvchi:</span>{' '}
                  <span className="text-foreground font-medium">
                    {toWarehouseName || '—'}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Sana:</span>{' '}
                  <span className="text-foreground font-medium">
                    {formatDateDisplay(transferDate) || '—'}
                  </span>
                </p>
                {notes.trim() && (
                  <p>
                    <span className="text-muted-foreground">Izoh:</span>{' '}
                    <span className="text-foreground">{notes.trim()}</span>
                  </p>
                )}
                <p className="text-muted-foreground">
                  Yuborilgandan so&apos;ng maxsulotlar yuboruvchi ombordan
                  chiqariladi va qabul qiluvchi ko&apos;rishi mumkin bo&apos;ladi.
                </p>
                {error && <FieldError>{error}</FieldError>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendState.isLoading}>
              Bekor qilish
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={sendState.isLoading}
              onClick={() => void handleSend()}
            >
              {sendState.isLoading ? 'Yuborilmoqda...' : 'Yuborish'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
