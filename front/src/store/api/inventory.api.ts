import { baseApi } from './base-api'
import { API_TAGS } from './api-tags'
import type { ApiResponse, InventorySummary } from '@/types/api.types'

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInventorySummary: builder.query<InventorySummary, { warehouseId?: string }>({
      query: ({ warehouseId }) => ({
        url: warehouseId
          ? `/inventory/summary/${warehouseId}`
          : '/inventory/summary',
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<InventorySummary>) => response.data,
      providesTags: (_result, _error, { warehouseId }) => [
        { type: API_TAGS.Inventory, id: warehouseId ?? 'default' },
        { type: API_TAGS.Inventory, id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetInventorySummaryQuery,
  useLazyGetInventorySummaryQuery,
} = inventoryApi
