import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { ProductImageThumb } from '@/components/products/product-image-thumb'
import {
  BORDERLESS_TABLE_CLASS,
} from '@/components/shared/table-filter-field'
import { FormPageSkeleton } from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { OrderQuantityInput } from '@/components/orders/order-quantity-input'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { useWarehouseStockCatalog } from '@/hooks/use-warehouse-stock-catalog'
import { pageTitle } from '@/config/seo'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { buildInstallmentSchedule } from '@/lib/installment-calculator'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import {
  useAddSellerCartItemMutation,
  useReserveSellerCartMutation,
} from '@/store/api/seller-carts.api'
import { useGetPaymentTypesQuery } from '@/store/api/payment-types.api'
import { useGetProductQuery } from '@/store/api/products.api'

const SELLER_PRODUCTS_PATH = '/sotuvchilar/maxsulotlar'
const SELLER_ORDERS_PATH = '/sotuvchilar/buyurtmalar'

export function SellerProductDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [cardNumber, setCardNumber] = useState('')
  const [downPayment, setDownPayment] = useState('0')
  const [quantity, setQuantity] = useState(1)

  const productQuery = useGetProductQuery(id, { skip: !id })
  const paymentTypesQuery = useGetPaymentTypesQuery({ page: 1, perPage: 100, isActive: true })
  const stockCatalogQuery = useWarehouseStockCatalog()

  const [reserveCart] = useReserveSellerCartMutation()
  const [addCartItem, addState] = useAddSellerCartItemMutation()

  const { data: product, error: loadError } = productQuery
  const { showSkeleton } = useQueryLoading(productQuery)

  const stock = product ? stockCatalogQuery.catalog.get(product.id) : undefined

  const installmentPlans = useMemo(() => {
    const plans =
      paymentTypesQuery.data?.data
        .flatMap((paymentType) => paymentType.installmentPlans)
        .filter((plan, index, array) =>
          array.findIndex((item) => item.months === plan.months) === index,
        ) ?? []

    if (!stock?.sellingPrice || plans.length === 0) return []

    const down = Number(downPayment) || 0
    return buildInstallmentSchedule(stock.sellingPrice * quantity, down, plans)
  }, [downPayment, paymentTypesQuery.data?.data, quantity, stock?.sellingPrice])

  usePageMeta({
    title: pageTitle(product?.name ?? 'Maxsulot', 'Sotuvchilar'),
  })

  useEffect(() => {
    if (!loadError) return
    notify.error(getApiErrorMessage(loadError, 'Maxsulot topilmadi'))
  }, [loadError])

  async function handleCreateCartOrder() {
    if (!product || !stock) return

    const normalizedCard = cardNumber.trim()
    if (!normalizedCard) {
      notify.error('Karta raqamini kiriting')
      return
    }

    if (stock.availableQuantity <= 0) {
      notify.error('Omborda bu maxsulot qolmagan')
      return
    }

    if (stock.sellingPrice <= 0) {
      notify.error('Maxsulot uchun sotish narxi aniqlanmadi')
      return
    }

    try {
      await reserveCart(normalizedCard).unwrap()
      await addCartItem({
        cardNumber: normalizedCard,
        body: {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          unitPrice: stock.sellingPrice,
          quantity,
        },
      }).unwrap()

      notify.success('Maxsulot kartaga qo\'shildi')
      navigate(SELLER_ORDERS_PATH)
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Buyurtma hosil qilib bo\'lmadi'))
    }
  }

  if (showSkeleton || stockCatalogQuery.isLoading) {
    return <FormPageSkeleton sections={2} fieldsPerSection={4} />
  }

  if (loadError || !product) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(loadError, 'Maxsulot topilmadi')}
        </p>
        <Button variant="outline" asChild>
          <Link to={SELLER_PRODUCTS_PATH}>Ro&apos;yxatga qaytish</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-auto">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={SELLER_PRODUCTS_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {product.brand.name} · {product.category.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Maxsulot ma&apos;lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableBody>
                <TableRow>
                  <TableHead className="w-40">ID</TableHead>
                  <TableCell className="font-mono text-xs">
                    {product.id.slice(-8)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Maxsulot nomi</TableHead>
                  <TableCell>{product.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Izoh</TableHead>
                  <TableCell>{product.description || '—'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Holat</TableHead>
                  <TableCell>
                    <Badge variant={product.isActive ? 'default' : 'secondary'}>
                      {product.isActive ? 'Faol' : 'Nofaol'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Kategoriya</TableHead>
                  <TableCell>{product.category.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Brend</TableHead>
                  <TableCell>{product.brand.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Narx</TableHead>
                  <TableCell className="font-semibold tabular-nums">
                    {stock ? formatMoney(stock.sellingPrice) : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Qoldiq</TableHead>
                  <TableCell className="tabular-nums">
                    {stock?.availableQuantity ?? '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Saqlangan vaqti</TableHead>
                  <TableCell>
                    {formatDateDisplay(product.createdAt) || '—'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div>
              <p className="mb-2 text-sm font-medium">Maxsulot rasmi</p>
              <ProductImageThumb
                image={product.image}
                name={product.name}
                size="lg"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bo&apos;lib to&apos;lash narxlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seller-down-payment">Oldindan to&apos;lov</Label>
                <Input
                  id="seller-down-payment"
                  type="number"
                  min={0}
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
              </div>

              {installmentPlans.length > 0 ? (
                <Table className={BORDERLESS_TABLE_CLASS}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Muddat</TableHead>
                      <TableHead className="text-right">Oylik to&apos;lov</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installmentPlans.map((plan) => (
                      <TableRow key={plan.months}>
                        <TableCell>{plan.months} oy</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(plan.monthlyPayment)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Bo&apos;lib to&apos;lash rejasi topilmadi
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buyurtma hosil qilish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seller-card-number">
                  Karta raqamini kiriting! <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="seller-card-number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Maxsulot sonini kiriting! <span className="text-destructive">*</span>
                </Label>
                <OrderQuantityInput
                  value={quantity}
                  maxQuantity={stock?.availableQuantity ?? 1}
                  onChange={setQuantity}
                  onLimitExceeded={(limit) =>
                    notify.error(`Omborda faqat ${limit} ta qolgan`)
                  }
                />
              </div>

              <Button
                className="w-full"
                disabled={addState.isLoading || !stock}
                onClick={() => void handleCreateCartOrder()}
              >
                {addState.isLoading && (
                  <AppIcon name="loader" className="animate-spin" />
                )}
                Buyurtma hosil qilish
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
