export const RECEIPT_STATUSES = [
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  in_progress: 'Jarayonda',
  completed: 'Qabul qilindi',
  cancelled: 'Bekor qilindi',
};
