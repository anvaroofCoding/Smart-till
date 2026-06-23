import { useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  DEFAULT_SUPPLIER_CURRENCY,
  SUPPLIER_CURRENCIES,
  SUPPLIER_CURRENCY_LABELS,
} from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { CreateSupplierRequest, SupplierRecord } from '@/types/supplier.types'

export interface SupplierFormValues {
  name: string
  officialName: string
  phone: string
  address: string
  comment: string
  currency: typeof DEFAULT_SUPPLIER_CURRENCY | (typeof SUPPLIER_CURRENCIES)[number]
  isActive: boolean
}

export const emptySupplierForm: SupplierFormValues = {
  name: '',
  officialName: '',
  phone: '',
  address: '',
  comment: '',
  currency: DEFAULT_SUPPLIER_CURRENCY,
  isActive: true,
}

export function supplierToFormValues(
  supplier: SupplierRecord,
): SupplierFormValues {
  return {
    name: supplier.name,
    officialName: supplier.officialName,
    phone: supplier.phone,
    address: supplier.address,
    comment: supplier.comment,
    currency: supplier.currency,
    isActive: supplier.isActive,
  }
}

export function validateSupplierForm(values: SupplierFormValues): string | null {
  if (!values.name.trim()) return 'Nomini kiriting'
  return null
}

export function buildSupplierPayload(
  values: SupplierFormValues,
): CreateSupplierRequest {
  return {
    name: values.name.trim(),
    officialName: values.officialName.trim(),
    phone: values.phone.trim(),
    address: values.address.trim(),
    comment: values.comment.trim(),
    currency: values.currency,
    isActive: values.isActive,
  }
}

interface SupplierFormProps {
  mode: 'create' | 'edit'
  initialValues: SupplierFormValues
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: SupplierFormValues) => void | Promise<void>
  onCancel: () => void
}

export function SupplierForm({
  mode,
  initialValues,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: SupplierFormProps) {
  const [form, setForm] = useState<SupplierFormValues>(initialValues)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const validationError = validateSupplierForm(form)
    if (validationError) return
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
          <CardDescription>
            Nom majburiy. Qolgan maydonlar ixtiyoriy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="supplier-name">
                  Nomi <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="supplier-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Masalan: Tech Supply"
                  disabled={isSaving}
                  autoFocus
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="supplier-official-name">
                  Rasmiy nomi
                </FieldLabel>
                <Input
                  id="supplier-official-name"
                  value={form.officialName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      officialName: e.target.value,
                    }))
                  }
                  placeholder="Masalan: Tech Supply MCHJ"
                  disabled={isSaving}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="supplier-phone">Telefon raqami</FieldLabel>
                <Input
                  id="supplier-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+998901234567"
                  disabled={isSaving}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="supplier-currency">Valyuta</FieldLabel>
                <Select
                  value={form.currency}
                  onValueChange={(currency) =>
                    setForm((prev) => ({
                      ...prev,
                      currency: currency as SupplierFormValues['currency'],
                    }))
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id="supplier-currency" className="w-full">
                    <SelectValue placeholder="Valyutani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLIER_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {SUPPLIER_CURRENCY_LABELS[currency]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="supplier-address">Manzili</FieldLabel>
              <Input
                id="supplier-address"
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Toshkent, Chilonzor tumani..."
                disabled={isSaving}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="supplier-comment">Izoh</FieldLabel>
              <Textarea
                id="supplier-comment"
                value={form.comment}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, comment: e.target.value }))
                }
                placeholder="Qo'shimcha ma'lumot..."
                disabled={isSaving}
                rows={3}
              />
            </Field>

            <Field>
              <div className="flex items-center justify-between gap-4">
                <FieldLabel htmlFor="supplier-active">Holat</FieldLabel>
                <div className="flex items-center gap-2">
                  <Switch
                    id="supplier-active"
                    checked={form.isActive}
                    disabled={isSaving}
                    onCheckedChange={(isActive) =>
                      setForm((prev) => ({ ...prev, isActive }))
                    }
                  />
                  <Label
                    htmlFor="supplier-active"
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
        <Button type="submit" disabled={isSaving || !form.name.trim()}>
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
