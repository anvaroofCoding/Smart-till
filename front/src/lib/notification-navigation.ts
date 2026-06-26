import type { NotificationRecord } from '@/types/notification.types'

function readMetadataId(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function resolveNotificationRoute(
  notification: Pick<
    NotificationRecord,
    'type' | 'entityType' | 'entityId' | 'metadata'
  >,
): string | null {
  const transferId =
    notification.entityType === 'warehouse_transfer'
      ? notification.entityId ?? readMetadataId(notification.metadata, 'transferId')
      : readMetadataId(notification.metadata, 'transferId')

  const receiptId =
    notification.entityType === 'stock_receipt'
      ? notification.entityId ?? readMetadataId(notification.metadata, 'receiptId')
      : readMetadataId(notification.metadata, 'receiptId')

  switch (notification.type) {
    case 'stock_receipt_accepted':
    case 'stock_receipt_partial':
      return receiptId ? `/omborlar/maxsulot-kirim/${receiptId}` : null
    case 'warehouse_transfer_sent':
      return transferId ? `/transfer/qabul-qilish/${transferId}` : null
    case 'warehouse_transfer_accepted':
    case 'warehouse_transfer_partial':
      return transferId ? `/transfer/transferlar/${transferId}` : null
    default:
      if (receiptId) return `/omborlar/maxsulot-kirim/${receiptId}`
      if (transferId) return `/transfer/transferlar/${transferId}`
      return null
  }
}
