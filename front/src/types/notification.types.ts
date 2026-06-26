export const NOTIFICATION_TYPES = [
  'stock_receipt_accepted',
  'stock_receipt_partial',
  'warehouse_transfer_sent',
  'warehouse_transfer_accepted',
  'warehouse_transfer_partial',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface NotificationRecord {
  id: string
  type: NotificationType
  title: string
  message: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  readAt?: string
  createdAt: string
}

export interface NotificationUnreadCount {
  count: number
}
