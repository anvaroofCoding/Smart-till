import { useEffect, useMemo, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { ExpenseSubcategorySelect } from '@/components/daily-balances/expense-subcategory-select'
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
import { formatMoney, formatMoneyInput, parseMoneyInput } from '@/lib/format-money'
import type { ExpenseCategoryGroup } from '@/types/daily-balance.types'

interface AddExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryGroups: ExpenseCategoryGroup[]
  mainBalance: number
  isSaving?: boolean
  error?: string | null
  onSubmit: (values: {
    expenseCategoryId: string
    amount: number
    note?: string
  }) => void | Promise<void>
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  categoryGroups,
  mainBalance,
  isSaving,
  error,
  onSubmit,
}: AddExpenseDialogProps) {
  const [parentId, setParentId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const selectedGroup = useMemo(
    () => categoryGroups.find((group) => group.id === parentId),
    [categoryGroups, parentId],
  )
  const subcategories = selectedGroup?.children ?? []

  useEffect(() => {
    if (!open) return
    const firstGroup = categoryGroups[0]
    const firstParentId = firstGroup?.id ?? ''
    setParentId(firstParentId)
    setSubcategoryId(firstGroup?.children?.[0]?.id ?? '')
    setAmount('')
    setNote('')
    setValidationError(null)
  }, [open, categoryGroups])

  useEffect(() => {
    if (!parentId) {
      setSubcategoryId('')
      return
    }

    const group = categoryGroups.find((item) => item.id === parentId)
    const children = group?.children ?? []
    const firstChildId = children[0]?.id ?? ''
    setSubcategoryId((current) => {
      if (children.some((child) => child.id === current)) {
        return current
      }
      return firstChildId
    })
  }, [parentId, categoryGroups])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!parentId) {
      setValidationError('Asosiy xarajat turini tanlang')
      return
    }

    if (!subcategoryId) {
      setValidationError('Xarajat turini tanlang')
      return
    }

    const parsedAmount = parseMoneyInput(amount)
    if (parsedAmount <= 0) {
      setValidationError('Summani kiriting')
      return
    }

    if (parsedAmount > mainBalance) {
      setValidationError(
        `Asosiy balansda yetarli mablag' yo'q. Mavjud: ${formatMoney(mainBalance)}`,
      )
      return
    }

    setValidationError(null)
    await onSubmit({
      expenseCategoryId: subcategoryId,
      amount: parsedAmount,
      note: note.trim() || undefined,
    })
  }

  const displayError = validationError ?? error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xarajat qo&apos;shish</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4">
            <div className="bg-muted/40 flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
              <span className="text-muted-foreground">Asosiy balans</span>
              <span className="font-medium tabular-nums">{formatMoney(mainBalance)}</span>
            </div>

            <Field>
              <FieldLabel className="text-primary">Asosiy xarajat turi</FieldLabel>
              <Select
                value={parentId}
                onValueChange={setParentId}
                disabled={isSaving || categoryGroups.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {categoryGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel className="text-destructive">
                Xarajat turi <span>*</span>
              </FieldLabel>
              <ExpenseSubcategorySelect
                options={subcategories}
                value={subcategoryId}
                onChange={setSubcategoryId}
                disabled={isSaving || subcategories.length === 0}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="expense-amount">Summa</FieldLabel>
              <Input
                id="expense-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                placeholder="0"
                disabled={isSaving}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="expense-note">Izoh (ixtiyoriy)</FieldLabel>
              <Textarea
                id="expense-note"
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
            <Button
              type="submit"
              disabled={
                isSaving ||
                categoryGroups.length === 0 ||
                subcategories.length === 0 ||
                mainBalance <= 0
              }
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
