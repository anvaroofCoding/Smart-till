import { useEffect, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
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
import { SUPPLIER_CURRENCY_LABELS } from '@/lib/currency'
import { formatDateDisplay } from '@/lib/date-format'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { SupplierLedgerReport } from '@/components/suppliers/supplier-ledger-report'
import { useGetSupplierQuery } from '@/store/api/suppliers.api'

const SUPPLIERS_LIST_PATH = '/yetkazib-beruvchilar/ro-yxat'

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

export function SupplierDetailPage() {
  const { id = '' } = useParams()
  const supplierQuery = useGetSupplierQuery(id, { skip: !id })
  const { data: supplier, error: loadError } = supplierQuery
  const { showSkeleton } = useQueryLoading(supplierQuery)

  usePageMeta({
    title: pageTitle(supplier?.name ?? 'Batafsil', 'Yetkazib beruvchilar'),
  })

  useEffect(() => {
    if (!loadError) return
    notify.error(getApiErrorMessage(loadError, 'Yetkazib beruvchi topilmadi'))
  }, [loadError])

  if (showSkeleton) {
    return <FormPageSkeleton sections={1} fieldsPerSection={4} />
  }

  if (loadError || !supplier) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(loadError, 'Yetkazib beruvchi topilmadi')}
        </p>
        <Button variant="outline" asChild>
          <Link to={SUPPLIERS_LIST_PATH}>Ro&apos;yxatga qaytish</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={SUPPLIERS_LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {supplier.name}
              </h1>
              <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                {supplier.isActive ? 'Faol' : 'Nofaol'}
              </Badge>
              <Badge variant="outline">
                {SUPPLIER_CURRENCY_LABELS[supplier.currency]}
              </Badge>
            </div>
            {supplier.officialName && (
              <p className="text-muted-foreground mt-1 text-sm">
                {supplier.officialName}
              </p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link to={`${SUPPLIERS_LIST_PATH}/${supplier.id}/tahrirlash`}>
            <AppIcon name="pencil" />
            Tahrirlash
          </Link>
        </Button>
      </div>

      <Card className="shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AppIcon name="truck" />
            Yetkazib beruvchi ma&apos;lumotlari
          </CardTitle>
          <CardDescription>
            Yaratilgan: {formatDateDisplay(supplier.createdAt)}
            {supplier.updatedAt !== supplier.createdAt && (
              <> · Yangilangan: {formatDateDisplay(supplier.updatedAt)}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Nomi" value={supplier.name} />
            <DetailField label="Rasmiy nomi" value={supplier.officialName} />
            <DetailField label="Telefon raqami" value={supplier.phone} />
            <DetailField
              label="Valyuta"
              value={SUPPLIER_CURRENCY_LABELS[supplier.currency]}
            />
          </div>

          <Separator />

          <DetailField label="Manzili" value={supplier.address} />

          {supplier.comment && (
            <>
              <Separator />
              <DetailField label="Izoh" value={supplier.comment} />
            </>
          )}
        </CardContent>
      </Card>

      <SupplierLedgerReport supplierId={supplier.id} />
    </div>
  )
}
