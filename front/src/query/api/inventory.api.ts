import { axiosClient } from '@/services/axios-client'
import type { ApiResponse, InventorySummary } from '@/types/api.types'

export async function fetchInventorySummary(
  warehouseId?: string,
): Promise<InventorySummary> {
  const url = warehouseId
    ? `/inventory/summary/${warehouseId}`
    : '/inventory/summary'

  const { data } = await axiosClient.get<ApiResponse<InventorySummary>>(url)
  return data.data
}

export async function fetchHealthStatus(): Promise<{ status: string }> {
  const { data } = await axiosClient.get<ApiResponse<{ status: string }>>('/health')
  return data.data
}
