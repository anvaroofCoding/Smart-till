import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { OrderProductPicker } from '@/components/orders/order-product-picker'
import { SellerCartItemsTable } from '@/components/sellers/seller-cart-items-table'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
} from '@/components/shared/table-filter-field'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { useOrderProductSearch } from '@/hooks/use-order-product-search'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { useWarehouseStockCatalog } from '@/hooks/use-warehouse-stock-catalog'
import { pageTitle } from '@/config/seo'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  useAddSellerCartItemMutation,
  useGetMySellerCartsQuery,
  useRemoveSellerCartItemMutation,
  useReserveSellerCartMutation,
  useUpdateSellerCartItemMutation,
} from '@/store/api/seller-carts.api'
import type { ProductStockCatalogEntry } from '@/lib/warehouse-stock-catalog'
import type { SellerCartRecord } from '@/types/seller-cart.types'
import type { ProductRecord } from '@/types/product.types'

const SELLER_PRODUCTS_PATH = '/sotuvchilar/maxsulotlar'

export function SellerOrdersPage() {
  const [cardNumber, setCardNumber] = useState('')

  const stockCatalogQuery = useWarehouseStockCatalog()
  const stockCatalog = stockCatalogQuery.catalog

  const myCartsQuery = useGetMySellerCartsQuery()
  const { showSkeleton, showRefreshing } = useQueryLoading(myCartsQuery)

  const [reserveCart] = useReserveSellerCartMutation()
  const [addCartItem, addState] = useAddSellerCartItemMutation()
  const [updateCartItem, updateState] = useUpdateSellerCartItemMutation()
  const [removeCartItem, removeState] = useRemoveSellerCartItemMutation()

  const isMutating =
    addState.isLoading || updateState.isLoading || removeState.isLoading

  const {
    search,
    comboOpen,
    selectedProduct,
    availableProducts,
    isLoading: isProductSearchLoading,
    isStockReady,
    setComboOpen,
    handleSearchChange,
    handleSelectProduct,
    resetSelection,
  } = useOrderProductSearch()

  usePageMeta({
    title: pageTitle('Buyurtmalar', 'Sotuvchilar'),
  })

  const carts = myCartsQuery.data?.data ?? []

  const cartsWithItems = useMemo(
    () => carts.filter((cart) => cart.items.length > 0),
    [carts],
  )

  const grandTotal = useMemo(
    () => cartsWithItems.reduce((sum, cart) => sum + cart.subtotal, 0),
    [cartsWithItems],
  )

  useEffect(() => {
    if (!myCartsQuery.error) return
    notify.error(
      getApiErrorMessage(myCartsQuery.error, 'Buyurtmalarni yuklab bo\'lmadi'),
    )
  }, [myCartsQuery.error])

  async function ensureCardReserved(value: string) {
    const normalized = value.trim()
    if (!normalized) {
      notify.error('Karta raqamini kiriting')
      return null
    }

    try {
      await reserveCart(normalized).unwrap()
      return normalized
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Karta raqamini band qilib bo\'lmadi'))
      return null
    }
  }

  async function handleCardNumberKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    await ensureCardReserved(cardNumber)
  }

  async function handleAddProduct(product?: ProductRecord) {
    const target = product ?? selectedProduct
    if (!target) return

    const cardToUse = await ensureCardReserved(cardNumber)
    if (!cardToUse) return

    const stock = stockCatalog.get(target.id)
    if (!stock || stock.availableQuantity <= 0) {
      notify.error('Omborda bu maxsulot qolmagan')
      return
    }

    if (stock.sellingPrice <= 0) {
      notify.error('Maxsulot uchun sotish narxi aniqlanmadi')
      return
    }

    try {
      await addCartItem({
        cardNumber: cardToUse,
        body: {
          productId: target.id,
          productName: target.name,
          productCode: target.code,
          unitPrice: stock.sellingPrice,
          quantity: 1,
        },
      }).unwrap()
      notify.success('Maxsulot qo\'shildi')
      resetSelection()
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Maxsulot qo\'shib bo\'lmadi'))
    }
  }

  async function handleQuantityChange(
    cartNumber: string,
    productId: string,
    quantity: number,
  ) {
    try {
      await updateCartItem({
        cardNumber: cartNumber,
        productId,
        body: { quantity },
      }).unwrap()
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Miqdorni yangilab bo\'lmadi'))
    }
  }

  async function handleRemove(cartNumber: string, productId: string) {
    try {
      await removeCartItem({
        cardNumber: cartNumber,
        productId,
      }).unwrap()
      notify.success('Maxsulot olib tashlandi')
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'O\'chirib bo\'lmadi'))
    }
  }

  function getStock(productId: string) {
    return stockCatalog.get(productId)
  }

  function selectCard(number: string) {
    setCardNumber(number)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Buyurtmalar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Karta raqamlariga yig&apos;ilgan barcha buyurtmalaringiz shu yerda
            ko&apos;rinadi
          </p>
        </div>
        <Link
          to={SELLER_PRODUCTS_PATH}
          className="text-primary text-sm font-medium hover:underline"
        >
          Maxsulotlar katalogi
        </Link>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <OrderProductPicker
          showCardNumber
          cardNumber={cardNumber}
          onCardNumberChange={setCardNumber}
          onCardNumberKeyDown={(event) => void handleCardNumberKeyDown(event)}
          search={search}
          comboOpen={comboOpen}
          selectedProduct={selectedProduct}
          availableProducts={availableProducts}
          stockCatalog={stockCatalog}
          isLoading={isProductSearchLoading || stockCatalogQuery.isLoading}
          isAdding={addState.isLoading}
          isStockReady={isStockReady && stockCatalogQuery.isComplete}
          onSearchChange={handleSearchChange}
          onComboOpenChange={setComboOpen}
          onSelectProduct={handleSelectProduct}
          onAddProduct={(product) => void handleAddProduct(product)}
        />

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge variant="secondary">{cartsWithItems.length} ta karta</Badge>
          <Badge variant="outline">
            {cartsWithItems.reduce((sum, cart) => sum + cart.items.length, 0)}{' '}
            ta maxsulot
          </Badge>
          {cartsWithItems.length > 0 && (
            <Badge>Jami: {formatMoney(grandTotal)}</Badge>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-auto">
          {showSkeleton ? (
            <DataTableSkeleton columns={6} rows={6} />
          ) : cartsWithItems.length === 0 ? (
            <div className="text-muted-foreground flex h-32 items-center justify-center rounded-lg border border-dashed text-sm">
              Hali karta buyurtmalari yo&apos;q. Yuqoridan karta raqami va
              maxsulot qo&apos;shing
            </div>
          ) : (
            cartsWithItems.map((cart) => (
              <SellerCartSection
                key={cart.id}
                cart={cart}
                isSelected={cardNumber.trim() === cart.cardNumber}
                disabled={isMutating}
                getStock={getStock}
                onSelect={() => selectCard(cart.cardNumber)}
                onQuantityChange={(productId, quantity) =>
                  void handleQuantityChange(cart.cardNumber, productId, quantity)
                }
                onQuantityLimit={(limit) =>
                  notify.error(`Omborda faqat ${limit} ta qolgan`)
                }
                onRemove={(productId) =>
                  void handleRemove(cart.cardNumber, productId)
                }
              />
            ))
          )}
        </div>

        <QueryRefreshIndicator visible={showRefreshing} />
      </div>
    </div>
  )
}

function SellerCartSection({
  cart,
  isSelected,
  disabled,
  getStock,
  onSelect,
  onQuantityChange,
  onQuantityLimit,
  onRemove,
}: {
  cart: SellerCartRecord
  isSelected: boolean
  disabled?: boolean
  getStock: (productId: string) => ProductStockCatalogEntry | undefined
  onSelect: () => void
  onQuantityChange: (productId: string, quantity: number) => void
  onQuantityLimit: (limit: number) => void
  onRemove: (productId: string) => void
}) {
  return (
    <section
      className={cn(
        'space-y-3 rounded-lg border p-4',
        isSelected && 'border-primary/50 bg-primary/5',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={onSelect}
          >
            Karta {cart.cardNumber}
          </Button>
          <Badge variant="secondary">{cart.items.length} ta maxsulot</Badge>
          <Badge variant="outline">{formatMoney(cart.subtotal)}</Badge>
        </div>
        <span className="text-muted-foreground text-xs">
          Yangilangan: {formatDateDisplay(cart.updatedAt)}
        </span>
      </div>

      <SellerCartItemsTable
        items={cart.items}
        disabled={disabled}
        getStock={getStock}
        onQuantityChange={onQuantityChange}
        onQuantityLimit={onQuantityLimit}
        onRemove={onRemove}
      />

      <Table className={BORDERLESS_TABLE_CLASS}>
        <TableBody>
          <TableRow className="hover:bg-transparent">
            <TableCell className="text-right font-medium" colSpan={5}>
              Karta {cart.cardNumber} jami
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatMoney(cart.subtotal)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>
  )
}
