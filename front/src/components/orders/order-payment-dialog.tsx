import { useEffect, useMemo, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatMoneyInput, parseMoneyInput } from '@/lib/format-money'
import type { PaymentTypeRecord } from '@/types/payment-type.types'
import type { OrderPaymentLine } from '@/types/order.types'
import { createPaymentId } from '@/components/orders/order-create-utils'

interface OrderPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentTypes: PaymentTypeRecord[]
  remainingAmount: number
  onAdd: (payment: OrderPaymentLine) => void
}

export function OrderPaymentDialog({
  open,
  onOpenChange,
  paymentTypes,
  remainingAmount,
  onAdd,
}: OrderPaymentDialogProps) {
  const [paymentTypeId, setPaymentTypeId] = useState('')
  const [installmentMonths, setInstallmentMonths] = useState('')
  const [amount, setAmount] = useState('')

  const selectedPaymentType = useMemo(
    () => paymentTypes.find((item) => item.id === paymentTypeId) ?? null,
    [paymentTypeId, paymentTypes],
  )

  const hasInstallments =
    (selectedPaymentType?.installmentPlans.length ?? 0) > 0

  useEffect(() => {
    if (!open) return
    setPaymentTypeId('')
    setInstallmentMonths('')
    setAmount(
      remainingAmount > 0 ? formatMoneyInput(String(remainingAmount)) : '',
    )
  }, [open, remainingAmount])

  useEffect(() => {
    if (!selectedPaymentType) {
      setInstallmentMonths('')
      return
    }
    if (selectedPaymentType.installmentPlans.length === 1) {
      setInstallmentMonths(String(selectedPaymentType.installmentPlans[0].months))
    } else {
      setInstallmentMonths('')
    }
  }, [selectedPaymentType])

  function handleAdd() {
    if (!selectedPaymentType) return

    const parsedAmount = parseMoneyInput(amount)
    if (parsedAmount <= 0) return

    const selectedPlan = selectedPaymentType.installmentPlans.find(
      (plan) => String(plan.months) === installmentMonths,
    )

    onAdd({
      id: createPaymentId(),
      paymentTypeId: selectedPaymentType.id,
      paymentTypeName: selectedPaymentType.name,
      amount: parsedAmount,
      installmentMonths: selectedPlan?.months,
      installmentInterestPercent: selectedPlan?.interestPercent,
    })
    onOpenChange(false)
  }

  const canAdd =
    !!selectedPaymentType &&
    parseMoneyInput(amount) > 0 &&
    (!hasInstallments || !!installmentMonths)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>To&apos;lov qo&apos;shish</DialogTitle>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel>To&apos;lov turi</FieldLabel>
            <Select value={paymentTypeId} onValueChange={setPaymentTypeId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentTypes.map((paymentType) => (
                  <SelectItem key={paymentType.id} value={paymentType.id}>
                    {paymentType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {hasInstallments && (
            <Field>
              <FieldLabel>Muddat (oy)</FieldLabel>
              <Select
                value={installmentMonths}
                onValueChange={setInstallmentMonths}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedPaymentType?.installmentPlans.map((plan) => (
                    <SelectItem key={plan.months} value={String(plan.months)}>
                      {plan.months} oy — {plan.interestPercent}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field>
            <FieldLabel>Summa</FieldLabel>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button type="button" disabled={!canAdd} onClick={handleAdd}>
            Qo&apos;shish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
