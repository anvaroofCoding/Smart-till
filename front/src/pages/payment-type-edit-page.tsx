import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import {
  PaymentTypeForm,
  buildPaymentTypePayload,
  canSubmitPaymentTypeForm,
  paymentTypeToFormValues,
} from '@/components/payment-types/payment-type-form'
import { FormPageSkeleton } from '@/components/loading'
import { Button } from '@/components/ui/button'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import {
  useGetPaymentTypeQuery,
  useUpdatePaymentTypeMutation,
} from '@/store/api/payment-types.api'

const PAYMENT_TYPES_LIST_PATH = '/to-lov/turlari'

export function PaymentTypeEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const paymentTypeQuery = useGetPaymentTypeQuery(id, { skip: !id })
  const { data: paymentType, error: loadError } = paymentTypeQuery
  const { showSkeleton } = useQueryLoading(paymentTypeQuery)
  const [updatePaymentType, updateState] = useUpdatePaymentTypeMutation()

  usePageMeta({
    title: pageTitle(paymentType?.name ?? 'Tahrirlash', "To'lov"),
  })

  useEffect(() => {
    if (!loadError) return
    notify.error(getApiErrorMessage(loadError, "To'lov turi topilmadi"))
  }, [loadError])

  async function handleSubmit(
    form: ReturnType<typeof paymentTypeToFormValues>,
  ) {
    if (!id) return
    setError(null)

    if (!canSubmitPaymentTypeForm(form)) {
      return
    }

    try {
      await updatePaymentType({
        id,
        body: buildPaymentTypePayload(form),
      }).unwrap()
      notify.success("To'lov turi saqlandi")
      navigate(PAYMENT_TYPES_LIST_PATH)
    } catch (err) {
      notify.error(getApiErrorMessage(err, 'Saqlash amalga oshmadi'))
    }
  }

  if (showSkeleton) {
    return <FormPageSkeleton sections={2} fieldsPerSection={3} />
  }

  if (loadError || !paymentType) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(loadError, "To'lov turi topilmadi")}
        </p>
        <Button variant="outline" asChild>
          <Link to={PAYMENT_TYPES_LIST_PATH}>Ro&apos;yxatga qaytish</Link>
        </Button>
      </div>
    )
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
              To&apos;lov turini tahrirlash
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {paymentType.name}
            </p>
          </div>
        </div>
      </div>

      <PaymentTypeForm
        key={paymentType.id}
        mode="edit"
        initialValues={paymentTypeToFormValues(paymentType)}
        isSaving={updateState.isLoading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(PAYMENT_TYPES_LIST_PATH)}
      />
    </div>
  )
}
