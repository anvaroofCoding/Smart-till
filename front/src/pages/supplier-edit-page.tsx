import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  SupplierForm,
  buildSupplierPayload,
  supplierToFormValues,
  validateSupplierForm,
} from '@/components/suppliers/supplier-form'
import { FormPageSkeleton } from '@/components/loading'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import {
  useGetSupplierQuery,
  useUpdateSupplierMutation,
} from '@/store/api/suppliers.api'

const SUPPLIERS_LIST_PATH = '/yetkazib-beruvchilar/ro-yxat'

export function SupplierEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const supplierQuery = useGetSupplierQuery(id, { skip: !id })
  const { data: supplier, error: loadError } = supplierQuery
  const { showSkeleton } = useQueryLoading(supplierQuery)
  const [updateSupplier, updateState] = useUpdateSupplierMutation()

  usePageMeta({
    title: pageTitle(supplier?.name ?? 'Tahrirlash', 'Yetkazib beruvchilar'),
  })

  useEffect(() => {
    if (!loadError) return
    notify.error(getApiErrorMessage(loadError, 'Yetkazib beruvchi topilmadi'))
  }, [loadError])

  async function handleSubmit(form: ReturnType<typeof supplierToFormValues>) {
    if (!id) return
    setError(null)

    const validationError = validateSupplierForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await updateSupplier({
        id,
        body: buildSupplierPayload(form),
      }).unwrap()
      notify.success('Yetkazib beruvchi saqlandi')
      navigate(`${SUPPLIERS_LIST_PATH}/${id}`)
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Saqlash amalga oshmadi'))
    }
  }

  if (showSkeleton) {
    return <FormPageSkeleton sections={1} fieldsPerSection={4} />
  }

  if (loadError || !supplier) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(loadError, 'Yetkazib beruvchi topilmadi')}
        </p>
        <Button variant="outline" asChild>
          <Link to={SUPPLIERS_LIST_PATH}>Ro&apos;yxatga qaytish</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={`${SUPPLIERS_LIST_PATH}/${id}`}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Yetkazib beruvchini tahrirlash
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{supplier.name}</p>
          </div>
        </div>
      </div>

      <SupplierForm
        key={supplier.id}
        mode="edit"
        initialValues={supplierToFormValues(supplier)}
        isSaving={updateState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`${SUPPLIERS_LIST_PATH}/${id}`)}
      />
    </div>
  )
}
