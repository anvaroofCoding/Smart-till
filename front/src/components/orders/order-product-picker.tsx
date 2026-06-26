import { useEffect, useRef, type RefObject } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { TABLE_FILTER_FIELD_CLASS } from '@/components/shared/table-filter-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { env } from '@/config/env'
import { formatMoney } from '@/lib/format-money'
import type { ProductStockCatalogEntry } from '@/lib/warehouse-stock-catalog'
import { cn } from '@/lib/utils'
import type { ProductRecord } from '@/types/product.types'

const SCAN_SUFFIX_KEYS = ['Enter', 'Tab'] as const

interface OrderProductPickerProps {
  search: string
  comboOpen: boolean
  selectedProduct: ProductRecord | null
  availableProducts: ProductRecord[]
  stockCatalog: Map<string, ProductStockCatalogEntry>
  isLoading?: boolean
  isAdding?: boolean
  isStockReady?: boolean
  showPaymentButton?: boolean
  canAddPayment?: boolean
  showCardNumber?: boolean
  cardNumber?: string
  autoFocus?: boolean
  searchInputRef?: RefObject<HTMLInputElement | null>
  onCardNumberChange?: (value: string) => void
  onCardNumberKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onSearchChange: (value: string) => void
  onComboOpenChange: (open: boolean) => void
  onSelectProduct: (product: ProductRecord) => void
  onAddProduct: (product?: ProductRecord) => void
  onAddPayment?: () => void
  resolveProductForSubmit?: (term?: string) => ProductRecord | null
  resolveBarcodeScan?: (term: string) => ProductRecord | null
  onSearchKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

export function OrderProductPicker({
  search,
  comboOpen,
  selectedProduct,
  availableProducts,
  stockCatalog,
  isLoading,
  isAdding,
  isStockReady = true,
  showPaymentButton = false,
  canAddPayment = false,
  showCardNumber = false,
  cardNumber = '',
  autoFocus = false,
  searchInputRef,
  onCardNumberChange,
  onCardNumberKeyDown,
  onSearchChange,
  onComboOpenChange,
  onSelectProduct,
  onAddProduct,
  onAddPayment,
  resolveProductForSubmit,
  resolveBarcodeScan,
  onSearchKeyDown,
}: OrderProductPickerProps) {
  const hasSearchQuery = search.trim().length > 0
  const internalSearchRef = useRef<HTMLInputElement>(null)
  const inputRef = searchInputRef ?? internalSearchRef
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!autoFocus) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [autoFocus, inputRef])

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        window.clearTimeout(scanTimerRef.current)
      }
    }
  }, [])

  function focusSearchInput() {
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  function clearScanTimer() {
    if (!scanTimerRef.current) return
    window.clearTimeout(scanTimerRef.current)
    scanTimerRef.current = null
  }

  function resolveProductToAdd(term = search): ProductRecord | null {
    const normalized = term.trim()
    if (!normalized) return null

    if (resolveBarcodeScan) {
      const barcodeMatch = resolveBarcodeScan(normalized)
      if (barcodeMatch) return barcodeMatch
    }

    if (resolveProductForSubmit) {
      return resolveProductForSubmit(normalized)
    }

    if (selectedProduct) return selectedProduct
    if (!comboOpen || availableProducts.length === 0) return null
    return availableProducts[0] ?? null
  }

  function submitSearchValue(rawValue: string) {
    if (isAdding || isLoading || !isStockReady) return

    const product = resolveProductToAdd(rawValue)
    if (product) {
      onAddProduct(product)
      focusSearchInput()
    }
  }

  function scheduleBarcodeScan(rawValue: string) {
    clearScanTimer()

    const normalized = rawValue.trim()
    if (!normalized || !resolveBarcodeScan) return

    scanTimerRef.current = window.setTimeout(() => {
      scanTimerRef.current = null
      if (isAdding || isLoading || !isStockReady) return

      const product = resolveBarcodeScan(normalized)
      if (!product) return

      onAddProduct(product)
      focusSearchInput()
    }, env.scanner.debounceMs)
  }

  function handleSearchChange(value: string) {
    onSearchChange(value)
    scheduleBarcodeScan(value)
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onSearchKeyDown?.(event)

    if (!SCAN_SUFFIX_KEYS.includes(event.key as (typeof SCAN_SUFFIX_KEYS)[number])) {
      return
    }

    event.preventDefault()
    clearScanTimer()
    submitSearchValue(event.currentTarget.value)
  }

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end">
      {showCardNumber && (
        <div className="w-full lg:max-w-[180px]">
          <label
            htmlFor="order-card-number"
            className="mb-1.5 block text-sm font-medium"
          >
            Karta raqami <span className="text-destructive">*</span>
          </label>
          <Input
            id="order-card-number"
            value={cardNumber}
            onChange={(e) => onCardNumberChange?.(e.target.value)}
            onKeyDown={onCardNumberKeyDown}
            className={TABLE_FILTER_FIELD_CLASS}
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <label
          htmlFor="order-product-search"
          className="mb-1.5 block text-sm font-medium"
        >
          Maxsulot / shtrix-kod{' '}
          <span className="text-destructive">*</span>
        </label>
        <Popover
          open={comboOpen && hasSearchQuery}
          onOpenChange={(open) => {
            if (open && !hasSearchQuery) return
            onComboOpenChange(open)
          }}
        >
          <PopoverAnchor asChild>
            <div className="relative w-full">
              <Input
                ref={inputRef}
                id="order-product-search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={cn(TABLE_FILTER_FIELD_CLASS, 'pr-9')}
                autoComplete="off"
              />
              <AppIcon
                name="chevron-down"
                className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50"
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <ScrollArea className="max-h-60">
              {isLoading ? (
                <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                  Yuklanmoqda...
                </p>
              ) : availableProducts.length === 0 ? (
                <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                  Maxsulot topilmadi
                </p>
              ) : (
                <ul className="p-1">
                  {availableProducts.map((product) => {
                    const stock = stockCatalog.get(product.id)
                    const isHighlighted = selectedProduct?.id === product.id

                    return (
                      <li key={product.id}>
                        <button
                          type="button"
                          className={cn(
                            'hover:bg-accent focus:bg-accent w-full rounded-sm px-3 py-2 text-left text-sm outline-none',
                            isHighlighted && 'bg-accent',
                          )}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onSelectProduct(product)}
                        >
                          <span className="block font-medium">{product.name}</span>
                          <span className="text-muted-foreground block text-xs">
                            {product.code} · {product.brand.name}
                            {product.barcode ? ` · ${product.barcode}` : ''}
                            {stock
                              ? ` · ${formatMoney(stock.sellingPrice)} · ${stock.availableQuantity} ta`
                              : ''}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <Button
        type="button"
        className="h-8 shrink-0"
        disabled={
          isLoading ||
          isAdding ||
          !isStockReady ||
          (!resolveProductToAdd() && !selectedProduct && !hasSearchQuery)
        }
        onClick={() => submitSearchValue(search)}
      >
        {isAdding && <AppIcon name="loader" className="animate-spin" />}
        Maxsulot qo&apos;shish
      </Button>

      {showPaymentButton && (
        <Button
          type="button"
          variant="outline"
          className="h-8 shrink-0"
          disabled={!canAddPayment}
          onClick={onAddPayment}
        >
          To&apos;lov qo&apos;shish
        </Button>
      )}
    </div>
  )
}
