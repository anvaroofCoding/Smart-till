import { useEffect, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExpenseCategoryGroup } from '@/types/daily-balance.types'

export interface ExpenseCategoryFormValues {
  name: string
  parentId?: string
}

interface ExpenseCategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'parent' | 'child'
  parentGroups: ExpenseCategoryGroup[]
  defaultParentId?: string
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: ExpenseCategoryFormValues) => void | Promise<void>
}

export function ExpenseCategoryFormDialog({
  open,
  onOpenChange,
  mode,
  parentGroups,
  defaultParentId,
  isSaving,
  error,
  onSubmit,
}: ExpenseCategoryFormDialogProps) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setParentId(defaultParentId ?? parentGroups[0]?.id ?? '')
    setValidationError(null)
  }, [open, defaultParentId, parentGroups])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setValidationError('Nomni kiriting')
      return
    }

    if (mode === 'child' && !parentId) {
      setValidationError('Asosiy xarajat turini tanlang')
      return
    }

    setValidationError(null)
    await onSubmit({
      name: trimmedName,
      parentId: mode === 'child' ? parentId : undefined,
    })
  }

  const displayError = validationError ?? error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'parent'
              ? 'Asosiy xarajat turi qo\'shish'
              : 'Ichki xarajat turi qo\'shish'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            {mode === 'child' && (
              <Field>
                <FieldLabel className="text-primary">Asosiy xarajat turi</FieldLabel>
                <Select
                  value={parentId}
                  onValueChange={setParentId}
                  disabled={isSaving || parentGroups.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="expense-category-name">
                {mode === 'parent' ? 'Asosiy tur nomi' : 'Xarajat turi'}
              </FieldLabel>
              <Input
                id="expense-category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nomini kiriting"
                autoFocus
                disabled={isSaving}
              />
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
              Yopish
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <AppIcon name="loader" className="animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
