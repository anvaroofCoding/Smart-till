export const SOCKET_EVENTS = {
  INVENTORY_UPDATED: 'inventory:updated',
  INVENTORY_SCANNED: 'inventory:scanned',
  STOCK_LOW: 'stock:low',
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  WAREHOUSE_ALERT: 'warehouse:alert',
  NOTIFICATION_CREATED: 'notification:created',
} as const

export const CLIENT_EVENTS = {
  INVENTORY_SUBSCRIBE: 'inventory:subscribe',
  INVENTORY_UNSUBSCRIBE: 'inventory:unsubscribe',
  SCANNER_REGISTER: 'scanner:register',
  SCANNER_SCAN: 'scanner:scan',
} as const

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]
export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS]

export interface InventoryUpdatedPayload {
  itemId: string
  sku: string
  quantity: number
  location: string
  updatedAt: string
}

export interface InventoryScannedPayload {
  barcode: string
  timestamp: string
}

export interface StockLowPayload {
  itemId: string
  sku: string
  quantity: number
  threshold: number
}

export interface WarehouseAlertPayload {
  type: 'info' | 'warning' | 'error'
  message: string
  timestamp: string
}

import type { NotificationRecord } from '@/types/notification.types'

export interface NotificationCreatedPayload {
  timestamp: string
  userIds: string[]
  items?: Array<{
    userId: string
    notification: NotificationRecord
  }>
}

export interface ServerToClientEvents {
  [SOCKET_EVENTS.INVENTORY_UPDATED]: (payload: InventoryUpdatedPayload) => void
  [SOCKET_EVENTS.INVENTORY_SCANNED]: (payload: InventoryScannedPayload) => void
  [SOCKET_EVENTS.STOCK_LOW]: (payload: StockLowPayload) => void
  [SOCKET_EVENTS.ORDER_CREATED]: (payload: { orderId: string }) => void
  [SOCKET_EVENTS.ORDER_UPDATED]: (payload: { orderId: string; status: string }) => void
  [SOCKET_EVENTS.WAREHOUSE_ALERT]: (payload: WarehouseAlertPayload) => void
  [SOCKET_EVENTS.NOTIFICATION_CREATED]: (payload: NotificationCreatedPayload) => void
}

export interface ClientToServerEvents {
  [CLIENT_EVENTS.INVENTORY_SUBSCRIBE]: (payload: { warehouseId?: string }) => void
  [CLIENT_EVENTS.INVENTORY_UNSUBSCRIBE]: () => void
  [CLIENT_EVENTS.SCANNER_REGISTER]: (payload: { deviceId: string }) => void
  [CLIENT_EVENTS.SCANNER_SCAN]: (payload: { barcode: string; timestamp: string }) => void
}

export interface SocketAckResponse {
  subscribed?: boolean
  room?: string
  registered?: boolean
  deviceId?: string
  received?: boolean
}
