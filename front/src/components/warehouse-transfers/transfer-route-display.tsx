import { AppIcon } from '@/components/icons/app-icon'
import { cn } from '@/lib/utils'

interface TransferRouteDisplayProps {
  fromWarehouseName: string
  toWarehouseName?: string | null
  className?: string
  compact?: boolean
  variant?: 'default' | 'on-dark'
}

export function TransferRouteDisplay({
  fromWarehouseName,
  toWarehouseName,
  className,
  compact = false,
  variant = 'default',
}: TransferRouteDisplayProps) {
  const destination = toWarehouseName?.trim() || '—'
  const onDark = variant === 'on-dark'

  return (
    <div
      className={cn(
        'inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5 sm:gap-3 sm:px-4',
        onDark
          ? 'border-white/15 bg-white/5'
          : 'border-border/60 bg-muted/30',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            onDark
              ? 'bg-sky-500/20 text-sky-200'
              : 'bg-primary/10 text-primary',
          )}
          aria-label="Yuboruvchi ombor"
          title="Yuboruvchi ombor"
        >
          <AppIcon name="warehouse" className="size-4" />
        </span>
        <span
          className={cn(
            'truncate font-medium',
            onDark ? 'text-white' : 'text-foreground',
            compact ? 'text-sm' : 'text-base',
          )}
        >
          {fromWarehouseName}
        </span>
      </div>

      <AppIcon
        name="arrow-left-right"
        className={cn(
          'size-4 shrink-0 sm:rotate-0',
          onDark ? 'text-slate-400' : 'text-muted-foreground',
        )}
        aria-hidden
      />

      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            onDark
              ? 'bg-emerald-500/20 text-emerald-200'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          )}
          aria-label="Qabul qiluvchi ombor"
          title="Qabul qiluvchi ombor"
        >
          <AppIcon name="store" className="size-4" />
        </span>
        <span
          className={cn(
            'truncate font-medium',
            onDark ? 'text-white' : 'text-foreground',
            compact ? 'text-sm' : 'text-base',
          )}
        >
          {destination}
        </span>
      </div>
    </div>
  )
}
