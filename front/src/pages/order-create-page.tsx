import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { OrderProductPicker } from '@/components/orders/order-product-picker'
import { buildOrderItemsPayload } from '@/components/orders/order-form-utils'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useWarehouseStockCatalog } from '@/hooks/use-warehouse-stock-catalog'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { useCreateDraftOrderMutation } from '@/store/api/orders.api'
import { useGetProductsQuery } from '@/store/api/products.api'
import type { ProductRecord } from '@/types/product.types'

const ORDER_EDIT_PATH = '/kassir/buyurtmalar'

export function OrderCreatePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [comboOpen, setComboOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(
    null,
  )

  const [createDraftOrder, createDraftState] = useCreateDraftOrderMutation()

  usePageMeta({
    title: pageTitle('Buyurtma yaratish', 'Kassir'),
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const productsQuery = useGetProductsQuery(
    {
      page: 1,
      perPage: 50,
      search: debouncedSearch.trim() || undefined,
      isActive: true,
    },
    { skip: !debouncedSearch.trim() },
  )

  const stockCatalogQuery = useWarehouseStockCatalog()
  const stockCatalog = stockCatalogQuery.catalog

  const availableProducts = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return (productsQuery.data?.data ?? []).filter((product) => {
      if (!product.isActive) return false
      const stock = stockCatalog.get(product.id)
      if (!stock || stock.availableQuantity <= 0) return false
      if (!query) return false
      return (
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query)
      )
    })
  }, [productsQuery.data?.data, debouncedSearch, stockCatalog])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (selectedProduct) {
      setSelectedProduct(null)
    }
    setComboOpen(value.trim().length > 0)
  }

  function handleSelectProduct(product: ProductRecord) {
    setSelectedProduct(product)
    setSearch(`${product.name} (${product.code})`)
    setComboOpen(false)
  }

  async function handleAddProduct() {
    if (!selectedProduct) return

    const stock = stockCatalog.get(selectedProduct.id)
    if (!stock || stock.availableQuantity <= 0) {
      notify.error('Omborda bu maxsulot qolmagan')
      return
    }

    const lineItem = {
      id: selectedProduct.id,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productCode: selectedProduct.code,
      unitPrice: stock.sellingPrice,
      quantity: 1,
      discount: 0,
    }

    try {
      const order = await createDraftOrder({
        items: buildOrderItemsPayload([lineItem]),
      }).unwrap()

      notify.success('Buyurtma yaratildi')
      navigate(`${ORDER_EDIT_PATH}/${order.id}`)
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Buyurtmani yaratib bo\'lmadi'))
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Buyurtma qo&apos;shish
      </h1>

      <OrderProductPicker
        search={search}
        comboOpen={comboOpen}
        selectedProduct={selectedProduct}
        availableProducts={availableProducts}
        stockCatalog={stockCatalog}
        isLoading={
          productsQuery.isLoading ||
          productsQuery.isFetching ||
          stockCatalogQuery.isLoading
        }
        isAdding={createDraftState.isLoading}
        onSearchChange={handleSearchChange}
        onComboOpenChange={setComboOpen}
        onSelectProduct={handleSelectProduct}
        onAddProduct={() => void handleAddProduct()}
      />
    </div>
  )
}
