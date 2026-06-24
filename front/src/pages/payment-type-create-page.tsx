import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  PaymentTypeForm,
  buildPaymentTypePayload,
  canSubmitPaymentTypeForm,
  emptyPaymentTypeForm,
} from '@/components/payment-types/payment-type-form'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useCreatePaymentTypeMutation } from '@/store/api/payment-types.api'

const PAYMENT_TYPES_LIST_PATH = '/to-lov/turlari'

export function PaymentTypeCreatePage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [createPaymentType, createState] = useCreatePaymentTypeMutation()

  usePageMeta({
    title: pageTitle("Yangi to'lov turi", "To'lov"),
  })

  async function handleSubmit(form: typeof emptyPaymentTypeForm) {
    setError(null)

    if (!canSubmitPaymentTypeForm(form)) {
      return
    }

    try {
      await createPaymentType(buildPaymentTypePayload(form)).unwrap()
      notify.success("To'lov turi qo'shildi")
      navigate(PAYMENT_TYPES_LIST_PATH)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, "To'lov turini qo'shish amalga oshmadi"),
      )
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={PAYMENT_TYPES_LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Yangi to&apos;lov turi
            </h1>
          </div>
        </div>
      </div>

      <PaymentTypeForm
        mode="create"
        initialValues={emptyPaymentTypeForm}
        isSaving={createState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(PAYMENT_TYPES_LIST_PATH)}
      />
    </div>
  )
}
