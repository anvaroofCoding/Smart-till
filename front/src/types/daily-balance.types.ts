export type PaymentChannel = 'cash' | 'terminal' | 'card' | 'other'

export type DailyBalanceStatus = 'open' | 'closed'

export type DailyBalanceEntryType =
  | 'sale'
  | 'manual_income'
  | 'expense'
  | 'cash_to_main'

export interface DailyBalanceTotals {
  salesCash: number
  salesTerminal: number
  salesCard: number
  salesTotal: number
  manualIncomeCash: number
  manualIncomeTerminal: number
  manualIncomeCard: number
  manualIncomeTotal: number
  incomeTotal: number
  expenseTotal: number
  netTotal: number
}

export interface DailyBalanceRecord {
  id: string
  dateKey: string
  warehouseId: string
  warehouseName: string
  status: DailyBalanceStatus
  totals: DailyBalanceTotals
  transferredToMain: number
  closedAt?: string
  createdAt: string
  updatedAt: string
}

export interface DailyBalanceEntryRecord {
  id: string
  type: DailyBalanceEntryType
  channel?: PaymentChannel
  amount: number
  note: string
  expenseCategoryId?: string
  expenseCategoryName: string
  orderId?: string
  orderLabel: string
  createdAt: string
}

export interface DailyBalanceEntryListItem extends DailyBalanceEntryRecord {
  dailyBalanceId: string
  dateKey: string
  warehouseId: string
  warehouseName: string
}

export interface DailyBalanceDetailRecord extends DailyBalanceRecord {
  incomes: DailyBalanceEntryRecord[]
  expenses: DailyBalanceEntryRecord[]
  mainDeposits: DailyBalanceEntryRecord[]
  todayCashTotal: number
  availableCashForDeposit: number
}

export interface MainBalanceRecord {
  total: number
}

export interface MainBalanceTransferRecord {
  id: string
  dailyBalanceId: string
  warehouseId: string
  warehouseName: string
  dateKey: string
  amount: number
  mainBalanceBefore: number
  mainBalanceAfter: number
  createdAt: string
}

export interface ExpenseCategoryRecord {
  id: string
  name: string
  parentId?: string
  isActive: boolean
  usageCount: number
}

export interface ExpenseCategoryGroup {
  id: string
  name: string
  childrenCount: number
  children: ExpenseCategoryRecord[]
}

export interface AddManualIncomeRequest {
  channel: PaymentChannel
  amount: number
  note?: string
}

export interface AddExpenseRequest {
  expenseCategoryId: string
  amount: number
  note?: string
}

export interface AddCashToMainRequest {
  amount: number
  note?: string
}
