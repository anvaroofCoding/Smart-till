import { useEffect, useRef, useState } from 'react'

import { AppIcon } from '@/components/icons/app-icon'
import { SupplierLedgerEntryDialog } from '@/components/suppliers/supplier-ledger-entry-dialog'
import {
  BORDERLESS_TABLE_CLASS,
  LIST_PAGE_TABLE_SECTION_CLASS,
} from '@/components/shared/table-filter-field'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import { Button } from '@/components/ui/button'
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
import { DEFAULT_PER_PAGE } from '@/lib/pagination'
import { notify } from '@/lib/notify'
import {
  useAddSupplierDebtMutation,
  useAddSupplierPaymentMutation,
  useGetSupplierLedgerQuery,
} from '@/store/api/suppliers.api'
import type { SupplierLedgerEntryType } from '@/types/supplier-ledger.types'

const SUMMARY_TABLE_HEADERS = [
  '',
  "To'lov (UZS)",
  "To'lov (USD)",
  'Qarzdorlik (UZS)',
  'Qarzdorlik (USD)',
] as const

const ENTRIES_TABLE_HEADERS = [
  '№',
  "To'lov (UZS)",
  "To'lov (USD)",
  'Qarzdorlik (UZS)',
  'Qarzdorlik (USD)',
  'Saqlangan vaqti',
] as const

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
      <div className={LIST_PAGE_TABLE_SECTION_CLASS}>
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Hisobot</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialogType('debt')}>
              <AppIcon name="plus" />
              Qarzdorlik qo&apos;shish
            </Button>
            <Button onClick={() => setDialogType('payment')}>
              <AppIcon name="plus" />
              To&apos;lov qo&apos;shish
            </Button>
          </div>
        </div>

        <div className="shrink-0 overflow-auto">
          <Table className={BORDERLESS_TABLE_CLASS}>
            <TableHeader>
              <TableRow>
                {SUMMARY_TABLE_HEADERS.map((header) => (
                  <TableHead
                    key={header || 'label'}
                    className={header ? 'text-right' : 'w-32'}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="font-semibold">
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
              </TableRow>
              <TableRow className="font-semibold">
                <TableCell>Qarzdorlik</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(summary.netDebtUzs)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(summary.netDebtUsd)}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {showSkeleton ? (
            <DataTableSkeleton
              columns={ENTRIES_TABLE_HEADERS.length}
              rows={6}
              headers={[...ENTRIES_TABLE_HEADERS]}
            />
          ) : (
            <Table className={BORDERLESS_TABLE_CLASS}>
              <TableHeader>
                <TableRow>
                  {ENTRIES_TABLE_HEADERS.map((header) => (
                    <TableHead
                      key={header}
                      className={
                        header === '№'
                          ? 'w-12 text-center'
                          : header === 'Saqlangan vaqti'
                            ? 'whitespace-nowrap'
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
                      colSpan={ENTRIES_TABLE_HEADERS.length}
                      className="text-muted-foreground h-24 text-center"
                    >
                      Yozuvlar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry, index) => {
                    const currentPage = ledgerQuery.data?.meta.page ?? 1
                    const currentPerPage =
                      ledgerQuery.data?.meta.perPage ?? DEFAULT_PER_PAGE
                    const rowNumber =
                      (currentPage - 1) * currentPerPage + index + 1

                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-muted-foreground text-center tabular-nums">
                          {rowNumber}
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
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDateDisplay(entry.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })
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
      </div>

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
