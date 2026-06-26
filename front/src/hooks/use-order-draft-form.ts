import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { createLineId, getOrderTotals } from '@/components/orders/order-create-utils'
import {
  buildOrderUpdatePayload,
  emptyCustomer,
  orderRecordToFormState,
} from '@/components/orders/order-form-utils'
import { useWarehouseStockCatalog } from '@/hooks/use-warehouse-stock-catalog'
import { buildUzbekPhone } from '@/lib/phone'
import {
  enrichOrderItemsWithStock,
  enrichOrderLineWithStock,
  type ProductStockCatalogEntry,
} from '@/lib/warehouse-stock-catalog'
import { notify } from '@/lib/notify'
import { useUpdateOrderMutation } from '@/store/api/orders.api'
import type {
  OrderCustomerInfo,
  OrderLineItem,
  OrderPaymentLine,
  OrderRecord,
} from '@/types/order.types'
import type { ProductRecord } from '@/types/product.types'

interface UseOrderDraftFormOptions {
  orderId: string
  order?: OrderRecord
  isDraft: boolean
}

export function useOrderDraftForm({
  orderId,
  order,
  isDraft,
}: UseOrderDraftFormOptions) {
  const [customer, setCustomer] = useState<OrderCustomerInfo>(emptyCustomer)
  const [items, setItems] = useState<OrderLineItem[]>([])
  const [payments, setPayments] = useState<OrderPaymentLine[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  const hydratedOrderIdRef = useRef<string | null>(null)
  const [updateOrder] = useUpdateOrderMutation()

  const stockCatalogQuery = useWarehouseStockCatalog()
  const stockCatalog = stockCatalogQuery.catalog
  const isStockReady = stockCatalogQuery.isComplete && stockCatalog.size > 0

  useEffect(() => {
    if (!order) return
    if (hydratedOrderIdRef.current === order.id) return

    const state = orderRecordToFormState(order)
    setCustomer(state.customer)
    setItems(
      isStockReady
        ? enrichOrderItemsWithStock(state.items, stockCatalog)
        : state.items,
    )
    setPayments(state.payments)
    setIsHydrated(true)
    hydratedOrderIdRef.current = order.id
  }, [order, isStockReady, stockCatalog])

  useEffect(() => {
    if (!isHydrated || !isStockReady) return

    setItems((prev) => enrichOrderItemsWithStock(prev, stockCatalog))
  }, [isHydrated, isStockReady, stockCatalog])

  useEffect(() => {
    if (!isHydrated || !orderId || !isDraft || !isStockReady) return

    const timer = window.setTimeout(() => {
      void updateOrder({
        id: orderId,
        body: buildOrderUpdatePayload(
          customer,
          items,
          payments,
          buildUzbekPhone(customer.phone) || undefined,
        ),
      })
    }, 800)

    return () => window.clearTimeout(timer)
  }, [
    customer,
    isDraft,
    isHydrated,
    isStockReady,
    items,
    orderId,
    payments,
    updateOrder,
  ])

  const totals = useMemo(() => getOrderTotals(items), [items])
  const paidTotal = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  )
  const remainingTotal = Math.max(0, totals.total - paidTotal)

  const getStock = useCallback(
    (productId: string): ProductStockCatalogEntry | undefined =>
      stockCatalog.get(productId),
    [stockCatalog],
  )

  const addProduct = useCallback(
    (product: ProductRecord) => {
      const stock = stockCatalog.get(product.id)
      if (!stock || stock.availableQuantity <= 0) {
        notify.error('Omborda bu maxsulot qolmagan')
        return false
      }

      if (stock.sellingPrice <= 0) {
        notify.error('Maxsulot uchun sotish narxi aniqlanmadi')
        return false
      }

      setItems((prev) => {
        const existing = prev.find((item) => item.productId === product.id)

        if (existing) {
          const nextQuantity = existing.quantity + 1
          if (nextQuantity > stock.availableQuantity) {
            notify.error(`Omborda faqat ${stock.availableQuantity} ta mavjud`)
            return prev
          }

          return prev.map((item) =>
            item.id === existing.id
              ? enrichOrderLineWithStock(
                  { ...item, quantity: nextQuantity },
                  stock,
                )
              : item,
          )
        }

        return [
          ...prev,
          enrichOrderLineWithStock(
            {
              id: createLineId(),
              productId: product.id,
              productName: product.name,
              productCode: product.code,
              unitPrice: stock.sellingPrice,
              quantity: 1,
              discount: 0,
            },
            stock,
          ),
        ]
      })

      return true
    },
    [stockCatalog],
  )

  const updateQuantity = useCallback(
    (lineId: string, quantity: number) => {
      setItems((prev) =>
        prev.map((line) => {
          if (line.id !== lineId) return line

          const stock = stockCatalog.get(line.productId)
          return enrichOrderLineWithStock({ ...line, quantity }, stock)
        }),
      )
    },
    [stockCatalog],
  )

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== lineId)
      if (nextItems.length === 0) {
        notify.error("Buyurtmada kamida bitta maxsulot bo'lishi kerak")
        return prev
      }
      return nextItems
    })
  }, [])

  const updateDiscount = useCallback((lineId: string, discount: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === lineId ? { ...item, discount } : item,
      ),
    )
  }, [])

  return {
    customer,
    setCustomer,
    items,
    payments,
    setPayments,
    totals,
    paidTotal,
    remainingTotal,
    stockCatalog,
    stockCatalogQuery,
    isStockReady,
    addProduct,
    updateQuantity,
    removeItem,
    updateDiscount,
    getStock,
  }
}
