import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { OrderProductPicker } from '@/components/orders/order-product-picker'
import { LIST_PAGE_TABLE_SECTION_CLASS } from '@/components/shared/table-filter-field'
import { Button } from '@/components/ui/button'
import { buildOrderItemsPayload } from '@/components/orders/order-form-utils'
import { useOrderProductSearch } from '@/hooks/use-order-product-search'
import { usePageMeta } from '@/hooks/use-page-meta'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { useClaimSellerCartMutation } from '@/store/api/seller-carts.api'
import { useCreateDraftOrderMutation } from '@/store/api/orders.api'
import type { ProductRecord } from '@/types/product.types'

const ORDERS_LIST_PATH = '/kassir/buyurtmalar'
const ORDER_EDIT_PATH = '/kassir/buyurtmalar'

export function OrderCreatePage() {
  usePageMeta({
    title: pageTitle('Buyurtma yaratish', 'Kassir'),
  })

  const navigate = useNavigate()
  const [cardNumber, setCardNumber] = useState('')
  const [createDraftOrder, createDraftState] = useCreateDraftOrderMutation()
  const [claimSellerCart, claimState] = useClaimSellerCartMutation()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    search,
    comboOpen,
    selectedProduct,
    availableProducts,
    stockCatalog,
    isLoading,
    isStockReady,
    setComboOpen,
    handleSearchChange,
    handleSelectProduct,
    handleSearchKeyDown,
    resolveProductForSubmit,
    resolveBarcodeScan,
    resetSelection,
  } = useOrderProductSearch()

  const isBusy = createDraftState.isLoading || claimState.isLoading

  function focusProductSearch() {
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  async function handleClaimCardNumber(value: string) {
    const normalized = value.trim()
    if (!normalized) return

    try {
      const order = await claimSellerCart(normalized).unwrap()
      notify.success('Sotuvchi kartasidagi maxsulotlar yuklandi')
      navigate(`${ORDER_EDIT_PATH}/${order.id}`)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Bu karta raqamida faol buyurtma topilmadi'),
      )
      focusProductSearch()
    }
  }

  function handleCardNumberKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    void handleClaimCardNumber(cardNumber)
  }

  async function handleAddProduct(product?: ProductRecord) {
    const target = product ?? resolveProductForSubmit()
    if (!target) {
      if (!isStockReady) {
        notify.error('Ombor qoldiqlari hali yuklanmoqda')
        return
      }
      if (search.trim()) {
        notify.error('Maxsulot topilmadi')
      }
      return
    }

    const stock = stockCatalog.get(target.id)
    if (!stock || stock.availableQuantity <= 0) {
      notify.error('Omborda bu maxsulot qolmagan')
      resetSelection()
      focusProductSearch()
      return
    }

    if (stock.sellingPrice <= 0) {
      notify.error('Maxsulot uchun sotish narxi aniqlanmadi')
      resetSelection()
      focusProductSearch()
      return
    }

    const lineItem = {
      id: target.id,
      productId: target.id,
      productName: target.name,
      productCode: target.code,
      unitPrice: stock.sellingPrice,
      quantity: 1,
      discount: 0,
    }

    try {
      const order = await createDraftOrder({
        items: buildOrderItemsPayload([lineItem]),
      }).unwrap()

      navigate(`${ORDER_EDIT_PATH}/${order.id}`, { replace: true })
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Buyurtmani yaratib bo\'lmadi'))
      focusProductSearch()
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Buyurtma yaratish
        </h1>
        <Button asChild variant="outline">
          <Link to={ORDERS_LIST_PATH}>Buyurtmalar ro&apos;yxati</Link>
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <OrderProductPicker
          autoFocus
          searchInputRef={searchInputRef}
          showCardNumber
          cardNumber={cardNumber}
          onCardNumberChange={setCardNumber}
          onCardNumberKeyDown={handleCardNumberKeyDown}
          search={search}
          comboOpen={comboOpen}
          selectedProduct={selectedProduct}
          availableProducts={availableProducts}
          stockCatalog={stockCatalog}
          isLoading={isLoading}
          isAdding={isBusy}
          isStockReady={isStockReady}
          resolveProductForSubmit={resolveProductForSubmit}
          resolveBarcodeScan={resolveBarcodeScan}
          onSearchKeyDown={handleSearchKeyDown}
          onSearchChange={handleSearchChange}
          onComboOpenChange={setComboOpen}
          onSelectProduct={handleSelectProduct}
          onAddProduct={(product) => void handleAddProduct(product)}
        />
      </div>
    </div>
  )
}
