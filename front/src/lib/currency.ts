export const SUPPLIER_CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB', 'CNY'] as const

export type SupplierCurrency = (typeof SUPPLIER_CURRENCIES)[number]

export const DEFAULT_SUPPLIER_CURRENCY: SupplierCurrency = 'UZS'

export const SUPPLIER_CURRENCY_LABELS: Record<SupplierCurrency, string> = {
  UZS: "So'm (UZS)",
  USD: 'AQSh dollari (USD)',
  EUR: 'Yevro (EUR)',
  RUB: 'Rubl (RUB)',
  CNY: 'Yuan (CNY)',
}
