import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { TransferNakladnoyButton } from '@/components/warehouse-transfers/transfer-nakladnoy-button'
import { TransferQrPanel } from '@/components/warehouse-transfers/transfer-qr-panel'
import { TransferQrScannerButton } from '@/components/warehouse-transfers/transfer-qr-scanner-dialog'
import { TransferRouteDisplay } from '@/components/warehouse-transfers/transfer-route-display'
import { TransferStatusBadge } from '@/components/warehouse-transfers/transfer-status-badge'
import { FormPageSkeleton } from '@/components/loading'
import { Button } from '@/components/ui/button'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
} from '@/components/shared/table-filter-field'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePageMeta } from '@/hooks/use-page-meta'
import { pageTitle } from '@/config/seo'
import { formatDateDisplay } from '@/lib/date-format'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import { useGetWarehouseTransferQuery } from '@/store/api/warehouse-transfers.api'

const LIST_PATH = '/transfer/transferlar'

const TABLE_HEADERS = ['№', 'Maxsulot', 'Miqdor', 'Qabul qilingan'] as const

function formatAmount(value: number) {
  return value.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })
}

export function WarehouseTransferViewPage() {
  const { id = '' } = useParams()
  const transferQuery = useGetWarehouseTransferQuery(id, { skip: !id })
  const transfer = transferQuery.data

  usePageMeta({
    title: pageTitle(transfer?.name || transfer?.code || 'Transfer', 'Transfer'),
  })

  useEffect(() => {
    if (!transferQuery.error) return
    notify.error(
      getApiErrorMessage(transferQuery.error, "Transferni yuklab bo'lmadi"),
    )
  }, [transferQuery.error])

  if (transferQuery.isLoading || transferQuery.isFetching) {
    return <FormPageSkeleton sections={2} fieldsPerSection={3} />
  }

  if (!transfer) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Transfer topilmadi</p>
        <Button variant="outline" asChild>
          <Link to={LIST_PATH}>Orqaga</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link to={LIST_PATH}>
              <AppIcon name="arrow-left" />
              Orqaga
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {transfer.name || transfer.code}
            </h1>
            <TransferStatusBadge status={transfer.status} />
          </div>
          {transfer.name && (
            <p className="text-muted-foreground text-sm">{transfer.code}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TransferQrScannerButton size="sm" />
          <TransferNakladnoyButton transfer={transfer} />
        </div>
      </div>

      <div className={`${LIST_PAGE_TABLE_SECTION_CLASS} lg:grid lg:grid-cols-[1fr_auto] lg:gap-4`}>
        <div className="min-w-0">
        <div className="shrink-0 space-y-3 px-1">
          <TransferRouteDisplay
            fromWarehouseName={transfer.fromWarehouseName}
            toWarehouseName={transfer.toWarehouseName}
          />
          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Sana:</span>{' '}
              <span className="text-foreground">
                {formatDateDisplay(transfer.transferDate) || '—'}
              </span>
            </div>
            {transfer.notes.trim() && (
              <div>
                <span className="text-muted-foreground">Izoh:</span>{' '}
                <span className="text-foreground">{transfer.notes.trim()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <Table className={BORDERLESS_TABLE_CLASS}>
            <TableHeader>
              <TableRow>
                {TABLE_HEADERS.map((header) => (
                  <TableHead
                    key={header}
                    className={
                      header === '№'
                        ? 'w-12 text-center'
                        : header === 'Miqdor' || header === 'Qabul qilingan'
                          ? 'text-right'
                          : undefined
                    }
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfer.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_HEADERS.length}
                    className="text-muted-foreground h-24 text-center"
                  >
                    Maxsulotlar yo&apos;q
                  </TableCell>
                </TableRow>
              ) : (
                transfer.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground text-center tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(item.quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.receivedQuantity != null
                        ? formatAmount(item.receivedQuantity)
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        </div>

        <div className="mt-4 flex justify-center lg:mt-0 lg:justify-start">
          <TransferQrPanel transfer={transfer} />
        </div>
      </div>
    </div>
  )
}
