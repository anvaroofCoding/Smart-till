import { AppIcon } from '@/components/icons/app-icon'
import { Badge } from '@/components/ui/badge'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import type { StockMovementRecord } from '@/types/warehouse-stock.types'

const SOURCE_LABELS: Record<string, string> = {
  receipt_accept: 'Kirim qabul qilindi',
}

const PRICE_EPSILON = 0.009

interface StockMovementTimelineProps {
  movements: StockMovementRecord[]
  latestUnitPrice?: number
  className?: string
}

export function StockMovementTimeline({
  movements,
  latestUnitPrice,
  className,
}: StockMovementTimelineProps) {
  if (movements.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Hozircha harakatlar tarixi mavjud emas.
      </p>
    )
  }

  const currentPrice = latestUnitPrice ?? movements[0]?.unitPrice ?? 0

  return (
    <div className={cn('space-y-0', className)}>
      {movements.map((movement, index) => {
        const isLast = index === movements.length - 1
        const sourceLabel =
          SOURCE_LABELS[movement.sourceType] ?? movement.sourceType
        const isLatestPrice =
          Math.abs(movement.unitPrice - currentPrice) <= PRICE_EPSILON
        const isCurrentStep = index === 0

        return (
          <div key={movement.id} className="relative flex gap-4 pb-8">
            {!isLast && (
              <span
                aria-hidden
                className="bg-border absolute top-8 left-[15px] h-[calc(100%-8px)] w-px"
              />
            )}

            <div
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background',
                isCurrentStep && 'border-primary',
              )}
            >
              <AppIcon
                name="package"
                className={cn(
                  'size-4',
                  isCurrentStep ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">{sourceLabel}</span>
                <Badge variant="secondary">{movement.sourceName}</Badge>
                {isCurrentStep ? (
                  <Badge>Oxirgi kirim</Badge>
                ) : null}
                {!isLatestPrice ? (
                  <Badge variant="outline">Eski narx</Badge>
                ) : null}
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatDateDisplay(movement.createdAt)}
                </span>
              </div>

              <div className="bg-muted/40 grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Yetkazib beruvchi: </span>
                  <span>{movement.supplier.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ombor: </span>
                  <span>{movement.warehouse.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Miqdor: </span>
                  <span className="tabular-nums">+{movement.delta}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Qoldiq: </span>
                  <span className="tabular-nums">{movement.balanceAfter}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Birlik narxi: </span>
                  <span
                    className={cn(
                      'tabular-nums',
                      !isLatestPrice && 'text-muted-foreground line-through',
                    )}
                  >
                    {formatMoney(movement.unitPrice)}
                  </span>
                  {!isLatestPrice ? (
                    <span className="text-muted-foreground ml-2 text-xs">
                      (hozirgi: {formatMoney(currentPrice)})
                    </span>
                  ) : null}
                </div>
                <div>
                  <span className="text-muted-foreground">Kurs: </span>
                  <span className="tabular-nums">
                    {formatMoney(movement.exchangeRate)}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Jami summa: </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(movement.totalPrice)}
                  </span>
                </div>
                {movement.notes ? (
                  <div className="text-muted-foreground sm:col-span-2">
                    {movement.notes}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
