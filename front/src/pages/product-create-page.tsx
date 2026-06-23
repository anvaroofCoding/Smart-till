import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  ProductForm,
  buildProductPayload,
  emptyProductForm,
  validateProductForm,
} from '@/components/products/product-form'
import { FormPageSkeleton } from '@/components/loading'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueriesLoading } from '@/hooks/use-query-loading'
import { useGetProductBrandsQuery } from '@/store/api/product-brands.api'
import { useGetProductCategoriesQuery } from '@/store/api/product-categories.api'
import { useCreateProductMutation } from '@/store/api/products.api'

const PRODUCTS_LIST_PATH = '/maxsulotlar/ro-yxat'

export function ProductCreatePage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const categoriesQuery = useGetProductCategoriesQuery({ page: 1, perPage: 100 })
  const brandsQuery = useGetProductBrandsQuery({ page: 1, perPage: 100 })
  const [createProduct, createState] = useCreateProductMutation()

  const { showSkeleton } = useQueriesLoading([categoriesQuery, brandsQuery])

  usePageMeta({
    title: pageTitle('Yangi maxsulot', 'Maxsulotlar'),
  })

  async function handleSubmit(form: typeof emptyProductForm) {
    setError(null)

    const validationError = validateProductForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await createProduct(buildProductPayload(form)).unwrap()
      navigate(PRODUCTS_LIST_PATH)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Maxsulot qo\'shish amalga oshmadi'))
    }
  }

  if (showSkeleton) {
    return <FormPageSkeleton sections={1} fieldsPerSection={4} />
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={PRODUCTS_LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Yangi maxsulot
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Nom, kategoriya va brend majburiy. Rasm ixtiyoriy.
            </p>
          </div>
        </div>
      </div>

      <ProductForm
        mode="create"
        initialValues={emptyProductForm}
        categories={categoriesQuery.data?.data ?? []}
        brands={brandsQuery.data?.data ?? []}
        isSaving={createState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(PRODUCTS_LIST_PATH)}
      />
    </div>
  )
}
