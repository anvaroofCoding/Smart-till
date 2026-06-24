import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  PriceSettingForm,
  buildPriceSettingPayload,
  canSubmitPriceSettingForm,
  emptyPriceSettingForm,
} from '@/components/price-settings/price-setting-form'
import { FormPageSkeleton } from '@/components/loading'
import { Button } from '@/components/ui/button'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueriesLoading } from '@/hooks/use-query-loading'
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { useGetProductBrandsQuery } from '@/store/api/product-brands.api'
import { useGetProductCategoriesQuery } from '@/store/api/product-categories.api'
import { useCreatePriceSettingMutation } from '@/store/api/price-settings.api'
import { useGetProductsQuery } from '@/store/api/products.api'
import { useGetWarehousesQuery } from '@/store/api/warehouses.api'

const PRICE_SETTINGS_LIST_PATH = '/sozlamalar/narx'

export function PriceSettingCreatePage() {
  const navigate = useNavigate()
  const { filterWarehouses } = useUserWarehouseAccess()
  const [error, setError] = useState<string | null>(null)
  const [createPriceSetting, createState] = useCreatePriceSettingMutation()

  const categoriesQuery = useGetProductCategoriesQuery({ page: 1, perPage: 100 })
  const brandsQuery = useGetProductBrandsQuery({ page: 1, perPage: 100 })
  const productsQuery = useGetProductsQuery({ page: 1, perPage: 100 })
  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })

  const { showSkeleton } = useQueriesLoading([
    categoriesQuery,
    brandsQuery,
    productsQuery,
    warehousesQuery,
  ])

  usePageMeta({
    title: pageTitle('Yangi narx sozlamasi', 'Sozlamalar'),
  })

  async function handleSubmit(form: typeof emptyPriceSettingForm) {
    setError(null)

    if (!canSubmitPriceSettingForm(form)) {
      return
    }

    try {
      await createPriceSetting(buildPriceSettingPayload(form)).unwrap()
      notify.success('Narx sozlamasi yaratildi')
      navigate(PRICE_SETTINGS_LIST_PATH)
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Saqlash amalga oshmadi'))
    }
  }

  if (showSkeleton) {
    return <FormPageSkeleton sections={1} fieldsPerSection={6} />
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={PRICE_SETTINGS_LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Yangi narx sozlamasi
            </h1>
          </div>
        </div>
      </div>

      <PriceSettingForm
        mode="create"
        initialValues={emptyPriceSettingForm}
        warehouses={filterWarehouses(warehousesQuery.data?.data ?? [])}
        categories={categoriesQuery.data?.data ?? []}
        brands={brandsQuery.data?.data ?? []}
        products={productsQuery.data?.data ?? []}
        isSaving={createState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(PRICE_SETTINGS_LIST_PATH)}
      />
    </div>
  )
}
