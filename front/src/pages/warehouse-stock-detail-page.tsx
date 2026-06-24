import { useEffect, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { StockMovementTimeline } from '@/components/warehouse-stock/stock-movement-timeline'
import { FormPageSkeleton } from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useGetWarehouseStockDetailQuery } from '@/store/api/warehouse-stock.api'

const LIST_PATH = '/omborlar/maxsulotlar-soni'

function DetailField({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-muted-foreground text-xs font-medium">{label}</Label>
      <div className="text-sm">{value || '—'}</div>
    </div>
  )
}

export function WarehouseStockDetailPage() {
  const { id = '' } = useParams()
  const detailQuery = useGetWarehouseStockDetailQuery(id, { skip: !id })
  const { data: stock, error: loadError } = detailQuery
  const { showSkeleton } = useQueryLoading(detailQuery)

  usePageMeta({
    title: pageTitle(stock?.product.name ?? 'Batafsil', 'Maxsulotlar soni'),
  })

  useEffect(() => {
    if (!loadError) return
    notify.error(getApiErrorMessage(loadError, 'Maxsulot topilmadi'))
  }, [loadError])

  if (showSkeleton) {
    return <FormPageSkeleton sections={2} fieldsPerSection={4} />
  }

  if (loadError || !stock) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(loadError, 'Maxsulot topilmadi')}
        </p>
        <Button variant="outline" asChild>
          <Link to={LIST_PATH}>Ro&apos;yxatga qaytish</Link>
        </Button>
      </div>
    )
  }

  const hasMixedUnitPrices = stock.hasMixedUnitPrices ?? false
  const previousUnitPrices = stock.previousUnitPrices ?? []

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-auto">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {stock.product.name}
              </h1>
              <Badge variant="outline">{stock.product.code}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {stock.warehouse.name} omboridagi maxsulot ma&apos;lumotlari va
              harakatlar tarixi.
            </p>
          </div>
        </div>
      </div>

      {hasMixedUnitPrices ? (
        <div className="bg-muted/40 flex gap-3 rounded-lg border border-amber-500/40 p-4">
          <AppIcon name="circle" className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="font-medium text-sm">Turli kirim narxlari mavjud</p>
            <p className="text-muted-foreground text-sm">
              Jadvalda ko&apos;rsatilgan narx oxirgi kirim bo&apos;yicha (
              {formatMoney(stock.unitPrice)}). Omborda eski narxlarda kelgan
              partiyalar ham bor:{' '}
              {previousUnitPrices.map((price) => formatMoney(price)).join(', ')}
              . Batafsil tarix pastda ko&apos;rsatilgan.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asosiy ma&apos;lumotlar</CardTitle>
            <CardDescription>
              Ombordagi joriy holat va narx ko&apos;rsatkichlari.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Maxsulot kategoriyasi" value={stock.product.category.name} />
            <DetailField label="Brend" value={stock.product.brand.name} />
            <DetailField label="Ombor" value={stock.warehouse.name} />
            <DetailField
              label="Ombordagi soni"
              value={<span className="tabular-nums font-medium">{stock.quantity}</span>}
            />
            <DetailField
              label="Oxirgi kirim narxi"
              value={<span className="tabular-nums">{formatMoney(stock.unitPrice)}</span>}
            />
            <DetailField
              label="Sotiladigan narx"
              value={
                <div>
                  <span className="tabular-nums font-medium">
                    {formatMoney(stock.sellingPrice)}
                  </span>
                  {stock.markupPercent !== undefined ? (
                    <span className="text-muted-foreground ml-2 text-xs">
                      (+{stock.markupPercent}%)
                    </span>
                  ) : null}
                </div>
              }
            />
            <DetailField
              label="Valyuta kursi"
              value={<span className="tabular-nums">{formatMoney(stock.exchangeRate)}</span>}
            />
            <DetailField
              label="Tovar qiymati"
              value={
                <span className="tabular-nums font-medium">
                  {formatMoney(stock.totalValue)}
                </span>
              }
              className="sm:col-span-2"
            />
            <DetailField
              label="Oxirgi yangilanish"
              value={formatDateDisplay(stock.updatedAt)}
              className="sm:col-span-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qisqa xulosa</CardTitle>
            <CardDescription>
              Oxirgi kirim bo&apos;yicha yetkazib beruvchi va manba ma&apos;lumoti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stock.movements[0] ? (
              <>
                <DetailField
                  label="Oxirgi manba"
                  value={stock.movements[0].sourceName}
                />
                <DetailField
                  label="Yetkazib beruvchi"
                  value={stock.movements[0].supplier.name}
                />
                <DetailField
                  label="Qachon"
                  value={formatDateDisplay(stock.movements[0].createdAt)}
                />
                <DetailField
                  label="Kelgan miqdor"
                  value={
                    <span className="tabular-nums">
                      +{stock.movements[0].delta}
                    </span>
                  }
                />
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Kirim tarixi hali mavjud emas.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="clipboard-list" />
            Tovar tarixi
          </CardTitle>
          <CardDescription>
            Qachon, qayerdan va kimdan kelgani bo&apos;yicha bosqichma-bosqich
            harakatlar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-6" />
          <StockMovementTimeline
            movements={stock.movements}
            latestUnitPrice={stock.unitPrice}
          />
        </CardContent>
      </Card>
    </div>
  )
}
