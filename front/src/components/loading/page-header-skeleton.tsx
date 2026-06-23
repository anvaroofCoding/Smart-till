import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface PageHeaderSkeletonProps {
  showAction?: boolean
  className?: string
}

export function PageHeaderSkeleton({
  showAction = true,
  className,
}: PageHeaderSkeletonProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-start justify-between gap-4',
        className,
      )}
      aria-busy
      aria-label="Sarlavha yuklanmoqda"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {showAction && <Skeleton className="h-10 w-40" />}
    </div>
  )
}
