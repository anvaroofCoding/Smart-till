export interface ProductTableFilters {
  id: string
  code: string
  name: string
  description: string
  brandId: string
  categoryId: string
  status: 'all' | 'active' | 'inactive'
  createdAt: string
}

export const emptyProductTableFilters: ProductTableFilters = {
  id: '',
  code: '',
  name: '',
  description: '',
  brandId: '',
  categoryId: '',
  status: 'all',
  createdAt: '',
}

export function productFiltersToQueryParams(
  filters: ProductTableFilters,
): Record<string, string | boolean | number | undefined> {
  return {
    id: filters.id.trim() || undefined,
    code: filters.code.trim() || undefined,
    name: filters.name.trim() || undefined,
    description: filters.description.trim() || undefined,
    brandId: filters.brandId || undefined,
    categoryId: filters.categoryId || undefined,
    isActive:
      filters.status === 'all'
        ? undefined
        : filters.status === 'active',
    createdAt: filters.createdAt.trim() || undefined,
  }
}
