import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  createLineId,
  getLineTotal,
  getOrderTotals,
} from '@/components/orders/order-create-utils'
import { OrderLineDiscountDialog } from '@/components/orders/order-line-discount-dialog'
import { OrderPaymentDialog } from '@/components/orders/order-payment-dialog'
import { UzbekPhoneInput } from '@/components/ui/uzbek-phone-input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
import { Textarea } from '@/components/ui/textarea'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useWarehouseStockCatalog } from '@/hooks/use-warehouse-stock-catalog'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatMoney } from '@/lib/format-money'
import { buildUzbekPhone, hasValidUzbekPhone } from '@/lib/phone'
import { clampOrderQuantity } from '@/lib/warehouse-stock-catalog'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useCreateOrderMutation } from '@/store/api/orders.api'
import { useGetPaymentTypesQuery } from '@/store/api/payment-types.api'
import { useGetProductsQuery } from '@/store/api/products.api'
import type {
  OrderCustomerInfo,
  OrderLineItem,
  OrderPaymentLine,
} from '@/types/order.types'
import type { ProductRecord } from '@/types/product.types'

const ORDERS_LIST_PATH = '/kassir/buyurtmalar'

const emptyCustomer: OrderCustomerInfo = {
  name: '',
  phone: '',
  region: '',
  district: '',
  area: '',
  address: '',
  comment: '',
}

export function OrderCreatePage() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<OrderCustomerInfo>(emptyCustomer)
  const [items, setItems] = useState<OrderLineItem[]>([])
  const [payments, setPayments] = useState<OrderPaymentLine[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [comboOpen, setComboOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(
    null,
  )
  const [discountLineId, setDiscountLineId] = useState<string | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const [createOrder, createState] = useCreateOrderMutation()

  usePageMeta({
    title: pageTitle('Buyurtma yaratish', 'Kassir'),
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const productsQuery = useGetProductsQuery({
    page: 1,
    perPage: 50,
    search: debouncedSearch.trim() || undefined,
    isActive: true,
  })

  const stockCatalogQuery = useWarehouseStockCatalog()
  const stockCatalog = stockCatalogQuery.catalog

  const availableProducts = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return (productsQuery.data?.data ?? []).filter((product) => {
      if (!product.isActive) return false
      const stock = stockCatalog.get(product.id)
      if (!stock || stock.availableQuantity <= 0) return false
      if (!query) return true
      return (
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query)
      )
    })
  }, [productsQuery.data?.data, debouncedSearch, stockCatalog])

  const totals = useMemo(() => getOrderTotals(items), [items])
  const paidTotal = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  )
  const remainingTotal = Math.max(0, totals.total - paidTotal)
  const canAddPayment = hasValidUzbekPhone(customer.phone)
  const discountLine = items.find((item) => item.id === discountLineId) ?? null
  const activePaymentTypes = paymentTypesQuery.data?.data ?? []

  function handleSearchChange(value: string) {
    setSearch(value)
    if (selectedProduct) {
      setSelectedProduct(null)
    }
    setComboOpen(true)
  }

  function handleSelectProduct(product: ProductRecord) {
    setSelectedProduct(product)
    setSearch(`${product.name} (${product.code})`)
    setComboOpen(false)
  }

  function handleAddProduct() {
    if (!selectedProduct) return

    const stock = stockCatalog.get(selectedProduct.id)
    if (!stock || stock.availableQuantity <= 0) {
      notify.error('Omborda bu maxsulot qolmagan')
      return
    }

    const unitPrice = stock.sellingPrice
    const existing = items.find(
      (item) => item.productId === selectedProduct.id,
    )

    if (existing) {
      const nextQuantity = existing.quantity + 1
      if (nextQuantity > stock.availableQuantity) {
        notify.error(`Omborda faqat ${stock.availableQuantity} ta mavjud`)
        return
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: nextQuantity, unitPrice }
            : item,
        ),
      )
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: createLineId(),
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productCode: selectedProduct.code,
          unitPrice,
          quantity: 1,
          discount: 0,
        },
      ])
    }

    setSelectedProduct(null)
    setSearch('')
    setComboOpen(false)
  }

  function handleQuantityChange(lineId: string, quantity: number) {
    const item = items.find((line) => line.id === lineId)
    if (!item) return

    const stock = stockCatalog.get(item.productId)
    const maxQuantity = stock?.availableQuantity ?? 0
    const nextQuantity = clampOrderQuantity(quantity, maxQuantity)

    if (maxQuantity <= 0) {
      notify.error('Omborda bu maxsulot qolmagan')
      return
    }

    if (nextQuantity !== Math.floor(quantity)) {
      notify.error(`Omborda faqat ${maxQuantity} ta mavjud`)
    }

    setItems((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, quantity: nextQuantity } : line,
      ),
    )
  }

  function handleRemoveItem(lineId: string) {
    setItems((prev) => prev.filter((item) => item.id !== lineId))
  }

  function handleResetOrder() {
    setCustomer(emptyCustomer)
    setItems([])
    setPayments([])
    setSearch('')
    setSelectedProduct(null)
  }

  async function handleConfirmOrder() {
    if (items.length === 0) {
      notify.error('Kamida bitta maxsulot qo\'shing')
      return
    }
    if (!canAddPayment) {
      notify.error('Mijoz telefon raqamini kiriting')
      return
    }
    if (payments.length === 0) {
      notify.error('Kamida bitta to\'lov qo\'shing')
      return
    }

    try {
      await createOrder({
        customerName: customer.name.trim() || undefined,
        customerPhone: buildUzbekPhone(customer.phone),
        customerRegion: customer.region.trim() || undefined,
        customerDistrict: customer.district.trim() || undefined,
        customerArea: customer.area.trim() || undefined,
        customerAddress: customer.address.trim() || undefined,
        comment: customer.comment.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          discount: item.discount,
          lineTotal: getLineTotal(item),
        })),
        payments: payments.map((payment) => ({
          paymentTypeId: payment.paymentTypeId,
          paymentTypeName: payment.paymentTypeName,
          amount: payment.amount,
          installmentMonths: payment.installmentMonths,
          installmentInterestPercent: payment.installmentInterestPercent,
        })),
      }).unwrap()

      notify.success('Buyurtma tasdiqlandi')
      navigate(ORDERS_LIST_PATH)
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Buyurtmani saqlab bo\'lmadi'))
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Buyurtma qo&apos;shish
      </h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="order-product-search">
                Maxsulot nomini kiriting <span className="text-destructive">*</span>
              </FieldLabel>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverAnchor asChild>
                  <div className="relative w-full">
                    <Input
                      id="order-product-search"
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setComboOpen(true)}
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
                    {productsQuery.isLoading ||
                    productsQuery.isFetching ||
                    stockCatalogQuery.isLoading ? (
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
                              onClick={() => handleSelectProduct(product)}
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
              disabled={!selectedProduct || stockCatalogQuery.isLoading}
              onClick={handleAddProduct}
            >
              Maxsulot qo&apos;shish
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={!canAddPayment}
              onClick={() => setPaymentDialogOpen(true)}
            >
              To&apos;lov qo&apos;shish
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-0 flex-1">
        <CardHeader className="shrink-0">
          <CardTitle>Qo&apos;shilgan maxsulotlar</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Maxsulot nomi</TableHead>
                <TableHead>Maxsulot narxi</TableHead>
                <TableHead>Maxsulot soni</TableHead>
                <TableHead>Chegirma</TableHead>
                <TableHead>Umumiy narx</TableHead>
                <TableHead className="text-right">O&apos;chirish</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground h-24 text-center"
                  >
                    Maxsulotlar qo&apos;shilmagan
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => {
                  const stock = stockCatalog.get(item.productId)
                  const maxQuantity = stock?.availableQuantity ?? 1

                  return (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="max-w-[280px] font-medium">
                      <span className="line-clamp-2">{item.productName}</span>
                    </TableCell>
                    <TableCell>{formatMoney(item.unitPrice)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={maxQuantity}
                        step={1}
                        className="h-8 w-20"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.id,
                            Number(e.target.value),
                          )
                        }
                      />
                      <p className="text-muted-foreground mt-1 text-xs">
                        Omborda: {maxQuantity} ta
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{formatMoney(item.discount)}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDiscountLineId(item.id)}
                        >
                          Chegirma
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{formatMoney(getLineTotal(item))}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label="O'chirish"
                        className="text-destructive hover:text-destructive"
                      >
                        <AppIcon name="trash-2" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mijoz ma&apos;lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="customer-name">Mijoz ismi</FieldLabel>
                <Input
                  id="customer-name"
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="customer-phone">Mijoz raqami</FieldLabel>
                <UzbekPhoneInput
                  id="customer-phone"
                  value={customer.phone}
                  onChange={(phone) =>
                    setCustomer((prev) => ({ ...prev, phone }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="customer-region">Viloyat</FieldLabel>
                <Input
                  id="customer-region"
                  value={customer.region}
                  onChange={(e) =>
                    setCustomer((prev) => ({ ...prev, region: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="customer-district">Tuman</FieldLabel>
                <Input
                  id="customer-district"
                  value={customer.district}
                  onChange={(e) =>
                    setCustomer((prev) => ({
                      ...prev,
                      district: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="customer-area">Region</FieldLabel>
                <Input
                  id="customer-area"
                  value={customer.area}
                  onChange={(e) =>
                    setCustomer((prev) => ({ ...prev, area: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="customer-address">Mijoz manzili</FieldLabel>
                <Textarea
                  id="customer-address"
                  value={customer.address}
                  onChange={(e) =>
                    setCustomer((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="customer-comment">
                  Buyurtmaga izoh
                </FieldLabel>
                <Textarea
                  id="customer-comment"
                  value={customer.comment}
                  onChange={(e) =>
                    setCustomer((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buyurtma ma&apos;lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Maxsulotlar soni</dt>
                <dd className="font-medium tabular-nums">{totals.itemsCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Narx</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoney(totals.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Chegirma</dt>
                <dd className="font-medium tabular-nums">
                  {formatMoney(totals.discountTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-2">
                <dt className="font-medium">Umumiy narx</dt>
                <dd className="font-semibold tabular-nums">
                  {formatMoney(totals.total)}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleResetOrder}
              >
                Buyurtmani bekor qilish
              </Button>
              <Button
                type="button"
                disabled={
                  createState.isLoading ||
                  items.length === 0 ||
                  payments.length === 0 ||
                  !canAddPayment
                }
                onClick={() => void handleConfirmOrder()}
              >
                {createState.isLoading && (
                  <AppIcon name="loader" className="animate-spin" />
                )}
                Buyurtmani tasdiqlash
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buyurtma to&apos;lovlari</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Qabul qilinishi kerak</TableHead>
                  <TableHead>Qabul qilindi</TableHead>
                  <TableHead>Qoldiq</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{formatMoney(totals.total)}</TableCell>
                  <TableCell>{formatMoney(paidTotal)}</TableCell>
                  <TableCell>{formatMoney(remainingTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {payments.length > 0 && (
              <div className="mt-4 space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{payment.paymentTypeName}</p>
                      {payment.installmentMonths ? (
                        <p className="text-muted-foreground text-xs">
                          {payment.installmentMonths} oy
                          {payment.installmentInterestPercent !== undefined
                            ? ` — ${payment.installmentInterestPercent}%`
                            : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium tabular-nums">
                        {formatMoney(payment.amount)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          setPayments((prev) =>
                            prev.filter((item) => item.id !== payment.id),
                          )
                        }
                        aria-label="To'lovni o'chirish"
                      >
                        <AppIcon name="trash-2" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <OrderLineDiscountDialog
        open={!!discountLine}
        onOpenChange={(open) => {
          if (!open) setDiscountLineId(null)
        }}
        productName={discountLine?.productName ?? ''}
        initialDiscount={discountLine?.discount ?? 0}
        onSave={(discount) => {
          if (!discountLineId) return
          setItems((prev) =>
            prev.map((item) =>
              item.id === discountLineId ? { ...item, discount } : item,
            ),
          )
        }}
      />

      <OrderPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        paymentTypes={activePaymentTypes}
        remainingAmount={remainingTotal}
        onAdd={(payment) => setPayments((prev) => [...prev, payment])}
      />
    </div>
  )
}
