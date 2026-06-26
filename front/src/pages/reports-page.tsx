import { useEffect, useMemo } from 'react'

import { SalesPlanProgress } from '@/components/reports/sales-plan-progress'
import { BORDERLESS_TABLE_CLASS } from '@/components/shared/table-filter-field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DataTableSkeleton,
  QueryRefreshIndicator,
} from '@/components/loading'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useQueryLoading } from '@/hooks/use-query-loading'
import { pageTitle } from '@/config/seo'
import { getApiErrorMessage } from '@/lib/api-error'
import { formatMoney } from '@/lib/format-money'
import { notify } from '@/lib/notify'
import { useGetSalesReportQuery } from '@/store/api/reports.api'

function formatSalesValue(value: number): string {
  if (!value) {
    return '—'
  }
  return formatMoney(value)
}

function SummaryMetric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
        {formatSalesValue(value)}
      </span>
    </div>
  )
}

export function ReportsPage() {
  const reportQuery = useGetSalesReportQuery(undefined, {
    pollingInterval: 15_000,
  })
  const { showSkeleton, showRefreshing } = useQueryLoading(reportQuery)

  usePageMeta({
    title: pageTitle('Hisobotlar', 'Kassir'),
  })

  useEffect(() => {
    if (!reportQuery.error) return
    notify.error(
      getApiErrorMessage(reportQuery.error, "Hisobotni yuklab bo'lmadi"),
    )
  }, [reportQuery.error])

  const summary = reportQuery.data?.summary ?? []
  const monthly = reportQuery.data?.monthly ?? []

  const monthSalesByWarehouse = useMemo(() => {
    const map = new Map<string, number>()
    const currentMonth = monthly[0]
    for (const warehouse of currentMonth?.warehouses ?? []) {
      map.set(warehouse.warehouseId, warehouse.sales)
    }
    return map
  }, [monthly])

  function resolveMonthSales(warehouseId: string, summaryMonthSales: number) {
    if (summaryMonthSales > 0) {
      return summaryMonthSales
    }
    return monthSalesByWarehouse.get(warehouseId) ?? 0
  }

  function resolvePlanPercent(monthSales: number, plan: number): number {
    if (!plan || plan <= 0) return 0
    return Math.round((monthSales / plan) * 10000) / 100
  }

  if (showSkeleton) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col gap-8">
        <h1 className="text-2xl font-semibold tracking-tight">Hisobotlar</h1>
        <DataTableSkeleton columns={2} rows={4} />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-8 overflow-auto">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Hisobotlar</h1>
        <QueryRefreshIndicator visible={showRefreshing} />
      </div>

      <section className="space-y-4">
        <h2 className="text-primary text-center text-lg font-semibold">
          Buyurtmalar
        </h2>

        {summary.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">
            Savdo ma&apos;lumotlari topilmadi
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {summary.map((warehouse) => {
              const monthSales = resolveMonthSales(
                warehouse.warehouseId,
                warehouse.monthSales,
              )
              const planPercent = resolvePlanPercent(
                monthSales,
                warehouse.dailySalesPlan,
              )

              return (
              <Card
                key={warehouse.warehouseId}
                className="w-full min-w-[220px] max-w-[280px] shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-base">
                    {warehouse.warehouseName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SummaryMetric
                    label="Bugungi savdo:"
                    value={warehouse.todaySales}
                  />
                  <SummaryMetric
                    label="Kechagi savdo:"
                    value={warehouse.yesterdaySales}
                  />
                  <SummaryMetric
                    label="Oylik savdo:"
                    value={monthSales}
                  />
                  {(warehouse.dailySalesPlan ?? 0) > 0 && (
                    <div className="border-t pt-3">
                      <SalesPlanProgress percent={planPercent} />
                    </div>
                  )}
                </CardContent>
              </Card>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-4 pb-4">
        <h2 className="text-primary text-center text-lg font-semibold">
          Buyurtmalar bo&apos;yicha har oylik hisobot
        </h2>

        {monthly.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">
            Oylik hisobotlar topilmadi
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {monthly.map((month) => (
              <Card
                key={month.monthKey}
                className="w-full max-w-md shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary text-center text-base">
                    {month.monthLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table className={BORDERLESS_TABLE_CLASS}>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Filial nomi</TableHead>
                        <TableHead className="text-right">
                          Oylik qilingan savdo
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {month.warehouses.map((warehouse) => (
                        <TableRow key={warehouse.warehouseId}>
                          <TableCell>{warehouse.warehouseName}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                            {formatSalesValue(warehouse.sales)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold hover:bg-transparent">
                        <TableCell>Jami:</TableCell>
                        <TableCell className="text-right text-emerald-600 tabular-nums dark:text-emerald-400">
                          {formatSalesValue(month.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
