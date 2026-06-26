import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { OrderCustomerTable } from '@/components/orders/order-customer-table'
import { OrderDetailView } from '@/components/orders/order-detail-view'
import { OrderItemsTable } from '@/components/orders/order-items-table'
import { OrderLineDiscountDialog } from '@/components/orders/order-line-discount-dialog'
import { OrderPaymentDialog } from '@/components/orders/order-payment-dialog'
import { OrderPaymentsTable } from '@/components/orders/order-payments-table'
import { OrderProductPicker } from '@/components/orders/order-product-picker'
import { OrderSummaryTable } from '@/components/orders/order-summary-table'
import { buildOrderUpdatePayload } from '@/components/orders/order-form-utils'
import { LIST_PAGE_TABLE_SECTION_CLASS } from '@/components/shared/table-filter-field'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useOrderDraftForm } from '@/hooks/use-order-draft-form'
import { useOrderProductSearch } from '@/hooks/use-order-product-search'
import { usePageMeta } from '@/hooks/use-page-meta'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { buildUzbekPhone, hasValidUzbekPhone } from '@/lib/phone'
import { runOrderReceiptPrintFlow } from '@/lib/order-receipt'
import { notify } from '@/lib/notify'
import {
  useCancelOrderMutation,
  useConfirmOrderMutation,
  useGetOrderQuery,
  useRecordOrderReceiptMutation,
} from '@/store/api/orders.api'
import { useGetPaymentTypesQuery } from '@/store/api/payment-types.api'

import type { ProductRecord } from '@/types/product.types'

const ORDERS_LIST_PATH = '/kassir/buyurtmalar'
const ORDER_CREATE_PATH = '/kassir/buyurtma-yaratish'

export function OrderEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const orderQuery = useGetOrderQuery(id, { skip: !id })

  const [discountLineId, setDiscountLineId] = useState<string | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false)

  const [confirmOrder, confirmState] = useConfirmOrderMutation()
  const [recordReceipt] = useRecordOrderReceiptMutation()
  const [cancelOrder, cancelState] = useCancelOrderMutation()

  const isDraft = orderQuery.data?.status === 'draft'

  const {
    customer,
    setCustomer,
    items,
    payments,
    setPayments,
    totals,
    paidTotal,
    remainingTotal,
    stockCatalog,
    isStockReady,
    addProduct,
    updateQuantity,
    removeItem,
    updateDiscount,
    getStock,
  } = useOrderDraftForm({
    orderId: id,
    order: orderQuery.data,
    isDraft,
  })

  const {
    search,
    comboOpen,
    selectedProduct,
    availableProducts,
    isLoading: isProductSearchLoading,
    setComboOpen,
    handleSearchChange,
    handleSelectProduct,
    handleSearchKeyDown,
    resolveProductForSubmit,
    resetSelection,
  } = useOrderProductSearch({ enabled: isDraft })

  const searchInputRef = useRef<HTMLInputElement>(null)

  function focusProductSearch() {
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  usePageMeta({
    title: pageTitle(
      isDraft ? 'Buyurtmani tahrirlash' : 'Buyurtma ma\'lumotlari',
      'Kassir',
    ),
  })

  const paymentTypesQuery = useGetPaymentTypesQuery({
    page: 1,
    perPage: 100,
    isActive: true,
  })

  const hasValidCustomerPhone = hasValidUzbekPhone(customer.phone)
  const canAddPayment = hasValidCustomerPhone && remainingTotal > 0
  const canConfirmOrder =
    hasValidCustomerPhone && items.length > 0 && payments.length > 0
  const discountLine = items.find((item) => item.id === discountLineId) ?? null
  const activePaymentTypes = paymentTypesQuery.data?.data ?? []
  const showDetails = items.length > 0

  function handleAddProduct(product?: ProductRecord) {
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

    if (addProduct(target)) {
      resetSelection()
      focusProductSearch()
    }
  }

  async function handleCancelOrder() {
    if (!id) return

    try {
      await cancelOrder(id).unwrap()
      notify.success('Buyurtma bekor qilindi')
      setCancelDialogOpen(false)
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Buyurtmani bekor qilib bo\'lmadi'))
    }
  }

  async function handleConfirmOrder() {
    if (!id) return
    if (items.length === 0) {
      notify.error("Kamida bitta maxsulot qo'shing")
      return
    }
    if (!hasValidCustomerPhone) {
      notify.error('Mijoz telefon raqamini kiriting')
      return
    }
    if (payments.length === 0) {
      notify.error("Kamida bitta to'lov qo'shing")
      return
    }

    try {
      setIsProcessingReceipt(true)
      const order = await confirmOrder({
        id,
        body: buildOrderUpdatePayload(
          customer,
          items,
          payments,
          buildUzbekPhone(customer.phone),
        ),
      }).unwrap()

      notify.success('Buyurtma chiqimga yuborildi')
      await runOrderReceiptPrintFlow(order, recordReceipt)
      navigate(ORDER_CREATE_PATH)
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Buyurtmani saqlab bo\'lmadi'))
    } finally {
      setIsProcessingReceipt(false)
    }
  }

  if (orderQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Yuklanmoqda...
      </div>
    )
  }

  if (orderQuery.error || !orderQuery.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">
          Buyurtma topilmadi yoki yuklab bo&apos;lmadi
        </p>
        <Button asChild variant="outline">
          <Link to={ORDERS_LIST_PATH}>Buyurtmalar ro&apos;yxatiga qaytish</Link>
        </Button>
      </div>
    )
  }

  if (!isDraft) {
    return (
      <OrderDetailView order={orderQuery.data} listPath={ORDERS_LIST_PATH} />
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Buyurtma qo&apos;shish
        </h1>
        <Button asChild variant="outline">
          <Link to={ORDERS_LIST_PATH}>Buyurtmalar ro&apos;yxati</Link>
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <OrderProductPicker
          autoFocus
          searchInputRef={searchInputRef}
          search={search}
          comboOpen={comboOpen}
          selectedProduct={selectedProduct}
          availableProducts={availableProducts}
          stockCatalog={stockCatalog}
          isLoading={isProductSearchLoading}
          isStockReady={isStockReady}
          showPaymentButton={showDetails}
          canAddPayment={canAddPayment}
          resolveProductForSubmit={resolveProductForSubmit}
          onSearchKeyDown={handleSearchKeyDown}
          onSearchChange={handleSearchChange}
          onComboOpenChange={setComboOpen}
          onSelectProduct={handleSelectProduct}
          onAddProduct={handleAddProduct}
          onAddPayment={() => setPaymentDialogOpen(true)}
        />

        {showDetails && (
          <div className="min-h-0 flex-1 space-y-6 overflow-auto">
            <OrderItemsTable
              items={items}
              getStock={getStock}
              onQuantityChange={updateQuantity}
              onQuantityLimit={(limit) => {
                if (limit <= 0) {
                  notify.error('Omborda bu maxsulot qolmagan')
                  return
                }
                notify.error(`Omborda faqat ${limit} ta mavjud`)
              }}
              onDiscount={setDiscountLineId}
              onRemove={removeItem}
            />

            <div className="grid gap-6 xl:grid-cols-3">
              <OrderCustomerTable
                customer={customer}
                onChange={(patch) =>
                  setCustomer((prev) => ({ ...prev, ...patch }))
                }
              />

              <OrderSummaryTable
                itemsCount={totals.itemsCount}
                subtotal={totals.subtotal}
                discountTotal={totals.discountTotal}
                total={totals.total}
                showActions
                canConfirm={canConfirmOrder}
                isConfirming={confirmState.isLoading || isProcessingReceipt}
                isCancelling={cancelState.isLoading}
                onCancel={() => setCancelDialogOpen(true)}
                onConfirm={() => void handleConfirmOrder()}
              />

              <OrderPaymentsTable
                total={totals.total}
                paidTotal={paidTotal}
                remainingTotal={remainingTotal}
                payments={payments}
                onRemovePayment={(paymentId) =>
                  setPayments((prev) =>
                    prev.filter((item) => item.id !== paymentId),
                  )
                }
              />
            </div>
          </div>
        )}
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
          updateDiscount(discountLineId, discount)
        }}
      />

      <OrderPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        paymentTypes={activePaymentTypes}
        remainingAmount={remainingTotal}
        onAdd={(payment) => setPayments((prev) => [...prev, payment])}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buyurtmani bekor qilasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Rostdan ham bu buyurtmani bekor qilmoqchimisiz? Buyurtma
              &quot;Bekor qilingan&quot; holatida saqlanadi va qayta tahrirlab
              bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelState.isLoading}>
              Yo&apos;q
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={cancelState.isLoading}
              onClick={(e) => {
                e.preventDefault()
                void handleCancelOrder()
              }}
            >
              {cancelState.isLoading ? 'Bekor qilinmoqda...' : 'Ha, bekor qilish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
