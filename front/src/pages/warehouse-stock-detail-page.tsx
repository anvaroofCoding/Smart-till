import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { ProductBarcode } from '@/components/shared/product-barcode'
import { StockMovementTimeline } from '@/components/warehouse-stock/stock-movement-timeline'
import { FormPageSkeleton } from '@/components/loading'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
  TABLE_FILTER_FIELD_CLASS,
} from '@/components/shared/table-filter-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { getApiErrorMessage } from '@/lib/api-error'
import { getProductBarcodes } from '@/lib/product-barcodes'
import { notify } from '@/lib/notify'
import { usePrinter } from '@/peripherals/printer/use-printer'
import {
  useAddProductBarcodeMutation,
  useGetProductBarcodesQuery,
  useRemoveProductBarcodeMutation,
} from '@/store/api/products.api'
import { useGetWarehouseStockDetailQuery } from '@/store/api/warehouse-stock.api'

const LIST_PATH = '/omborlar/maxsulotlar-soni'

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

export function WarehouseStockDetailPage() {
  const { id = '' } = useParams()
  const { printLabel, isPrinting } = usePrinter()
  const [newBarcode, setNewBarcode] = useState('')
  const [barcodeToDelete, setBarcodeToDelete] = useState<{
    id: string
    value: string
  } | null>(null)
  const detailQuery = useGetWarehouseStockDetailQuery(id, { skip: !id })
  const { data: stock, error: loadError } = detailQuery
  const { showSkeleton } = useQueryLoading(detailQuery)
  const barcodesQuery = useGetProductBarcodesQuery(stock?.product.id ?? '', {
    skip: !stock?.product.id,
  })
  const [addBarcode, addBarcodeState] = useAddProductBarcodeMutation()
  const [removeBarcode, removeBarcodeState] = useRemoveProductBarcodeMutation()

  const productBarcodes = barcodesQuery.data ?? []
  const fallbackBarcodes = getProductBarcodes(stock?.product)

  usePageMeta({
    title: pageTitle(stock?.product.name ?? 'Batafsil', 'Maxsulotlar soni'),
  })

  useEffect(() => {
    if (!loadError) return
    notify.error(getApiErrorMessage(loadError, 'Maxsulot topilmadi'))
  }, [loadError])

  if (showSkeleton) {
    return <FormPageSkeleton sections={2} fieldsPerSection={4} />
  }

  if (loadError || !stock) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={LIST_PATH}>
            <AppIcon name="arrow-left" />
            Orqaga
          </Link>
        </Button>
        <p className="text-destructive text-sm">
          {getApiErrorMessage(loadError, 'Maxsulot topilmadi')}
        </p>
      </div>
    )
  }

  const hasMixedUnitPrices = stock.hasMixedUnitPrices ?? false
  const previousUnitPrices = stock.previousUnitPrices ?? []
  const latestMovement = stock.movements[0]

  async function handlePrintBarcode(barcode: string) {
    if (!barcode.trim()) {
      notify.error('Barkod mavjud emas')
      return
    }

    const result = await printLabel(
      { barcode: barcode.trim() },
      {
        copies: 1,
        labelSize: { widthMm: 50, heightMm: 28 },
      },
    )

    if (result.success) {
      notify.success('Barkod chop etish oynasi ochildi')
      return
    }

    notify.error(result.error ?? 'Barkodni chop etib bo\'lmadi')
  }

  async function handleAddBarcode() {
    if (!stock) return

    const value = newBarcode.trim()
    if (!value) {
      notify.error('Barkod qiymatini kiriting')
      return
    }

    try {
      await addBarcode({
        productId: stock.product.id,
        stockId: stock.id,
        body: { value },
      }).unwrap()
      setNewBarcode('')
      notify.success('Barkod qo\'shildi')
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Barkod qo\'shib bo\'lmadi'))
    }
  }

  async function handleRemoveBarcode(barcodeId: string) {
    if (!stock) return

    try {
      await removeBarcode({
        productId: stock.product.id,
        barcodeId,
        stockId: stock.id,
      }).unwrap()
      setBarcodeToDelete(null)
      notify.success('Barkod o\'chirildi')
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Barkodni o\'chirib bo\'lmadi'))
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={LIST_PATH}>
              <AppIcon name="arrow-left" />
              Maxsulotlar ro&apos;yxati
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {stock.product.name}
            </h1>
            <Badge variant="outline">{stock.product.code}</Badge>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={
            isPrinting ||
            (productBarcodes.length === 0 && fallbackBarcodes.length === 0)
          }
          onClick={() => {
            const primary =
              productBarcodes.find((item) => item.isPrimary)?.value ??
              fallbackBarcodes[0] ??
              ''
            void handlePrintBarcode(primary)
          }}
        >
          {isPrinting ? (
            <AppIcon name="loader" className="animate-spin" />
          ) : (
            <AppIcon name="clipboard-list" />
          )}
          Barkod chop etish
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="min-h-0 flex-1 space-y-6 overflow-auto">
          <section className="space-y-2">
            <SectionTitle>Maxsulot ma&apos;lumotlari</SectionTitle>
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[38%] max-w-[220px]">Maydon</TableHead>
                  <TableHead>Qiymat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <InfoRow
                  label="Kategoriya"
                  value={stock.product.category.name}
                />
                <InfoRow label="Brend" value={stock.product.brand.name} />
                <InfoRow label="Ombor" value={stock.warehouse.name} />
                <InfoRow
                  label="Ombordagi soni"
                  value={
                    <span className="font-medium tabular-nums">
                      {stock.quantity}
                    </span>
                  }
                />
                <InfoRow
                  label="Oxirgi kirim narxi"
                  value={
                    <span className="tabular-nums">
                      {formatMoney(stock.unitPrice)}
                    </span>
                  }
                />
                {hasMixedUnitPrices ? (
                  <InfoRow
                    label="Eski kirim narxlari"
                    value={
                      <span className="text-amber-600 tabular-nums">
                        {previousUnitPrices
                          .map((price) => formatMoney(price))
                          .join(', ')}
                      </span>
                    }
                  />
                ) : null}
                <InfoRow
                  label="Sotiladigan narx"
                  value={
                    <span className="font-medium tabular-nums">
                      {formatMoney(stock.sellingPrice)}
                      {stock.markupPercent !== undefined
                        ? ` (+${stock.markupPercent}%)`
                        : ''}
                    </span>
                  }
                />
                <InfoRow
                  label="Valyuta kursi"
                  value={
                    <span className="tabular-nums">
                      {formatMoney(stock.exchangeRate)}
                    </span>
                  }
                />
                <InfoRow
                  label="Tovar qiymati"
                  value={
                    <span className="font-semibold tabular-nums">
                      {formatMoney(stock.totalValue)}
                    </span>
                  }
                />
                <InfoRow
                  label="Oxirgi yangilanish"
                  value={formatDateDisplay(stock.updatedAt) || '—'}
                />
                {latestMovement ? (
                  <>
                    <InfoRow
                      label="Oxirgi manba"
                      value={latestMovement.sourceName}
                    />
                    <InfoRow
                      label="Yetkazib beruvchi"
                      value={latestMovement.supplier.name}
                    />
                    <InfoRow
                      label="Oxirgi kirim sanasi"
                      value={formatDateDisplay(latestMovement.createdAt) || '—'}
                    />
                    <InfoRow
                      label="Oxirgi kirim miqdori"
                      value={
                        <span className="tabular-nums">
                          +{latestMovement.delta}
                        </span>
                      }
                    />
                  </>
                ) : null}
              </TableBody>
            </Table>
          </section>

          <section className="space-y-4">
            <SectionTitle>Barkodlar</SectionTitle>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newBarcode}
                placeholder="Yangi barkod kiriting"
                className={TABLE_FILTER_FIELD_CLASS}
                autoComplete="off"
                onChange={(event) => setNewBarcode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  void handleAddBarcode()
                }}
              />
              <Button
                type="button"
                disabled={addBarcodeState.isLoading}
                onClick={() => void handleAddBarcode()}
              >
                <AppIcon name="plus" />
                Barkod qo&apos;shish
              </Button>
            </div>

            {barcodesQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">Yuklanmoqda...</p>
            ) : productBarcodes.length === 0 && fallbackBarcodes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Barkodlar yo&apos;q</p>
            ) : productBarcodes.length > 0 ? (
              <div className="space-y-4">
                {productBarcodes.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col items-center gap-2 sm:items-start">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm">{item.value}</p>
                        {item.isPrimary ? (
                          <Badge variant="secondary">Asosiy</Badge>
                        ) : (
                          <Badge variant="outline">Qo&apos;shimcha</Badge>
                        )}
                      </div>
                      <ProductBarcode value={item.value} height={64} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isPrinting}
                        aria-label="Barkodni chop etish"
                        onClick={() => void handlePrintBarcode(item.value)}
                      >
                        <AppIcon name="clipboard-list" />
                      </Button>
                      {!item.isPrimary && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={removeBarcodeState.isLoading}
                          aria-label="Barkodni o'chirish"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            setBarcodeToDelete({
                              id: item.id,
                              value: item.value,
                            })
                          }
                        >
                          <AppIcon name="trash-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {fallbackBarcodes.map((value) => (
                  <div
                    key={value}
                    className="flex flex-col items-center gap-2 py-2"
                  >
                    <ProductBarcode value={value} height={72} />
                    <p className="text-muted-foreground font-mono text-sm">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <SectionTitle>Tovar tarixi</SectionTitle>
            <StockMovementTimeline
              movements={stock.movements}
              latestUnitPrice={stock.unitPrice}
            />
          </section>
        </div>
      </div>

      <AlertDialog
        open={barcodeToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setBarcodeToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Barkodni o&apos;chirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-foreground font-mono font-medium">
                {barcodeToDelete?.value}
              </span>{' '}
              barkodi o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeBarcodeState.isLoading}>
              Bekor qilish
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={removeBarcodeState.isLoading}
              onClick={() => {
                if (!barcodeToDelete) return
                void handleRemoveBarcode(barcodeToDelete.id)
              }}
            >
              {removeBarcodeState.isLoading ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
