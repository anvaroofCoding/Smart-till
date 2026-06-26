import type { PaymentChannel } from '@/types/daily-balance.types'

export const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  cash: 'Naqd',
  terminal: 'Terminal',
  card: 'Karta',
  other: 'Boshqa',
}

export const DAILY_BALANCE_STATUS_LABELS = {
  open: 'Ochiq',
  closed: 'Yopilgan',
} as const

export const DAILY_BALANCE_ENTRY_TYPE_LABELS = {
  sale: 'Savdo',
  manual_income: 'Kirim',
  expense: 'Xarajat',
  cash_to_main: 'Asosiy balansga',
} as const

export function formatDateKeyDisplay(dateKey: string): string {
  const [year, month, day] = dateKey.split('-')
  if (!year || !month || !day) return dateKey
  return `${day}.${month}.${year}`
}
