import { useRef, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { PaymentTypeLogoThumb } from '@/components/payment-types/payment-type-logo-thumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { readImageFileAsDataUrl } from '@/lib/image-file'
import { cn } from '@/lib/utils'
import type {
  CreatePaymentTypeRequest,
  InstallmentPlan,
  PaymentTypeRecord,
} from '@/types/payment-type.types'

export interface PaymentTypeFormValues {
  name: string
  logo: string
  installmentPlans: InstallmentPlan[]
  isActive: boolean
}

export const emptyInstallmentPlan: InstallmentPlan = {
  months: 3,
  interestPercent: 0,
}

export const emptyPaymentTypeForm: PaymentTypeFormValues = {
  name: '',
  logo: '',
  installmentPlans: [],
  isActive: true,
}

export function paymentTypeToFormValues(
  paymentType: PaymentTypeRecord,
): PaymentTypeFormValues {
  return {
    name: paymentType.name,
    logo: paymentType.logo,
    installmentPlans: paymentType.installmentPlans.map((plan) => ({ ...plan })),
    isActive: paymentType.isActive,
  }
}

export function validatePaymentTypeForm(
  values: PaymentTypeFormValues,
): string | null {
  if (values.installmentPlans.length === 0) {
    return null
  }

  const monthsSet = new Set<number>()
  for (const plan of values.installmentPlans) {
    const months = Number(plan.months)
    const interest = Number(plan.interestPercent)

    if (!Number.isFinite(months) || months < 1 || months > 120) {
      return "Oylar soni 1 dan 120 gacha bo'lishi kerak"
    }
    if (!Number.isFinite(interest) || interest < 0 || interest > 100) {
      return 'Foiz stavkasi 0 dan 100 gacha bo\'lishi kerak'
    }
    if (monthsSet.has(months)) {
      return `Bir xil muddat (${months} oy) ikki marta kiritilgan`
    }
    monthsSet.add(months)
  }

  return null
}

export function canSubmitPaymentTypeForm(values: PaymentTypeFormValues): boolean {
  return !!values.name.trim() && validatePaymentTypeForm(values) === null
}

export function buildPaymentTypePayload(
  values: PaymentTypeFormValues,
): CreatePaymentTypeRequest {
  return {
    name: values.name.trim(),
    logo: values.logo.trim(),
    installmentPlans: values.installmentPlans.map((plan) => ({
      months: Math.trunc(Number(plan.months)),
      interestPercent: Number(plan.interestPercent),
    })),
    isActive: values.isActive,
  }
}

interface PaymentTypeFormProps {
  mode: 'create' | 'edit'
  initialValues: PaymentTypeFormValues
  isSaving?: boolean
  error?: string | null
  isSystem?: boolean
  onSubmit: (values: PaymentTypeFormValues) => void | Promise<void>
  onCancel: () => void
}

export function PaymentTypeForm({
  mode,
  initialValues,
  isSaving,
  error,
  isSystem = false,
  onSubmit,
  onCancel,
}: PaymentTypeFormProps) {
  const [form, setForm] = useState<PaymentTypeFormValues>(initialValues)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function updatePlan(index: number, patch: Partial<InstallmentPlan>) {
    setForm((prev) => ({
      ...prev,
      installmentPlans: prev.installmentPlans.map((plan, i) =>
        i === index ? { ...plan, ...patch } : plan,
      ),
    }))
  }

  function addPlan() {
    setForm((prev) => ({
      ...prev,
      installmentPlans: [...prev.installmentPlans, { ...emptyInstallmentPlan }],
    }))
  }

  function removePlan(index: number) {
    setForm((prev) => ({
      ...prev,
      installmentPlans: prev.installmentPlans.filter((_, i) => i !== index),
    }))
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    try {
      setLogoError(null)
      const dataUrl = await readImageFileAsDataUrl(file)
      setForm((prev) => ({ ...prev, logo: dataUrl }))
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Logo yuklanmadi')
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmitPaymentTypeForm(form)) {
      return
    }
    await onSubmit(form)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Asosiy ma&apos;lumotlar</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="payment-type-name">
                To&apos;lov turi nomi <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="payment-type-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isSaving || isSystem}
                autoFocus
              />
              {isSystem && (
                <p className="text-muted-foreground text-xs">
                  Tizim to&apos;lov turi — nomini o&apos;zgartirib bo&apos;lmaydi
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="payment-type-logo">Logo</FieldLabel>
              <div className="flex items-start gap-4">
                <PaymentTypeLogoThumb
                  logo={form.logo}
                  name={form.name || "To'lov turi"}
                  size="lg"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    id="payment-type-logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoChange}
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={isSaving}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Logo tanlash
                  </Button>
                  {form.logo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-auto w-fit p-0 text-xs"
                      disabled={isSaving}
                      onClick={() => setForm((prev) => ({ ...prev, logo: '' }))}
                    >
                      Logoni olib tashlash
                    </Button>
                  )}
                </div>
              </div>
              {logoError && <FieldError>{logoError}</FieldError>}
            </Field>

            <Field>
              <div className="flex items-center justify-between gap-4">
                <FieldLabel htmlFor="payment-type-active">Holat</FieldLabel>
                <div className="flex items-center gap-2">
                  <Switch
                    id="payment-type-active"
                    checked={form.isActive}
                    disabled={isSaving || isSystem}
                    onCheckedChange={(isActive) =>
                      setForm((prev) => ({ ...prev, isActive }))
                    }
                  />
                  <Label
                    htmlFor="payment-type-active"
                    className={cn(
                      'text-sm font-medium',
                      form.isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {form.isActive ? 'Faol' : 'Nofaol'}
                  </Label>
                </div>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Bo&apos;lib to&apos;lash muddatlari</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={addPlan}
            >
              <AppIcon name="plus" />
              Qator qo&apos;shish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {form.installmentPlans.length > 0 && (
            <div className="space-y-3">
              {form.installmentPlans.map((plan, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-3 rounded-lg border p-3"
                >
                  <Field className="min-w-[120px] flex-1">
                    <FieldLabel htmlFor={`plan-months-${index}`}>
                      Oylar soni
                    </FieldLabel>
                    <Input
                      id={`plan-months-${index}`}
                      type="number"
                      min={1}
                      max={120}
                      step={1}
                      value={plan.months}
                      onChange={(e) =>
                        updatePlan(index, {
                          months: Number(e.target.value),
                        })
                      }
                      disabled={isSaving}
                    />
                  </Field>
                  <Field className="min-w-[120px] flex-1">
                    <FieldLabel htmlFor={`plan-interest-${index}`}>
                      Foiz (%)
                    </FieldLabel>
                    <Input
                      id={`plan-interest-${index}`}
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={plan.interestPercent}
                      onChange={(e) =>
                        updatePlan(index, {
                          interestPercent: Number(e.target.value),
                        })
                      }
                      disabled={isSaving}
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isSaving}
                    onClick={() => removePlan(index)}
                    aria-label="Qatorni o'chirish"
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <AppIcon name="trash-2" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && <FieldError>{error}</FieldError>}

      <Separator className="shrink-0" />

      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Bekor qilish
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !canSubmitPaymentTypeForm(form)}
        >
          {isSaving ? (
            <>
              <AppIcon name="loader" className="animate-spin" />
              Saqlanmoqda...
            </>
          ) : mode === 'create' ? (
            "Qo'shish"
          ) : (
            'Saqlash'
          )}
        </Button>
      </div>
    </form>
  )
}
