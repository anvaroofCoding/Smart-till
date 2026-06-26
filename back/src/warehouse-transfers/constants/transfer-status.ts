export const TRANSFER_STATUSES = ['draft', 'sent', 'completed'] as const;

export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  draft: 'Jarayonda',
  sent: 'Yuborilgan',
  completed: 'Qabul qilingan',
};
