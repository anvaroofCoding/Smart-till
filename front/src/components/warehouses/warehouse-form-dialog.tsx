import { useEffect, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { formatMoneyInput, parseMoneyInput } from '@/lib/format-money'
import type { WarehouseRecord } from '@/types/warehouse.types'

export interface WarehouseFormValues {
  name: string
  address: string
  description: string
  isActive: boolean
  dailySalesPlan: string
}

const emptyForm: WarehouseFormValues = {
  name: '',
  address: '',
  description: '',
  isActive: true,
  dailySalesPlan: '',
}

function warehouseToForm(warehouse: WarehouseRecord): WarehouseFormValues {
  return {
    name: warehouse.name,
    address: warehouse.address,
    description: warehouse.description,
    isActive: warehouse.isActive,
    dailySalesPlan:
      warehouse.dailySalesPlan > 0
        ? formatMoneyInput(String(warehouse.dailySalesPlan))
        : '',
  }
}

function validateForm(values: WarehouseFormValues): string | null {
  if (!values.name.trim()) {
    return 'Ombor nomini kiriting'
  }
  return null
}

interface WarehouseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  warehouse?: WarehouseRecord | null
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: WarehouseFormValues) => void | Promise<void>
}

export function WarehouseFormDialog({
  open,
  onOpenChange,
  mode,
  warehouse,
  isSaving,
  error,
  onSubmit,
}: WarehouseFormDialogProps) {
  const [values, setValues] = useState<WarehouseFormValues>(emptyForm)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(
      mode === 'edit' && warehouse ? warehouseToForm(warehouse) : emptyForm,
    )
    setValidationError(null)
  }, [open, mode, warehouse])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const message = validateForm(values)
    if (message) {
      setValidationError(message)
      return
    }
    setValidationError(null)
    await onSubmit(values)
  }

  const displayError = validationError ?? error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Yangi ombor' : 'Omborni tahrirlash'}
          </DialogTitle>
          <DialogDescription>
            Ombor nomi majburiy. Manzil, izoh va holat ixtiyoriy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="warehouse-name">
                Ombor nomi <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="warehouse-name"
                value={values.name}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Masalan: Asosiy ombor"
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="warehouse-address">Manzil</FieldLabel>
              <Input
                id="warehouse-address"
                value={values.address}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Masalan: Toshkent sh., Chilonzor tumani"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="warehouse-description">Izoh</FieldLabel>
              <textarea
                id="warehouse-description"
                value={values.description}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Ombor haqida qisqacha ma'lumot"
                rows={3}
                className={cn(
                  'border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-20 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                )}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="warehouse-daily-plan">Kunlik plan</FieldLabel>
              <Input
                id="warehouse-daily-plan"
                inputMode="decimal"
                value={values.dailySalesPlan}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    dailySalesPlan: formatMoneyInput(e.target.value),
                  }))
                }
                placeholder="Masalan: 50 000 000"
              />
              <p className="text-muted-foreground text-xs">
                Do&apos;kon kuniga qancha savdo qilishi kerakligini so&apos;mda
                kiriting
              </p>
            </Field>

            <Field>
              <div className="flex items-center justify-between gap-4">
                <FieldLabel htmlFor="warehouse-active">Holat</FieldLabel>
                <div className="flex items-center gap-2">
                  <Switch
                    id="warehouse-active"
                    checked={values.isActive}
                    onCheckedChange={(isActive) =>
                      setValues((prev) => ({ ...prev, isActive }))
                    }
                  />
                  <Label
                    htmlFor="warehouse-active"
                    className={cn(
                      'text-sm font-medium',
                      values.isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {values.isActive ? 'Faol' : 'Nofaol'}
                  </Label>
                </div>
              </div>
            </Field>

            {displayError && <FieldError>{displayError}</FieldError>}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <AppIcon name="loader" className="animate-spin" />}
              {mode === 'create' ? "Qo'shish" : 'Saqlash'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
