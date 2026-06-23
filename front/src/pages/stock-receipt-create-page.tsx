import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  StockReceiptForm,
  buildStockReceiptPayload,
  validateStockReceiptForm,
} from '@/components/stock-receipts/stock-receipt-form'
import { FormPageSkeleton } from '@/components/loading'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
import { useQueriesLoading } from '@/hooks/use-query-loading'
import { useCreateStockReceiptMutation } from '@/store/api/stock-receipts.api'
import { useGetSuppliersQuery } from '@/store/api/suppliers.api'
import { useGetWarehousesQuery } from '@/store/api/warehouses.api'

const LIST_PATH = '/omborlar/maxsulot-kirim'

export function StockReceiptCreatePage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const suppliersQuery = useGetSuppliersQuery({ page: 1, perPage: 100 })
  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })
  const { isLoading: isLoadingAccess, allWarehouses, filterWarehouses } =
    useUserWarehouseAccess()
  const [createReceipt, createState] = useCreateStockReceiptMutation()

  const { showSkeleton } = useQueriesLoading([
    suppliersQuery,
    warehousesQuery,
    { isLoading: isLoadingAccess, isFetching: isLoadingAccess },
  ])

  const availableWarehouses = allWarehouses
    ? (warehousesQuery.data?.data ?? [])
    : filterWarehouses(warehousesQuery.data?.data ?? [])

  usePageMeta({
    title: pageTitle('Yangi kirim', 'Omborlar'),
  })

  async function handleSubmit(form: Parameters<typeof validateStockReceiptForm>[0]) {
    setError(null)

    const validationError = validateStockReceiptForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const receipt = await createReceipt(buildStockReceiptPayload(form)).unwrap()
      notify.success('Kirim yaratildi')
      navigate(`${LIST_PATH}/${receipt.id}`)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Kirim yaratish amalga oshmadi'),
      )
    }
  }

  if (showSkeleton) {
    return <FormPageSkeleton sections={1} fieldsPerSection={5} />
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Yangi kirim
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Asosiy ma&apos;lumotlarni kiriting. Yaratilgandan keyin maxsulotlar
              qo&apos;shiladi va yuborilguncha holat &quot;Jarayonda&quot; bo&apos;ladi.
            </p>
          </div>
        </div>
      </div>

      <StockReceiptForm
        suppliers={suppliersQuery.data?.data ?? []}
        warehouses={availableWarehouses}
        isSaving={createState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(LIST_PATH)}
      />
    </div>
  )
}
