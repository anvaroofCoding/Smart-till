import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  ProductForm,
  buildProductPayload,
  productToFormValues,
  validateProductForm,
} from '@/components/products/product-form'
import { FormPageSkeleton } from '@/components/loading'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueriesLoading, useQueryLoading } from '@/hooks/use-query-loading'
import { useGetProductBrandsQuery } from '@/store/api/product-brands.api'
import { useGetProductCategoriesQuery } from '@/store/api/product-categories.api'
import {
  useGetProductQuery,
  useUpdateProductMutation,
} from '@/store/api/products.api'

const PRODUCTS_LIST_PATH = '/maxsulotlar/ro-yxat'

export function ProductEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const productQuery = useGetProductQuery(id, { skip: !id })
  const categoriesQuery = useGetProductCategoriesQuery({ page: 1, perPage: 100 })
  const brandsQuery = useGetProductBrandsQuery({ page: 1, perPage: 100 })
  const { data: product, error: loadError } = productQuery
  const { showSkeleton: showProductSkeleton } = useQueryLoading(productQuery)
  const { showSkeleton: showOptionsSkeleton } = useQueriesLoading([
    categoriesQuery,
    brandsQuery,
  ])
  const [updateProduct, updateState] = useUpdateProductMutation()

  usePageMeta({
    title: pageTitle(product?.name ?? 'Tahrirlash', 'Maxsulotlar'),
  })

  async function handleSubmit(form: ReturnType<typeof productToFormValues>) {
    if (!id) return
    setError(null)

    const validationError = validateProductForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await updateProduct({
        id,
        body: buildProductPayload(form),
      }).unwrap()
      navigate(PRODUCTS_LIST_PATH)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Saqlash amalga oshmadi'))
    }
  }

  if (showProductSkeleton || showOptionsSkeleton) {
    return <FormPageSkeleton sections={1} fieldsPerSection={4} />
  }

  if (loadError || !product) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(loadError, 'Maxsulot topilmadi')}
        </p>
        <Button variant="outline" asChild>
          <Link to={PRODUCTS_LIST_PATH}>Ro&apos;yxatga qaytish</Link>
        </Button>
      </div>
    )
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
              Maxsulotni tahrirlash
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{product.name}</p>
          </div>
        </div>
      </div>

      <ProductForm
        key={product.id}
        mode="edit"
        initialValues={productToFormValues(product)}
        categories={categoriesQuery.data?.data ?? []}
        brands={brandsQuery.data?.data ?? []}
        product={product}
        isSaving={updateState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(PRODUCTS_LIST_PATH)}
      />
    </div>
  )
}
