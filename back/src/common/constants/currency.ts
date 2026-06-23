export const SUPPLIER_CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB', 'CNY'] as const

export type SupplierCurrency = (typeof SUPPLIER_CURRENCIES)[number]

export const DEFAULT_SUPPLIER_CURRENCY: SupplierCurrency = 'UZS'
