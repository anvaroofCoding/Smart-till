export const API_TAGS = {
  Auth: 'Auth',
  User: 'User',
  ProductCategory: 'ProductCategory',
  ProductBrand: 'ProductBrand',
  Product: 'Product',
  Inventory: 'Inventory',
  Warehouse: 'Warehouse',
  Order: 'Order',
  Health: 'Health',
} as const

export type ApiTag = (typeof API_TAGS)[keyof typeof API_TAGS]

export const tagTypes = Object.values(API_TAGS)
