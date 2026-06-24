import { useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface PriceSettingDeleteButtonProps {
  label: string
  isDeleting?: boolean
  onConfirmDelete: () => void | Promise<void>
}

export function PriceSettingDeleteButton({
  label,
  isDeleting,
  onConfirmDelete,
}: PriceSettingDeleteButtonProps) {
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    try {
      await onConfirmDelete()
      setOpen(false)
    } catch {
      // Xatolik parent komponentda ko'rsatiladi.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isDeleting}
          aria-label={`${label} narx sozlamasini o'chirish`}
          className="text-destructive hover:text-destructive"
        >
          <AppIcon name="trash-2" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Narx sozlamasini o&apos;chirasizmi?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground font-medium">{label}</span> butunlay
            o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Bekor qilish</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
