import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toIsoDateString } from '@/lib/date-format'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { useCreateWarehouseTransferDraftMutation } from '@/store/api/warehouse-transfers.api'

interface CreateTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromWarehouseId: string
  fromWarehouseName: string
  destinationWarehouses: Array<{ id: string; name: string }>
  onCreated: (draftId: string) => void
}

export function CreateTransferDialog({
  open,
  onOpenChange,
  fromWarehouseId,
  fromWarehouseName,
  destinationWarehouses,
  onCreated,
}: CreateTransferDialogProps) {
  const [name, setName] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [transferDate, setTransferDate] = useState(() => toIsoDateString(new Date()))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [createDraft, createState] = useCreateWarehouseTransferDraftMutation()

  useEffect(() => {
    if (!open) return
    setName('')
    setToWarehouseId('')
    setTransferDate(toIsoDateString(new Date()))
    setNotes('')
    setError(null)
  }, [open])

  const canSubmit = useMemo(
    () =>
      Boolean(
        fromWarehouseId &&
          name.trim() &&
          toWarehouseId &&
          transferDate.trim() &&
          toWarehouseId !== fromWarehouseId,
      ),
    [fromWarehouseId, name, toWarehouseId, transferDate],
  )

  async function handleCreate() {
    if (!fromWarehouseId) {
      setError('Sizga ombor biriktirilmagan')
      return
    }
    if (!name.trim()) {
      setError('Transfer nomini kiriting')
      return
    }
    if (!toWarehouseId) {
      setError('Qabul qiluvchi omborni tanlang')
      return
    }
    if (!transferDate.trim()) {
      setError('Sanani tanlang')
      return
    }
    if (fromWarehouseId === toWarehouseId) {
      setError('Yuboruvchi va qabul qiluvchi ombor bir xil bo\'lmasligi kerak')
      return
    }

    setError(null)

    try {
      const created = await createDraft({
        fromWarehouseId,
        name: name.trim(),
        toWarehouseId,
        transferDate,
        notes: notes.trim() || undefined,
        items: [],
      }).unwrap()

      notify.success(`"${created.name}" transferi yaratildi`)
      onOpenChange(false)
      onCreated(created.id)
    } catch (err) {
      const message = getApiErrorMessage(err, 'Transfer yaratib bo\'lmadi')
      setError(message)
      notify.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yangi transfer</DialogTitle>
          <DialogDescription>
            Transfer ma&apos;lumotlarini kiriting. Keyin maxsulotlar qo&apos;shishingiz mumkin.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel>Yuboruvchi ombor</FieldLabel>
            <Input value={fromWarehouseName} disabled readOnly />
          </Field>

          <Field>
            <FieldLabel>Transfer nomi</FieldLabel>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Masalan: Do'konga maxsulot"
              maxLength={200}
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel>Qabul qiluvchi ombor</FieldLabel>
            <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Omborni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {destinationWarehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Yuborilish sanasi</FieldLabel>
            <DatePicker value={transferDate} onChange={setTransferDate} />
          </Field>

          <Field>
            <FieldLabel>Izoh</FieldLabel>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ixtiyoriy izoh"
              rows={2}
              maxLength={500}
            />
          </Field>

          {error && <FieldError>{error}</FieldError>}
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={createState.isLoading}
            onClick={() => onOpenChange(false)}
          >
            Bekor qilish
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || createState.isLoading}
            onClick={() => void handleCreate()}
          >
            {createState.isLoading ? 'Yaratilmoqda...' : 'Yaratish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
