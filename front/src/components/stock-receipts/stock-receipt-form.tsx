import { useMemo, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { useUserWarehouseAccess } from '@/hooks/use-user-warehouse-access'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  RECEIPT_PAYMENT_TYPES,
  RECEIPT_PAYMENT_TYPE_LABELS,
} from '@/lib/stock-receipt'
import type { CreateStockReceiptRequest } from '@/types/stock-receipt.types'
import type { SupplierRecord } from '@/types/supplier.types'
import type { WarehouseRecord } from '@/types/warehouse.types'

export interface StockReceiptFormValues {
  name: string
  paymentType: string
  supplierId: string
  warehouseId: string
  exchangeRate: string
  notes: string
}

export const emptyStockReceiptForm: StockReceiptFormValues = {
  name: '',
  paymentType: '',
  supplierId: '',
  warehouseId: '',
  exchangeRate: '',
  notes: '',
}

export function validateStockReceiptForm(
  values: StockReceiptFormValues,
): string | null {
  if (!values.name.trim()) return 'Kirim nomini kiriting'
  if (!values.paymentType) return "To'lov turini tanlang"
  if (!values.supplierId) return 'Yetkazib beruvchini tanlang'
  if (!values.warehouseId) return 'Omborni tanlang'

  const rate = Number(values.exchangeRate)
  if (!values.exchangeRate.trim() || Number.isNaN(rate) || rate <= 0) {
    return 'Valyuta kursini kiriting'
  }

  return null
}

export function buildStockReceiptPayload(
  values: StockReceiptFormValues,
): CreateStockReceiptRequest {
  return {
    name: values.name.trim(),
    paymentType: values.paymentType as CreateStockReceiptRequest['paymentType'],
    supplierId: values.supplierId,
    warehouseId: values.warehouseId,
    exchangeRate: Number(values.exchangeRate),
    notes: values.notes.trim() || undefined,
  }
}

interface StockReceiptFormProps {
  suppliers: SupplierRecord[]
  warehouses: WarehouseRecord[]
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: StockReceiptFormValues) => void | Promise<void>
  onCancel: () => void
}

export function StockReceiptForm({
  suppliers,
  warehouses,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: StockReceiptFormProps) {
  const [form, setForm] = useState<StockReceiptFormValues>(emptyStockReceiptForm)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { filterWarehouses, canAccessWarehouse, isLoading: isLoadingAccess } =
    useUserWarehouseAccess()

  const activeSuppliers = suppliers.filter((item) => item.isActive)
  const activeWarehouses = useMemo(
    () => filterWarehouses(warehouses.filter((item) => item.isActive)),
    [filterWarehouses, warehouses],
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const message = validateStockReceiptForm(form)
    if (message) {
      setValidationError(message)
      return
    }
    if (!canAccessWarehouse(form.warehouseId)) {
      setValidationError('Bu omborga ruxsatingiz yo\'q')
      return
    }
    setValidationError(null)
    await onSubmit(form)
  }

  const displayError = validationError ?? error

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Kirim ma&apos;lumotlari</CardTitle>
          <CardDescription>
            Kirim nomi, to&apos;lov turi, yetkazib beruvchi, ombor va valyuta
            kursi majburiy. Izoh ixtiyoriy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="receipt-name">
                Kirim nomi <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="receipt-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Masalan: Mart oyi kirimi"
                autoFocus
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="receipt-payment">
                  To&apos;lov turi <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={form.paymentType || undefined}
                  onValueChange={(paymentType) =>
                    setForm((prev) => ({ ...prev, paymentType }))
                  }
                >
                  <SelectTrigger id="receipt-payment" className="w-full">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECEIPT_PAYMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {RECEIPT_PAYMENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="receipt-rate">
                  Valyuta kursi <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="receipt-rate"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={form.exchangeRate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      exchangeRate: e.target.value,
                    }))
                  }
                  placeholder="Masalan: 12850"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="receipt-supplier">
                  Yetkazib beruvchi <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={form.supplierId || undefined}
                  onValueChange={(supplierId) =>
                    setForm((prev) => ({ ...prev, supplierId }))
                  }
                  disabled={activeSuppliers.length === 0}
                >
                  <SelectTrigger id="receipt-supplier" className="w-full">
                    <SelectValue
                      placeholder={
                        activeSuppliers.length === 0
                          ? 'Yetkazib beruvchilar topilmadi'
                          : 'Tanlang'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="receipt-warehouse">
                  Ombor <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={form.warehouseId || undefined}
                  onValueChange={(warehouseId) =>
                    setForm((prev) => ({ ...prev, warehouseId }))
                  }
                  disabled={
                    isLoadingAccess || activeWarehouses.length === 0
                  }
                >
                  <SelectTrigger id="receipt-warehouse" className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingAccess
                          ? 'Yuklanmoqda...'
                          : activeWarehouses.length === 0
                            ? 'Sizga biriktirilgan ombor yo\'q'
                            : 'Tanlang'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {activeWarehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="receipt-notes">Izoh</FieldLabel>
              <Textarea
                id="receipt-notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Qo'shimcha ma'lumot (ixtiyoriy)"
                rows={3}
              />
            </Field>

            {displayError && <FieldError>{displayError}</FieldError>}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex shrink-0 justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <AppIcon name="loader" className="animate-spin" />}
          Yaratish va davom etish
        </Button>
      </div>
    </form>
  )
}
