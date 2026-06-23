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
import type { ProductBrandRecord } from '@/types/product-brand.types'

export interface BrandFormValues {
  name: string
  description: string
  isActive: boolean
}

const emptyForm: BrandFormValues = {
  name: '',
  description: '',
  isActive: true,
}

function brandToForm(brand: ProductBrandRecord): BrandFormValues {
  return {
    name: brand.name,
    description: brand.description,
    isActive: brand.isActive,
  }
}

function validateForm(values: BrandFormValues): string | null {
  if (!values.name.trim()) {
    return 'Brend nomini kiriting'
  }
  return null
}

interface BrandFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  brand?: ProductBrandRecord | null
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: BrandFormValues) => void | Promise<void>
}

export function BrandFormDialog({
  open,
  onOpenChange,
  mode,
  brand,
  isSaving,
  error,
  onSubmit,
}: BrandFormDialogProps) {
  const [values, setValues] = useState<BrandFormValues>(emptyForm)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(mode === 'edit' && brand ? brandToForm(brand) : emptyForm)
    setValidationError(null)
  }, [open, mode, brand])

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
            {mode === 'create' ? 'Yangi brend' : 'Brendni tahrirlash'}
          </DialogTitle>
          <DialogDescription>
            Nom majburiy. Izoh va holat ixtiyoriy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="brand-name">
                Nomi <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="brand-name"
                value={values.name}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Masalan: Samsung"
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="brand-description">Izoh</FieldLabel>
              <textarea
                id="brand-description"
                value={values.description}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brend haqida qisqacha ma'lumot"
                rows={3}
                className={cn(
                  'border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-20 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                )}
              />
            </Field>

            <Field>
              <div className="flex items-center justify-between gap-4">
                <FieldLabel htmlFor="brand-active">Holat</FieldLabel>
                <div className="flex items-center gap-2">
                  <Switch
                    id="brand-active"
                    checked={values.isActive}
                    onCheckedChange={(isActive) =>
                      setValues((prev) => ({ ...prev, isActive }))
                    }
                  />
                  <Label
                    htmlFor="brand-active"
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
