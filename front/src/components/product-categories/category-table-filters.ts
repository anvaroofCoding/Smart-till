export interface CategoryTableFilters {
  id: string
  name: string
  description: string
  status: 'all' | 'active' | 'inactive'
}

export const emptyCategoryTableFilters: CategoryTableFilters = {
  id: '',
  name: '',
  description: '',
  status: 'all',
}

export function categoryFiltersToQueryParams(
  filters: CategoryTableFilters,
): Record<string, string | boolean | number | undefined> {
  return {
    id: filters.id.trim() || undefined,
    name: filters.name.trim() || undefined,
    description: filters.description.trim() || undefined,
    isActive:
      filters.status === 'all'
        ? undefined
        : filters.status === 'active',
  }
}
