import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { SupplierLedgerReport } from '@/components/suppliers/supplier-ledger-report'
import { TruncatedDescriptionCell } from '@/components/shared/truncated-description-cell'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
} from '@/components/shared/table-filter-field'
import { DataTableSkeleton } from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { pageTitle } from '@/config/seo'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { SUPPLIER_CURRENCY_LABELS } from '@/lib/currency'
import { formatDateDisplay } from '@/lib/date-format'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useGetSupplierQuery } from '@/store/api/suppliers.api'
import type { SupplierRecord } from '@/types/supplier.types'

const SUPPLIERS_LIST_PATH = '/yetkazib-beruvchilar/ro-yxat'

const INFO_TABLE_HEADERS = [
  'ID',
  'Nomi',
  'Rasmiy nomi',
  'Telefon',
  'Valyuta',
  'Holat',
  'Manzil',
  'Izoh',
  'Saqlangan vaqti',
] as const

function SupplierStatusDisplay({ supplier }: { supplier: SupplierRecord }) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`supplier-detail-active-${supplier.id}`}
        checked={supplier.isActive}
        disabled
        aria-label={supplier.isActive ? 'Faol' : 'Nofaol'}
      />
      <Label
        htmlFor={`supplier-detail-active-${supplier.id}`}
        className={cn(
          'text-xs font-medium',
          supplier.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {supplier.isActive ? 'Faol' : 'Nofaol'}
      </Label>
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
    return (
      <div className="flex h-full min-h-0 w-full flex-col gap-4">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-24 animate-pulse rounded-md" />
          <div className="bg-muted h-8 w-64 animate-pulse rounded-md" />
        </div>
        <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
          <DataTableSkeleton
            columns={INFO_TABLE_HEADERS.length}
            rows={1}
            headers={[...INFO_TABLE_HEADERS]}
          />
        </div>
      </div>
    )
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
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={SUPPLIERS_LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {supplier.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {supplier.officialName || 'Yetkazib beruvchi ma&apos;lumotlari'}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to={`${SUPPLIERS_LIST_PATH}/${supplier.id}/tahrirlash`}>
            <AppIcon name="pencil" />
            Tahrirlash
          </Link>
        </Button>
      </div>

      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="shrink-0 overflow-auto">
          <Table className={BORDERLESS_TABLE_CLASS}>
            <TableHeader>
              <TableRow>
                {INFO_TABLE_HEADERS.map((header) => (
                  <TableHead
                    key={header}
                    className={
                      header === 'ID'
                        ? 'w-24'
                        : header === 'Saqlangan vaqti'
                          ? 'whitespace-nowrap'
                          : undefined
                    }
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className={cn(!supplier.isActive && 'opacity-60')}>
                <TableCell className="text-muted-foreground max-w-[88px] truncate font-mono text-xs">
                  {supplier.id.slice(-8)}
                </TableCell>
                <TableCell className="max-w-[200px] font-medium">
                  <span className="line-clamp-2">{supplier.name}</span>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[180px]">
                  <span className="line-clamp-2">
                    {supplier.officialName || '—'}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {supplier.phone || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {SUPPLIER_CURRENCY_LABELS[supplier.currency]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <SupplierStatusDisplay supplier={supplier} />
                </TableCell>
                <TableCell className="max-w-[160px] text-sm">
                  <TruncatedDescriptionCell
                    title={supplier.name}
                    description={supplier.address}
                    dialogSubtitle="Manzil"
                    lines={2}
                    className="max-w-[160px]"
                  />
                </TableCell>
                <TableCell className="max-w-[160px] text-sm">
                  <TruncatedDescriptionCell
                    title={supplier.name}
                    description={supplier.comment}
                    dialogSubtitle="Izoh"
                    lines={2}
                    className="max-w-[160px]"
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatDateDisplay(supplier.createdAt) || '—'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <SupplierLedgerReport supplierId={supplier.id} />
      </div>
    </div>
  )
}
