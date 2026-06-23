export interface BrandTableFilters {
  id: string
  name: string
  description: string
  status: 'all' | 'active' | 'inactive'
  createdAt: string
}

export const emptyBrandTableFilters: BrandTableFilters = {
  id: '',
  name: '',
  description: '',
  status: 'all',
  createdAt: '',
}

export function brandFiltersToQueryParams(
  filters: BrandTableFilters,
): Record<string, string | boolean | number | undefined> {
  return {
    id: filters.id.trim() || undefined,
    name: filters.name.trim() || undefined,
    description: filters.description.trim() || undefined,
    isActive:
      filters.status === 'all'
        ? undefined
        : filters.status === 'active',
    createdAt: filters.createdAt.trim() || undefined,
  }
}
