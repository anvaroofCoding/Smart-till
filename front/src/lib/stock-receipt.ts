export const RECEIPT_PAYMENT_TYPES = [
  'cash',
  'card',
  'transfer',
  'debt',
] as const

export type ReceiptPaymentType = (typeof RECEIPT_PAYMENT_TYPES)[number]

export const RECEIPT_PAYMENT_TYPE_LABELS: Record<ReceiptPaymentType, string> = {
  cash: 'Naqd',
  card: 'Plastik karta',
  transfer: "Bank o'tkazmasi",
  debt: 'Qarzga',
}

export const RECEIPT_STATUSES = [
  'in_progress',
  'completed',
  'cancelled',
] as const

export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number]

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  in_progress: 'Jarayonda',
  completed: 'Qabul qilindi',
  cancelled: 'Bekor qilindi',
}
