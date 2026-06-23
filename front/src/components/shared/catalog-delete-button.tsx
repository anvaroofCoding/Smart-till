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

type CatalogEntityType = 'kategoriya' | 'brend'

interface CatalogDeleteButtonProps {
  name: string
  productsCount: number
  entityType: CatalogEntityType
  isDeleting?: boolean
  onConfirmDelete: () => void | Promise<void>
}

function getInUseTooltip(
  entityType: CatalogEntityType,
  productsCount: number,
) {
  const label = entityType === 'kategoriya' ? 'Kategoriya' : 'Brend'
  return `${label} ${productsCount} ta maxsulotda ishlatilgan. O'chirib bo'lmaydi.`
}

export function CatalogDeleteButton({
  name,
  productsCount,
  entityType,
  isDeleting,
  onConfirmDelete,
}: CatalogDeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const isInUse = productsCount > 0
  const entityLabel = entityType === 'kategoriya' ? 'kategoriyani' : 'brendni'
  const inUseTooltip = getInUseTooltip(entityType, productsCount)

  async function handleDelete() {
    try {
      await onConfirmDelete()
      setOpen(false)
    } catch {
      // Xatolik bo'lsa dialog ochiq qoladi, xabar parent komponentda ko'rsatiladi.
    }
  }

  if (isInUse) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex" title={inUseTooltip}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled
                title={inUseTooltip}
                aria-label={`${name} ${entityLabel} o'chirish`}
                className="text-muted-foreground"
              >
                <AppIcon name="trash-2" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">{inUseTooltip}</TooltipContent>
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
          disabled={isDeleting}
          aria-label={`${name} ${entityLabel} o'chirish`}
          className="text-destructive hover:text-destructive"
        >
          <AppIcon name="trash-2" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {entityType === 'kategoriya' ? 'Kategoriyani' : 'Brendni'} o&apos;chirasizmi?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground font-medium">{name}</span> butunlay
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
