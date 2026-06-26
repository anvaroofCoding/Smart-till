export type DailyBalanceWarehouseFilter = 'all' | string

export interface DailyBalanceTableFilters {
  id: string
  dateKey: string
  warehouseId: DailyBalanceWarehouseFilter
  income: string
  expense: string
  transferredToMain: string
  savedAt: string
}

export const emptyDailyBalanceTableFilters: DailyBalanceTableFilters = {
  id: '',
  dateKey: '',
  warehouseId: 'all',
  income: '',
  expense: '',
  transferredToMain: '',
  savedAt: '',
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.replace(/\s/g, '').replace(',', '.').trim()
  if (!normalized) return undefined

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function dailyBalanceFiltersToQueryParams(
  filters: DailyBalanceTableFilters,
): Record<string, string | number | undefined> {
  return {
    id: filters.id.trim() || undefined,
    dateKey: filters.dateKey.trim() || undefined,
    warehouseId:
      filters.warehouseId === 'all' ? undefined : filters.warehouseId,
    income: parseOptionalNumber(filters.income),
    expense: parseOptionalNumber(filters.expense),
    transferredToMain: parseOptionalNumber(filters.transferredToMain),
    savedAt: filters.savedAt.trim() || undefined,
  }
}

export const DAILY_BALANCE_TABLE_HEADERS = [
  '#',
  'ID',
  'Kun',
  'Filial',
  'Kirim',
  'Chiqim',
  'Asosiy balansga',
  'Saqlangan vaqti',
] as const
