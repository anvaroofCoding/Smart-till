import { Link } from 'react-router-dom'

import { AppIcon } from '@/components/icons/app-icon'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
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
import { useListPagination } from '@/hooks/use-list-pagination'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { pageTitle } from '@/config/seo'
import { formatDateKeyDisplay } from '@/lib/daily-balance-display'
import { formatMoney } from '@/lib/format-money'
import { useGetDailyBalanceEntriesQuery } from '@/store/api/daily-balances.api'

const DETAIL_PATH = '/kassir/kunlik-balanslar'

export function DailyBalanceExpensesPage() {
  const { page, perPage, setPage, setPerPage } = useListPagination()
  const query = useGetDailyBalanceEntriesQuery({
    page,
    perPage,
    type: 'expense',
  })
  const { data, isFetching } = query
  const { showSkeleton } = useQueryLoading(query)

  usePageMeta({ title: pageTitle('Xarajatlar', 'Kassir') })

  const rows = data?.data ?? []
  const paginationMeta = data?.meta ?? {
    page,
    perPage,
    total: 0,
    totalPages: 1,
  }
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Xarajatlar</h1>
          <p className="text-muted-foreground text-sm">
            Do&apos;kon va boshqa xarajatlar harakati
            {rows.length > 0 && (
              <span className="text-foreground ml-2 font-medium">
                (sahifa bo&apos;yicha: {formatMoney(totalAmount)})
              </span>
            )}
          </p>
        </div>
        <QueryRefreshIndicator isFetching={isFetching} />
      </div>

      <section className={LIST_PAGE_TABLE_SECTION_CLASS}>
        {showSkeleton ? (
          <DataTableSkeleton columns={6} rows={8} />
        ) : (
          <Table className={BORDERLESS_TABLE_CLASS}>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Xarajat turi</TableHead>
                <TableHead>Izoh</TableHead>
                <TableHead className="text-right">Summa</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                    Xarajatlar mavjud emas
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDateKeyDisplay(row.dateKey)}</TableCell>
                    <TableCell>{row.warehouseName}</TableCell>
                    <TableCell>{row.expenseCategoryName || '—'}</TableCell>
                    <TableCell>{row.note || '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(row.amount)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`${DETAIL_PATH}/${row.dailyBalanceId}`}>
                          <AppIcon name="chevron-right" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </section>

      {!showSkeleton && (
        <DataTablePagination
          meta={paginationMeta}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          disabled={isFetching}
        />
      )}
    </div>
  )
}
