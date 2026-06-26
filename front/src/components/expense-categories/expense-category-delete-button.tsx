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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ExpenseCategoryDeleteButtonProps {
  label: string
  usageCount?: number
  hasChildren?: boolean
  isDeleting?: boolean
  onConfirm: () => void | Promise<void>
}

function getDisabledReason(
  usageCount: number,
  hasChildren: boolean,
): string | null {
  if (usageCount > 0) {
    return `Bu xarajat turi ${usageCount} marta ishlatilgan. O'chirib bo'lmaydi.`
  }

  if (hasChildren) {
    return 'Avval ichki xarajat turlarini o\'chiring.'
  }

  return null
}

export function ExpenseCategoryDeleteButton({
  label,
  usageCount = 0,
  hasChildren = false,
  isDeleting,
  onConfirm,
}: ExpenseCategoryDeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const disabledReason = getDisabledReason(usageCount, hasChildren)
  const isDisabled = Boolean(disabledReason) || isDeleting

  async function handleDelete() {
    await onConfirm()
    setOpen(false)
  }

  if (disabledReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled
                aria-label={`${label} o'chirish`}
                className="text-muted-foreground"
              >
                <AppIcon name="trash-2" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">{disabledReason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isDisabled}
          aria-label={`${label} o'chirish`}
          className="text-destructive hover:text-destructive"
        >
          <AppIcon name="trash-2" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xarajat turini o&apos;chirasizmi?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground font-medium">{label}</span> ro&apos;yxatdan
            olib tashlanadi.
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
            O&apos;chirish
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
