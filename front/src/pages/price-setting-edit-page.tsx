import { useEffect, useState } from 'react'

import { Link, useNavigate, useParams } from 'react-router-dom'



import { AppIcon } from '@/components/icons/app-icon'

import {

  PriceSettingForm,

  buildPriceSettingPayload,

  canSubmitPriceSettingForm,

  priceSettingToFormValues,

} from '@/components/price-settings/price-setting-form'

import { FormPageSkeleton } from '@/components/loading'

import { Button } from '@/components/ui/button'

import { pageTitle } from '@/config/seo'

import { usePageMeta } from '@/hooks/use-page-meta'

import { useQueriesLoading, useQueryLoading } from '@/hooks/use-query-loading'

import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'

import { getApiErrorMessage } from '@/lib/api-error'

import { notify } from '@/lib/notify'

import { useGetProductBrandsQuery } from '@/store/api/product-brands.api'

import { useGetProductCategoriesQuery } from '@/store/api/product-categories.api'

import {

  useGetPriceSettingQuery,

  useUpdatePriceSettingMutation,

} from '@/store/api/price-settings.api'

import { useGetProductsQuery } from '@/store/api/products.api'

import { useGetWarehousesQuery } from '@/store/api/warehouses.api'

import { getPriceSettingTargetLabel } from '@/types/price-setting.types'



const PRICE_SETTINGS_LIST_PATH = '/sozlamalar/narx'



export function PriceSettingEditPage() {

  const { id = '' } = useParams()

  const navigate = useNavigate()

  const { filterWarehouses } = useUserWarehouseAccess()

  const [error, setError] = useState<string | null>(null)



  const priceSettingQuery = useGetPriceSettingQuery(id, { skip: !id })

  const { data: priceSetting, error: loadError } = priceSettingQuery

  const { showSkeleton: showDetailSkeleton } = useQueryLoading(priceSettingQuery)

  const [updatePriceSetting, updateState] = useUpdatePriceSettingMutation()



  const categoriesQuery = useGetProductCategoriesQuery({ page: 1, perPage: 100 })

  const brandsQuery = useGetProductBrandsQuery({ page: 1, perPage: 100 })

  const productsQuery = useGetProductsQuery({ page: 1, perPage: 100 })

  const warehousesQuery = useGetWarehousesQuery({ page: 1, perPage: 100 })



  const { showSkeleton: showCatalogSkeleton } = useQueriesLoading([

    categoriesQuery,

    brandsQuery,

    productsQuery,

    warehousesQuery,

  ])



  usePageMeta({

    title: pageTitle(

      priceSetting ? getPriceSettingTargetLabel(priceSetting) : 'Tahrirlash',

      'Sozlamalar',

    ),

  })



  useEffect(() => {

    if (!loadError) return

    notify.error(getApiErrorMessage(loadError, 'Narx sozlamasi topilmadi'))

  }, [loadError])



  async function handleSubmit(

    form: ReturnType<typeof priceSettingToFormValues>,

  ) {

    if (!id) return

    setError(null)



    if (!canSubmitPriceSettingForm(form)) {

      return

    }



    try {

      await updatePriceSetting({

        id,

        body: buildPriceSettingPayload(form),

      }).unwrap()

      notify.success('Narx sozlamasi saqlandi')

      navigate(PRICE_SETTINGS_LIST_PATH)

    } catch (err) {

      notify.error(getApiErrorMessage(err, 'Saqlash amalga oshmadi'))

    }

  }



  if (showDetailSkeleton || showCatalogSkeleton) {

    return <FormPageSkeleton sections={1} fieldsPerSection={6} />

  }



  if (loadError || !priceSetting) {

    return (

      <div className="space-y-4">

        <p className="text-destructive text-sm">

          {getApiErrorMessage(loadError, 'Narx sozlamasi topilmadi')}

        </p>

        <Button variant="outline" asChild>

          <Link to={PRICE_SETTINGS_LIST_PATH}>Ro&apos;yxatga qaytish</Link>

        </Button>

      </div>

    )

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

              Narx sozlamasini tahrirlash

            </h1>

            <p className="text-muted-foreground mt-1 text-sm">

              {getPriceSettingTargetLabel(priceSetting)}

            </p>

          </div>

        </div>

      </div>



      <PriceSettingForm

        key={priceSetting.id}

        mode="edit"

        initialValues={priceSettingToFormValues(priceSetting)}

        warehouses={filterWarehouses(warehousesQuery.data?.data ?? [])}

        categories={categoriesQuery.data?.data ?? []}

        brands={brandsQuery.data?.data ?? []}

        products={productsQuery.data?.data ?? []}

        isSaving={updateState.isLoading}

        error={error}

        onSubmit={handleSubmit}

        onCancel={() => navigate(PRICE_SETTINGS_LIST_PATH)}

      />

    </div>

  )

}


