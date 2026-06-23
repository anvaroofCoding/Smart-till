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
import type { ProductCategoryRecord } from '@/types/product-category.types'

export interface CategoryFormValues {
  name: string
  description: string
  isActive: boolean
}

const emptyForm: CategoryFormValues = {
  name: '',
  description: '',
  isActive: true,
}

function categoryToForm(category: ProductCategoryRecord): CategoryFormValues {
  return {
    name: category.name,
    description: category.description,
    isActive: category.isActive,
  }
}

function validateForm(values: CategoryFormValues): string | null {
  if (!values.name.trim()) {
    return 'Kategoriya nomini kiriting'
  }
  return null
}

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  category?: ProductCategoryRecord | null
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: CategoryFormValues) => void | Promise<void>
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  mode,
  category,
  isSaving,
  error,
  onSubmit,
}: CategoryFormDialogProps) {
  const [values, setValues] = useState<CategoryFormValues>(emptyForm)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(
      mode === 'edit' && category ? categoryToForm(category) : emptyForm,
    )
    setValidationError(null)
  }, [open, mode, category])

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
            {mode === 'create' ? 'Yangi kategoriya' : 'Kategoriyani tahrirlash'}
          </DialogTitle>
          <DialogDescription>
            Nom majburiy. Izoh va holat ixtiyoriy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="category-name">
                Nomi <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="category-name"
                value={values.name}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Masalan: Elektronika"
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="category-description">Izoh</FieldLabel>
              <textarea
                id="category-description"
                value={values.description}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Kategoriya haqida qisqacha ma'lumot"
                rows={3}
                className={cn(
                  'border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-20 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                )}
              />
            </Field>

            <Field>
              <div className="flex items-center justify-between gap-4">
                <FieldLabel htmlFor="category-active">Holat</FieldLabel>
                <div className="flex items-center gap-2">
                  <Switch
                    id="category-active"
                    checked={values.isActive}
                    onCheckedChange={(isActive) =>
                      setValues((prev) => ({ ...prev, isActive }))
                    }
                  />
                  <Label
                    htmlFor="category-active"
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
