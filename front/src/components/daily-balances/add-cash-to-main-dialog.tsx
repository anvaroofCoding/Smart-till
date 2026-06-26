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
import { Textarea } from '@/components/ui/textarea'
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format-money'

interface AddCashToMainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableCash: number
  mainBalance: number
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: { amount: number; note?: string }) => void | Promise<void>
}

export function AddCashToMainDialog({
  open,
  onOpenChange,
  availableCash,
  mainBalance,
  isSaving,
  error,
  onSubmit,
}: AddCashToMainDialogProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setAmount('')
    setNote('')
    setValidationError(null)
  }, [open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const parsedAmount = parseMoneyInput(amount)
    if (parsedAmount <= 0) {
      setValidationError('Summani kiriting')
      return
    }

    if (parsedAmount > availableCash) {
      setValidationError(
        `Bugungi naqd pul yetarli emas. Mavjud: ${formatMoney(availableCash)}`,
      )
      return
    }

    setValidationError(null)
    await onSubmit({
      amount: parsedAmount,
      note: note.trim() || undefined,
    })
  }

  const displayError = validationError ?? error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asosiy balansga pul qo&apos;shish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <div className="bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Asosiy balans</span>
                <span className="font-medium tabular-nums">
                  {formatMoney(mainBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">
                  O&apos;tkazish uchun mavjud naqd
                </span>
                <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatMoney(availableCash)}
                </span>
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="deposit-amount">Naqd summa</FieldLabel>
              <Input
                id="deposit-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                placeholder="0"
                autoFocus
                disabled={isSaving || availableCash <= 0}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="deposit-note">Izoh (ixtiyoriy)</FieldLabel>
              <Textarea
                id="deposit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                disabled={isSaving}
              />
            </Field>

            {availableCash <= 0 && (
              <p className="text-muted-foreground text-sm">
                Bugungi naqd pul qoldig&apos;i yo&apos;q yoki allaqachon asosiy
                balansga o&apos;tkazilgan.
              </p>
            )}

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
            <Button
              type="submit"
              disabled={isSaving || availableCash <= 0}
            >
              {isSaving && <AppIcon name="loader" className="animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
