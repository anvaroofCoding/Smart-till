import { useEffect, useRef, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { SupplierLedgerEntryDialog } from '@/components/suppliers/supplier-ledger-entry-dialog'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useListPagination } from '@/hooks/use-list-pagination'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { getApiErrorMessage } from '@/lib/api-error'
import { notify } from '@/lib/notify'
import {
  useAddSupplierDebtMutation,
  useAddSupplierPaymentMutation,
  useGetSupplierLedgerQuery,
} from '@/store/api/suppliers.api'
import type { SupplierLedgerEntryType } from '@/types/supplier-ledger.types'

const TABLE_HEADERS = [
  'ID',
  "To'lov (UZS)",
  "To'lov (USD)",
  'Qarzdorlik (UZS)',
  'Qarzdorlik (USD)',
  'Saqlangan vaqti',
]

const EMPTY_SUMMARY = {
  totalPaymentUzs: 0,
  totalPaymentUsd: 0,
  totalDebtUzs: 0,
  totalDebtUsd: 0,
  netDebtUzs: 0,
  netDebtUsd: 0,
}

interface SupplierLedgerReportProps {
  supplierId: string
}

export function SupplierLedgerReport({ supplierId }: SupplierLedgerReportProps) {
  const [dialogType, setDialogType] = useState<SupplierLedgerEntryType | null>(
    null,
  )
  const [dialogError, setDialogError] = useState<string | null>(null)
  const { page, perPage, setPage, setPerPage } = useListPagination('')

  const ledgerQuery = useGetSupplierLedgerQuery({
    supplierId,
    page,
    perPage,
  })

  const [addDebt, addDebtState] = useAddSupplierDebtMutation()
  const [addPayment, addPaymentState] = useAddSupplierPaymentMutation()

  const { showSkeleton, showRefreshing } = useQueryLoading(ledgerQuery)

  const entries = ledgerQuery.data?.data ?? []
  const summary = ledgerQuery.data?.summary ?? EMPTY_SUMMARY
  const paginationMeta = ledgerQuery.data?.meta ?? {
    total: 0,
    page,
    perPage,
    totalPages: 1,
  }

  const isSaving = addDebtState.isLoading || addPaymentState.isLoading
  const ledgerErrorNotified = useRef(false)

  useEffect(() => {
    if (!ledgerQuery.error) {
      ledgerErrorNotified.current = false
      return
    }
    if (ledgerErrorNotified.current) return
    ledgerErrorNotified.current = true
    notify.error(
      getApiErrorMessage(ledgerQuery.error, 'Hisobotni yuklab bo\'lmadi'),
    )
  }, [ledgerQuery.error])

  async function handleSubmitEntry(values: {
    amountUzs?: number
    amountUsd?: number
  }) {
    if (!dialogType) return

    setDialogError(null)

    try {
      if (dialogType === 'debt') {
        await addDebt({ supplierId, body: values }).unwrap()
        notify.success('Qarzdorlik qo\'shildi')
      } else {
        await addPayment({ supplierId, body: values }).unwrap()
        notify.success('To\'lov qo\'shildi')
      }

      setDialogType(null)
      setPage(1)
    } catch (err) {
      setDialogError(
        getApiErrorMessage(
          err,
          dialogType === 'debt'
            ? 'Qarzdorlik qo\'shish amalga oshmadi'
            : 'To\'lov qo\'shish amalga oshmadi',
        ),
      )
    }
  }

  return (
    <>
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="shrink-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <CardTitle>Hisobot</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogType('debt')}
              >
                <AppIcon name="plus" />
                Qarzdorlik qo&apos;shish
              </Button>
              <Button onClick={() => setDialogType('payment')}>
                <AppIcon name="plus" />
                To&apos;lov qo&apos;shish
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16" />
                  <TableHead className="text-right">{"To'lov (UZS)"}</TableHead>
                  <TableHead className="text-right">{"To'lov (USD)"}</TableHead>
                  <TableHead className="text-right">Qarzdorlik (UZS)</TableHead>
                  <TableHead className="text-right">Qarzdorlik (USD)</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/20 font-semibold hover:bg-muted/20">
                  <TableCell>Umumiy</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(summary.totalPaymentUzs)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(summary.totalPaymentUsd)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(summary.totalDebtUzs)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(summary.totalDebtUsd)}
                  </TableCell>
                  <TableCell />
                </TableRow>
                <TableRow className="bg-muted/20 font-semibold hover:bg-muted/20">
                  <TableCell>Qarzdorlik</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(summary.netDebtUzs)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(summary.netDebtUsd)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {showSkeleton ? (
              <DataTableSkeleton
                columns={6}
                rows={6}
                headers={TABLE_HEADERS}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {TABLE_HEADERS.map((header) => (
                      <TableHead
                        key={header}
                        className={
                          header === 'ID'
                            ? 'w-16'
                            : header === 'Saqlangan vaqti'
                              ? 'text-right'
                              : 'text-right'
                        }
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground h-24 text-center"
                      >
                        Yozuvlar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium tabular-nums">
                          {entry.entryNumber}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(entry.paymentUzs)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(entry.paymentUsd)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(entry.debtUzs)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(entry.debtUsd)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right text-sm">
                          {formatDateDisplay(entry.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {!showSkeleton && (
            <DataTablePagination
              meta={paginationMeta}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              disabled={showRefreshing}
            />
          )}

          <QueryRefreshIndicator visible={showRefreshing} />
        </CardContent>
      </Card>

      <SupplierLedgerEntryDialog
        open={dialogType !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogType(null)
            setDialogError(null)
          }
        }}
        type={dialogType ?? 'debt'}
        isSaving={isSaving}
        error={dialogError}
        onSubmit={handleSubmitEntry}
      />
    </>
  )
}
