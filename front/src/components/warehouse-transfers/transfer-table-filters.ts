export interface TransferTableFilters {
  name: string
  code: string
  fromWarehouseId: string
  toWarehouseId: string
  transferDate: string
  itemsCount: string
  status: '' | 'draft' | 'sent' | 'completed'
}

export const emptyTransferTableFilters: TransferTableFilters = {
  name: '',
  code: '',
  fromWarehouseId: '',
  toWarehouseId: '',
  transferDate: '',
  itemsCount: '',
  status: '',
}

export function transferFiltersToQueryParams(
  filters: TransferTableFilters,
): Record<string, string | number | undefined> {
  const itemsCount = filters.itemsCount.trim()
  const parsedItemsCount =
    itemsCount && !Number.isNaN(Number(itemsCount))
      ? Number(itemsCount)
      : undefined

  return {
    name: filters.name.trim() || undefined,
    code: filters.code.trim() || undefined,
    fromWarehouseId: filters.fromWarehouseId || undefined,
    toWarehouseId: filters.toWarehouseId || undefined,
    transferDate: filters.transferDate.trim() || undefined,
    itemsCount: parsedItemsCount,
    status: filters.status || undefined,
  }
}