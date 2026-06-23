import { AppIcon } from '@/components/icons/app-icon'
import { cn } from '@/lib/utils'

interface ProductImageThumbProps {
  image?: string
  name: string
  size?: 'sm' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'size-10',
  lg: 'size-20',
} as const

const iconSizeClasses = {
  sm: 'size-4',
  lg: 'size-8',
} as const

export function ProductImageThumb({
  image,
  name,
  size = 'sm',
  className,
}: ProductImageThumbProps) {
  if (!image) {
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
          name="package"
          className={cn('text-muted-foreground', iconSizeClasses[size])}
        />
      </div>
    )
  }

  return (
    <img
      src={image}
      alt={name}
      className={cn(
        'shrink-0 rounded-md border object-cover',
        sizeClasses[size],
        className,
      )}
    />
  )
}
