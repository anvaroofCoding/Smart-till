import { useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PaymentTypeLogoThumbProps {
  logo?: string
  name: string
  size?: 'sm' | 'lg'
  className?: string
  previewable?: boolean
}

const sizeClasses = {
  sm: 'size-10',
  lg: 'size-20',
} as const

const iconSizeClasses = {
  sm: 'size-4',
  lg: 'size-8',
} as const

export function PaymentTypeLogoThumb({
  logo,
  name,
  size = 'sm',
  className,
  previewable = true,
}: PaymentTypeLogoThumbProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  if (!logo) {
    return (
      <div
        className={cn(
          'bg-muted flex shrink-0 items-center justify-center rounded-md border',
          sizeClasses[size],
          className,
        )}
        aria-hidden={!name}
      >
        <AppIcon
          name="hand-coins"
          className={cn('text-muted-foreground', iconSizeClasses[size])}
        />
      </div>
    )
  }

  const imageElement = (
    <img
      src={logo}
      alt={name}
      className={cn(
        'size-full rounded-md object-cover',
        previewable && 'transition-opacity hover:opacity-90',
      )}
    />
  )

  if (!previewable) {
    return (
      <div
        className={cn(
          'shrink-0 overflow-hidden rounded-md border',
          sizeClasses[size],
          className,
        )}
      >
        {imageElement}
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className={cn(
          'shrink-0 cursor-zoom-in overflow-hidden rounded-md border',
          sizeClasses[size],
          className,
        )}
        aria-label={`${name} logosini kattaroq ko'rish`}
      >
        {imageElement}
      </button>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="max-w-4xl gap-4 p-4 sm:p-6"
          showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>To&apos;lov turi logosi</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[80vh] items-center justify-center overflow-hidden rounded-lg bg-muted/40">
            <img
              src={logo}
              alt={name}
              className="max-h-[80vh] w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
