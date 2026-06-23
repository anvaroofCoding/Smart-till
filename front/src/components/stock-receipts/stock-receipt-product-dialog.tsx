import { useEffect, useMemo, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatMoneyInput, parseMoneyInput } from '@/lib/format-money'
import { useGetProductsQuery } from '@/store/api/products.api'
import type { ProductRecord } from '@/types/product.types'

export interface StockReceiptProductFormValues {
  productId: string
  quantity: string
  unitPrice: string
}

const emptyValues: StockReceiptProductFormValues = {
  productId: '',
  quantity: '',
  unitPrice: '',
}

function validate(values: StockReceiptProductFormValues): string | null {
  if (!values.productId) return 'Maxsulotni tanlang'

  const quantity = Number(values.quantity)
  if (!values.quantity.trim() || Number.isNaN(quantity) || quantity <= 0) {
    return 'Miqdorni kiriting'
  }

  const unitPrice = parseMoneyInput(values.unitPrice)
  if (!values.unitPrice.trim() || unitPrice < 0) {
    return 'Narxni kiriting'
  }

  return null
}

interface StockReceiptProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  excludedProductIds?: string[]
  isSaving?: boolean
  onSubmit: (values: {
    productId: string
    quantity: number
    unitPrice: number
  }) => void | Promise<void>
}

export function StockReceiptProductDialog({
  open,
  onOpenChange,
  excludedProductIds = [],
  isSaving,
  onSubmit,
}: StockReceiptProductDialogProps) {
  const [values, setValues] = useState<StockReceiptProductFormValues>(emptyValues)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [comboOpen, setComboOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(
    null,
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const productsQuery = useGetProductsQuery(
    {
      page: 1,
      perPage: 100,
      search: debouncedSearch.trim() || undefined,
    },
    { skip: !open },
  )

  const availableProducts = useMemo(() => {
    const excluded = new Set(excludedProductIds)
    return (productsQuery.data?.data ?? []).filter(
      (product) => product.isActive && !excluded.has(product.id),
    )
  }, [productsQuery.data?.data, excludedProductIds])

  const isLoadingProducts =
    productsQuery.isLoading || productsQuery.isFetching

  useEffect(() => {
    if (!open) return
    setValues(emptyValues)
    setValidationError(null)
    setSearch('')
    setDebouncedSearch('')
    setComboOpen(false)
    setSelectedProduct(null)
  }, [open])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (selectedProduct) {
      setSelectedProduct(null)
      setValues((prev) => ({ ...prev, productId: '' }))
    }
    setComboOpen(true)
  }

  function handleSelectProduct(product: ProductRecord) {
    setSelectedProduct(product)
    setSearch(product.name)
    setValues((prev) => ({ ...prev, productId: product.id }))
    setComboOpen(false)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const message = validate(values)
    if (message) {
      setValidationError(message)
      return
    }
    setValidationError(null)
    await onSubmit({
      productId: values.productId,
      quantity: Number(values.quantity),
      unitPrice: parseMoneyInput(values.unitPrice),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Maxsulot qo&apos;shish</DialogTitle>
          <DialogDescription>
            Maxsulot nomini yozib qidiring, tanlang va miqdor bilan narxni
            kiriting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="receipt-product">
                Maxsulot <span className="text-destructive">*</span>
              </FieldLabel>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverAnchor asChild>
                  <div className="relative w-full">
                    <Input
                      id="receipt-product"
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setComboOpen(true)}
                      className="pr-9"
                      autoComplete="off"
                      autoFocus
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
                    {isLoadingProducts ? (
                      <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                        Yuklanmoqda...
                      </p>
                    ) : availableProducts.length === 0 ? (
                      <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                        Maxsulot topilmadi
                      </p>
                    ) : (
                      <ul className="p-1">
                        {availableProducts.map((product) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              className={cn(
                                'hover:bg-accent focus:bg-accent w-full rounded-sm px-3 py-2 text-left text-sm outline-none',
                                values.productId === product.id && 'bg-accent',
                              )}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelectProduct(product)}
                            >
                              <span className="block font-medium">
                                {product.name}
                              </span>
                              <span className="text-muted-foreground block text-xs">
                                {product.category.name} · {product.brand.name}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="receipt-quantity">
                  Miqdor <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="receipt-quantity"
                  type="number"
                  min="0"
                  step="0.001"
                  value={values.quantity}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="receipt-price">
                  Narx <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="receipt-price"
                  inputMode="decimal"
                  value={values.unitPrice}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      unitPrice: formatMoneyInput(e.target.value),
                    }))
                  }
                />
              </Field>
            </div>

            {validationError && <FieldError>{validationError}</FieldError>}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !values.productId}
            >
              {isSaving && <AppIcon name="loader" className="animate-spin" />}
              Qo&apos;shish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
