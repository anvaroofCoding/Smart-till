export const SOCKET_EVENTS = {
  INVENTORY_UPDATED: 'inventory:updated',
  INVENTORY_SCANNED: 'inventory:scanned',
  STOCK_LOW: 'stock:low',
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  WAREHOUSE_ALERT: 'warehouse:alert',
  NOTIFICATION_CREATED: 'notification:created',
} as const;

export const CLIENT_EVENTS = {
  INVENTORY_SUBSCRIBE: 'inventory:subscribe',
  INVENTORY_UNSUBSCRIBE: 'inventory:unsubscribe',
  USER_SUBSCRIBE: 'user:subscribe',
  SCANNER_REGISTER: 'scanner:register',
  SCANNER_SCAN: 'scanner:scan',
} as const;
