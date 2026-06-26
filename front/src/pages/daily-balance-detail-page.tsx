import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AddCashToMainDialog } from '@/components/daily-balances/add-cash-to-main-dialog'
import { AddExpenseDialog } from '@/components/daily-balances/add-expense-dialog'
import { AddIncomeDialog } from '@/components/daily-balances/add-income-dialog'
import { AppIcon } from '@/components/icons/app-icon'
import { FormPageSkeleton } from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
import {
  DAILY_BALANCE_ENTRY_TYPE_LABELS,
  DAILY_BALANCE_STATUS_LABELS,
  formatDateKeyDisplay,
  PAYMENT_CHANNEL_LABELS,
} from '@/lib/daily-balance-display'
import { formatDateDisplay } from '@/lib/date-format'
import { formatMoney } from '@/lib/format-money'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  useAddDailyBalanceExpenseMutation,
  useAddDailyBalanceIncomeMutation,
  useDepositCashToMainMutation,
  useGetDailyBalanceQuery,
  useGetMainBalanceQuery,
} from '@/store/api/daily-balances.api'
import { useGetExpenseCategoryGroupsQuery } from '@/store/api/expense-categories.api'

const LIST_PATH = '/kassir/kunlik-balanslar'

function DetailField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground text-xs font-medium">{label}</Label>
      <div className="text-sm">{value}</div>
    </div>
  )
}

export function DailyBalanceDetailPage() {
  const { id = '' } = useParams()
  const [activeTab, setActiveTab] = useState<'incomes' | 'expenses'>('incomes')
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)

  const balanceQuery = useGetDailyBalanceQuery(id, { skip: !id })
  const categoriesQuery = useGetExpenseCategoryGroupsQuery()
  const mainBalanceQuery = useGetMainBalanceQuery()
  const [addIncome, addIncomeState] = useAddDailyBalanceIncomeMutation()
  const [addExpense, addExpenseState] = useAddDailyBalanceExpenseMutation()
  const [depositCash, depositCashState] = useDepositCashToMainMutation()

  const { data: balance, error } = balanceQuery
  const { showSkeleton } = useQueryLoading(balanceQuery)

  usePageMeta({
    title: pageTitle(
      balance
        ? `${balance.id.slice(-4)} | ${formatDateKeyDisplay(balance.dateKey)} | ${balance.warehouseName}`
        : 'Kunlik balans',
      'Kassir',
    ),
  })

  useEffect(() => {
    if (!error) return
    notify.error(getApiErrorMessage(error, 'Kunlik balans topilmadi'))
  }, [error])

  if (showSkeleton) {
    return <FormPageSkeleton sections={2} fieldsPerSection={4} />
  }

  if (error || !balance) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">
          {getApiErrorMessage(error, 'Kunlik balans topilmadi')}
        </p>
        <Button variant="outline" asChild>
          <Link to={LIST_PATH}>Ro&apos;yxatga qaytish</Link>
        </Button>
      </div>
    )
  }

  const isOpen = balance.status === 'open'
  const mainBalance = mainBalanceQuery.data?.total ?? 0
  const todayCashTotal =
    balance.todayCashTotal ??
    balance.totals.salesCash + balance.totals.manualIncomeCash
  const availableCashForDeposit =
    balance.availableCashForDeposit ??
    Math.max(0, todayCashTotal - balance.transferredToMain)
  const expenseTabEntries = [...balance.expenses, ...(balance.mainDeposits ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  async function handleAddIncome(values: {
    channel: 'cash' | 'terminal' | 'card'
    amount: number
    note?: string
  }) {
    try {
      await addIncome({ id: balance.id, body: values }).unwrap()
      notify.success("Kirim qo'shildi")
      setIncomeOpen(false)
    } catch (err) {
      notify.error(getApiErrorMessage(err, "Kirim qo'shilmadi"))
    }
  }

  async function handleAddExpense(values: {
    expenseCategoryId: string
    amount: number
    note?: string
  }) {
    try {
      await addExpense({ id: balance.id, body: values }).unwrap()
      notify.success("Xarajat qo'shildi")
      setExpenseOpen(false)
    } catch (err) {
      notify.error(getApiErrorMessage(err, "Xarajat qo'shilmadi"))
    }
  }

  async function handleDepositCash(values: { amount: number; note?: string }) {
    try {
      await depositCash({ id: balance.id, body: values }).unwrap()
      notify.success("Asosiy balansga pul qo'shildi")
      setDepositOpen(false)
    } catch (err) {
      notify.error(
        getApiErrorMessage(err, "Asosiy balansga pul qo'shib bo'lmadi"),
      )
    }
  }

  const activeEntries =
    activeTab === 'incomes' ? balance.incomes : expenseTabEntries

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to={LIST_PATH}>
              <AppIcon name="arrow-left" className="mr-1" />
              Orqaga
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            {balance.id.slice(-4).toUpperCase()} | {formatDateKeyDisplay(balance.dateKey)} |{' '}
            {balance.warehouseName}
          </h1>
          <Badge
            variant="outline"
            className={cn(
              balance.status === 'open' && 'border-emerald-500/40 text-emerald-600',
              balance.status === 'closed' && 'border-slate-500/40 text-slate-600',
            )}
          >
            {DAILY_BALANCE_STATUS_LABELS[balance.status]}
          </Badge>
        </div>

        {isOpen && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-orange-500/50 text-orange-600 hover:bg-orange-50"
              onClick={() => setExpenseOpen(true)}
            >
              Xarajat qo&apos;shish
            </Button>
            <Button variant="outline" onClick={() => setDepositOpen(true)}>
              Asosiy balansga pul qo&apos;shish
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setIncomeOpen(true)}
            >
              Kirim qo&apos;shish
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-4">
            <DetailField label="Kun" value={formatDateKeyDisplay(balance.dateKey)} />
            <DetailField label="Filial" value={balance.warehouseName} />
            <DetailField
              label="Saqlangan vaqti"
              value={formatDateDisplay(balance.updatedAt)}
            />
          </div>
          <div className="space-y-4">
            <DetailField label="Asosiy balans" value={formatMoney(mainBalance)} />
            <DetailField label="Kirim" value={formatMoney(balance.totals.incomeTotal)} />
            <DetailField label="Chiqim" value={formatMoney(balance.totals.expenseTotal)} />
          </div>
          <div className="space-y-4">
            <DetailField
              label="Bugungi naqd pul"
              value={formatMoney(todayCashTotal)}
            />
            <DetailField
              label="Asosiy balansga o'tkazilgan"
              value={formatMoney(balance.transferredToMain)}
            />
            <DetailField
              label="O'tkazish uchun mavjud naqd"
              value={formatMoney(availableCashForDeposit)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <DetailField
            label="Naqd (savdo + kirim)"
            value={formatMoney(
              balance.totals.salesCash + balance.totals.manualIncomeCash,
            )}
          />
          <DetailField
            label="Terminal"
            value={formatMoney(
              balance.totals.salesTerminal + balance.totals.manualIncomeTerminal,
            )}
          />
          <DetailField
            label="Karta"
            value={formatMoney(
              balance.totals.salesCard + balance.totals.manualIncomeCard,
            )}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex gap-2 border-b">
          <button
            type="button"
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'incomes'
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
            onClick={() => setActiveTab('incomes')}
          >
            Kirimlar
          </button>
          <button
            type="button"
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'expenses'
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
            onClick={() => setActiveTab('expenses')}
          >
            Xarajatlar
          </button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Turi</TableHead>
              <TableHead>Tafsilot</TableHead>
              <TableHead>Izoh</TableHead>
              <TableHead className="text-right">Summa</TableHead>
              <TableHead>Vaqt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-20 text-center">
                  {activeTab === 'incomes'
                    ? 'Kirimlar mavjud emas'
                    : 'Xarajatlar mavjud emas'}
                </TableCell>
              </TableRow>
            ) : (
              activeEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {DAILY_BALANCE_ENTRY_TYPE_LABELS[entry.type]}
                    {entry.channel
                      ? ` · ${PAYMENT_CHANNEL_LABELS[entry.channel]}`
                      : ''}
                  </TableCell>
                  <TableCell>
                    {entry.expenseCategoryName || entry.orderLabel || entry.note || '—'}
                  </TableCell>
                  <TableCell>{entry.note || '—'}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium tabular-nums',
                      entry.type === 'cash_to_main' &&
                        'text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {formatMoney(entry.amount)}
                  </TableCell>
                  <TableCell>{formatDateDisplay(entry.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddIncomeDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        isSaving={addIncomeState.isLoading}
        onSubmit={handleAddIncome}
      />

      <AddExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        categoryGroups={categoriesQuery.data ?? []}
        mainBalance={mainBalance}
        isSaving={addExpenseState.isLoading}
        onSubmit={handleAddExpense}
      />

      <AddCashToMainDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        availableCash={availableCashForDeposit}
        mainBalance={mainBalance}
        isSaving={depositCashState.isLoading}
        onSubmit={handleDepositCash}
      />
    </div>
  )
}
