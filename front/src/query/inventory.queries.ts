import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { inventoryPollingDefaults } from './query-client'
import { queryKeys } from './query-keys'
import { fetchHealthStatus, fetchInventorySummary } from './api/inventory.api'
import type { InventorySummary } from '@/types/api.types'

type InventorySummaryOptions = Omit<
  UseQueryOptions<InventorySummary, Error>,
  'queryKey' | 'queryFn'
>

/**
 * TanStack Query — polling va foniy yangilash uchun.
 * Ombor qoldig'ini har 5 soniyada (env orqali) avtomatik yangilaydi.
 */
export function useInventorySummaryPolling(
  warehouseId?: string,
  options?: InventorySummaryOptions,
) {
  return useQuery({
    queryKey: queryKeys.inventory.summary(warehouseId),
    queryFn: () => fetchInventorySummary(warehouseId),
    ...inventoryPollingDefaults,
    ...options,
  })
}

export function useHealthStatusQuery() {
  return useQuery({
    queryKey: queryKeys.health.status(),
    queryFn: fetchHealthStatus,
    staleTime: 60_000,
  })
}
