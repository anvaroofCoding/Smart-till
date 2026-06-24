export const STOCK_MOVEMENT_SOURCES = ['receipt_accept'] as const;

export type StockMovementSource = (typeof STOCK_MOVEMENT_SOURCES)[number];

export const STOCK_MOVEMENT_SOURCE_LABELS: Record<StockMovementSource, string> =
  {
    receipt_accept: 'Kirim qabul qilindi',
  };
