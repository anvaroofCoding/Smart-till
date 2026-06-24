export interface PaymentTypeTableFilters {
  id: string
  name: string
  status: 'all' | 'active' | 'inactive'
  createdAt: string
}

export const emptyPaymentTypeTableFilters: PaymentTypeTableFilters = {
  id: '',
  name: '',
  status: 'all',
  createdAt: '',
}

export function paymentTypeFiltersToQueryParams(
  filters: PaymentTypeTableFilters,
): Record<string, string | boolean | number | undefined> {
  return {
    id: filters.id.trim() || undefined,
    name: filters.name.trim() || undefined,
    isActive:
      filters.status === 'all'
        ? undefined
        : filters.status === 'active',
    createdAt: filters.createdAt.trim() || undefined,
  }
}
