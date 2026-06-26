import { cn } from '@/lib/utils'

interface SalesPlanProgressProps {
  percent: number
  className?: string
}

function formatPercent(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${safe.toLocaleString('uz-UZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

function getProgressColor(percent: number): string {
  if (percent >= 100) return 'bg-emerald-500'
  if (percent >= 75) return 'bg-sky-500'
  if (percent >= 50) return 'bg-amber-500'
  return 'bg-orange-500'
}

export function SalesPlanProgress({ percent, className }: SalesPlanProgressProps) {
  const safePercent = Number.isFinite(percent) ? Math.max(0, percent) : 0
  const barWidth = Math.min(safePercent, 100)

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2">
        <div className="bg-muted h-2.5 min-w-0 flex-1 overflow-hidden rounded-full">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              getProgressColor(safePercent),
            )}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span className="text-foreground shrink-0 text-sm font-semibold tabular-nums">
          {formatPercent(safePercent)}
        </span>
      </div>
    </div>
  )
}
