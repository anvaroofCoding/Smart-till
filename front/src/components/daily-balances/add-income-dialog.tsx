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
import { Textarea } from '@/components/ui/textarea'
import { PAYMENT_CHANNEL_LABELS } from '@/lib/daily-balance-display'
import { formatMoneyInput, parseMoneyInput } from '@/lib/format-money'
import type { PaymentChannel } from '@/types/daily-balance.types'

const INCOME_CHANNELS: PaymentChannel[] = ['cash', 'terminal', 'card']

interface AddIncomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: {
    channel: PaymentChannel
    amount: number
    note?: string
  }) => void | Promise<void>
}

export function AddIncomeDialog({
  open,
  onOpenChange,
  isSaving,
  error,
  onSubmit,
}: AddIncomeDialogProps) {
  const [channel, setChannel] = useState<PaymentChannel>('cash')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setChannel('cash')
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

    setValidationError(null)
    await onSubmit({
      channel,
      amount: parsedAmount,
      note: note.trim() || undefined,
    })
  }

  const displayError = validationError ?? error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kirim qo&apos;shish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>To&apos;lov turi</FieldLabel>
              <Select
                value={channel}
                onValueChange={(value) => setChannel(value as PaymentChannel)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_CHANNELS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {PAYMENT_CHANNEL_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="income-amount">Summa</FieldLabel>
              <Input
                id="income-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                placeholder="0"
                autoFocus
                disabled={isSaving}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="income-note">Izoh (ixtiyoriy)</FieldLabel>
              <Textarea
                id="income-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
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
