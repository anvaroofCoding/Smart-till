export const STOCK_MOVEMENT_SOURCES = [
  'receipt_accept',
  'order_fulfillment',
  'transfer_send',
  'transfer_accept',
  'transfer_return',
] as const;

export type StockMovementSource = (typeof STOCK_MOVEMENT_SOURCES)[number];

export const STOCK_MOVEMENT_SOURCE_LABELS: Record<StockMovementSource, string> =
  {
    receipt_accept: 'Kirim qabul qilindi',
    order_fulfillment: 'Buyurtma chiqimi',
    transfer_send: 'Transfer yuborildi',
    transfer_accept: 'Transfer qabul qilindi',
    transfer_return: 'Transfer qaytarildi',
  };
