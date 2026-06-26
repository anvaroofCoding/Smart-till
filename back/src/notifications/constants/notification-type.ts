export const NOTIFICATION_TYPES = [
  'stock_receipt_accepted',
  'stock_receipt_partial',
  'warehouse_transfer_sent',
  'warehouse_transfer_accepted',
  'warehouse_transfer_partial',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
