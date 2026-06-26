export const API_TAGS = {
  Auth: 'Auth',
  User: 'User',
  ProductCategory: 'ProductCategory',
  ProductBrand: 'ProductBrand',
  Product: 'Product',
  Supplier: 'Supplier',
  Inventory: 'Inventory',
  Warehouse: 'Warehouse',
  StockReceipt: 'StockReceipt',
  PaymentType: 'PaymentType',
  PriceSetting: 'PriceSetting',
  Order: 'Order',
  Notification: 'Notification',
  Report: 'Report',
  DailyBalance: 'DailyBalance',
  ExpenseCategory: 'ExpenseCategory',
  SellerCart: 'SellerCart',
  WarehouseTransfer: 'WarehouseTransfer',
  Health: 'Health',
} as const

export type ApiTag = (typeof API_TAGS)[keyof typeof API_TAGS]

export const tagTypes = Object.values(API_TAGS)
