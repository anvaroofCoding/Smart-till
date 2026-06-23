export const queryKeys = {
  all: ['warehouse'] as const,

  inventory: {
    all: () => [...queryKeys.all, 'inventory'] as const,
    summary: (warehouseId?: string) =>
      [...queryKeys.inventory.all(), 'summary', warehouseId ?? 'default'] as const,
    item: (itemId: string) =>
      [...queryKeys.inventory.all(), 'item', itemId] as const,
  },

  orders: {
    all: () => [...queryKeys.all, 'orders'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.orders.all(), 'list', filters ?? {}] as const,
    detail: (orderId: string) =>
      [...queryKeys.orders.all(), 'detail', orderId] as const,
  },

  health: {
    status: () => [...queryKeys.all, 'health', 'status'] as const,
  },
} as const
