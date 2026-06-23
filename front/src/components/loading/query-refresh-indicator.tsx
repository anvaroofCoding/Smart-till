import { cn } from '@/lib/utils'

interface QueryRefreshIndicatorProps {
  visible: boolean
  className?: string
}

export function QueryRefreshIndicator({
  visible,
  className,
}: QueryRefreshIndicatorProps) {
  if (!visible) return null

  return (
    <p
      role="status"
      className={cn('text-muted-foreground shrink-0 text-xs', className)}
    >
      Yangilanmoqda...
    </p>
  )
}
