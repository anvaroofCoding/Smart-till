import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  SupplierForm,
  buildSupplierPayload,
  emptySupplierForm,
  validateSupplierForm,
} from '@/components/suppliers/supplier-form'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useCreateSupplierMutation } from '@/store/api/suppliers.api'

const SUPPLIERS_LIST_PATH = '/yetkazib-beruvchilar/ro-yxat'

export function SupplierCreatePage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [createSupplier, createState] = useCreateSupplierMutation()

  usePageMeta({
    title: pageTitle('Yangi yetkazib beruvchi', 'Yetkazib beruvchilar'),
  })

  async function handleSubmit(form: typeof emptySupplierForm) {
    setError(null)

    const validationError = validateSupplierForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await createSupplier(buildSupplierPayload(form)).unwrap()
      notify.success('Yetkazib beruvchi qo\'shildi')
      navigate(SUPPLIERS_LIST_PATH)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, 'Yetkazib beruvchi qo\'shish amalga oshmadi'),
      )
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={SUPPLIERS_LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Yangi yetkazib beruvchi
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Faqat nom majburiy. Qolgan maydonlarni keyinroq ham to&apos;ldirish
              mumkin.
            </p>
          </div>
        </div>
      </div>

      <SupplierForm
        mode="create"
        initialValues={emptySupplierForm}
        isSaving={createState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(SUPPLIERS_LIST_PATH)}
      />
    </div>
  )
}
