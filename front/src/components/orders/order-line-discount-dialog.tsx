import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatMoneyInput, parseMoneyInput } from '@/lib/format-money'

interface OrderLineDiscountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  initialDiscount: number
  onSave: (discount: number) => void
}

export function OrderLineDiscountDialog({
  open,
  onOpenChange,
  productName,
  initialDiscount,
  onSave,
}: OrderLineDiscountDialogProps) {
  const [value, setValue] = useState(formatMoneyInput(String(initialDiscount || '')))

  useEffect(() => {
    if (!open) return
    setValue(formatMoneyInput(String(initialDiscount || '')))
  }, [open, initialDiscount])

  function handleSave() {
    onSave(parseMoneyInput(value))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chegirma</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>{productName}</FieldLabel>
            <Input
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(formatMoneyInput(e.target.value))}
              autoFocus
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button type="button" onClick={handleSave}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
