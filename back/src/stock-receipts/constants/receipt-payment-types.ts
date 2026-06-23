export const RECEIPT_PAYMENT_TYPES = [
  'cash',
  'card',
  'transfer',
  'debt',
] as const;

export type ReceiptPaymentType = (typeof RECEIPT_PAYMENT_TYPES)[number];

export const RECEIPT_PAYMENT_TYPE_LABELS: Record<ReceiptPaymentType, string> = {
  cash: 'Naqd',
  card: 'Plastik karta',
  transfer: "Bank o'tkazmasi",
  debt: 'Qarzga',
};
