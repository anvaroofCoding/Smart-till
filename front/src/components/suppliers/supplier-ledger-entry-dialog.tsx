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
import { parseMoneyInput, formatMoneyInput } from '@/lib/format-money'
import type { SupplierLedgerEntryType } from '@/types/supplier-ledger.types'

export interface SupplierLedgerEntryFormValues {
  amountUzs: string
  amountUsd: string
}

const emptyForm: SupplierLedgerEntryFormValues = {
  amountUzs: '',
  amountUsd: '',
}

function validateForm(values: SupplierLedgerEntryFormValues): string | null {
  const amountUzs = parseMoneyInput(values.amountUzs)
  const amountUsd = parseMoneyInput(values.amountUsd)

  if (amountUzs <= 0 && amountUsd <= 0) {
    return 'Kamida bitta valyutada summani kiriting'
  }

  return null
}

interface SupplierLedgerEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: SupplierLedgerEntryType
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: { amountUzs?: number; amountUsd?: number }) => void | Promise<void>
}

export function SupplierLedgerEntryDialog({
  open,
  onOpenChange,
  type,
  isSaving,
  error,
  onSubmit,
}: SupplierLedgerEntryDialogProps) {
  const [values, setValues] = useState<SupplierLedgerEntryFormValues>(emptyForm)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(emptyForm)
    setValidationError(null)
  }, [open, type])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const message = validateForm(values)
    if (message) {
      setValidationError(message)
      return
    }

    setValidationError(null)

    const amountUzs = parseMoneyInput(values.amountUzs)
    const amountUsd = parseMoneyInput(values.amountUsd)

    await onSubmit({
      ...(amountUzs > 0 ? { amountUzs } : {}),
      ...(amountUsd > 0 ? { amountUsd } : {}),
    })
  }

  const displayError = validationError ?? error
  const isDebt = type === 'debt'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isDebt ? 'Qarzdorlik qo\'shish' : 'To\'lov qo\'shish'}
          </DialogTitle>
          <DialogDescription>
            Kamida bitta valyutada summani kiriting. Ikkala valyutani ham
            kiritishingiz mumkin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="ledger-amount-uzs">Summa (UZS)</FieldLabel>
              <Input
                id="ledger-amount-uzs"
                inputMode="decimal"
                value={values.amountUzs}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    amountUzs: formatMoneyInput(e.target.value),
                  }))
                }
                placeholder="0"
                autoFocus
                disabled={isSaving}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="ledger-amount-usd">Summa (USD)</FieldLabel>
              <Input
                id="ledger-amount-usd"
                inputMode="decimal"
                value={values.amountUsd}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    amountUsd: formatMoneyInput(e.target.value),
                  }))
                }
                placeholder="0"
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
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <AppIcon name="loader" className="animate-spin" />}
              Qo&apos;shish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
