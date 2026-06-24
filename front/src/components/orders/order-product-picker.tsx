import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatMoney } from '@/lib/format-money'
import type { ProductStockCatalogEntry } from '@/lib/warehouse-stock-catalog'
import { cn } from '@/lib/utils'
import type { ProductRecord } from '@/types/product.types'

interface OrderProductPickerProps {
  search: string
  comboOpen: boolean
  selectedProduct: ProductRecord | null
  availableProducts: ProductRecord[]
  stockCatalog: Map<string, ProductStockCatalogEntry>
  isLoading?: boolean
  isAdding?: boolean
  showPaymentButton?: boolean
  canAddPayment?: boolean
  onSearchChange: (value: string) => void
  onComboOpenChange: (open: boolean) => void
  onSelectProduct: (product: ProductRecord) => void
  onAddProduct: () => void
  onAddPayment?: () => void
}

export function OrderProductPicker({
  search,
  comboOpen,
  selectedProduct,
  availableProducts,
  stockCatalog,
  isLoading,
  isAdding,
  showPaymentButton = false,
  canAddPayment = false,
  onSearchChange,
  onComboOpenChange,
  onSelectProduct,
  onAddProduct,
  onAddPayment,
}: OrderProductPickerProps) {
  const hasSearchQuery = search.trim().length > 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <Field className="min-w-0 flex-1">
            <FieldLabel htmlFor="order-product-search">
              Maxsulot nomini kiriting{' '}
              <span className="text-destructive">*</span>
            </FieldLabel>
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
                    id="order-product-search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pr-9"
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
                        return (
                          <li key={product.id}>
                            <button
                              type="button"
                              className={cn(
                                'hover:bg-accent focus:bg-accent w-full rounded-sm px-3 py-2 text-left text-sm outline-none',
                                selectedProduct?.id === product.id && 'bg-accent',
                              )}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => onSelectProduct(product)}
                            >
                              <span className="block font-medium">
                                {product.name}
                              </span>
                              <span className="text-muted-foreground block text-xs">
                                {product.code} · {product.brand.name}
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
          </Field>
          <Button
            type="button"
            className="shrink-0"
            disabled={!selectedProduct || isLoading || isAdding}
            onClick={onAddProduct}
          >
            {isAdding && <AppIcon name="loader" className="animate-spin" />}
            Maxsulot qo&apos;shish
          </Button>
          {showPaymentButton && (
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={!canAddPayment}
              onClick={onAddPayment}
            >
              To&apos;lov qo&apos;shish
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
