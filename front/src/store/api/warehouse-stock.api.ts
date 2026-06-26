import type { ApiResponse } from '@/types/api.types'
import type {
  WarehouseStockDetailRecord,
  WarehouseStockListResponse,
} from '@/types/warehouse-stock.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface WarehouseStockQueryParams {
  page?: number
  perPage?: number
  id?: string
  warehouseId?: string
  productId?: string
  categoryId?: string
  brandId?: string
  productName?: string
  barcode?: string
  warehouseName?: string
  unitPrice?: number
  sellingPrice?: number
  quantity?: number
  totalValue?: number
}

export const warehouseStockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouseStock: builder.query<
      WarehouseStockListResponse,
      WarehouseStockQueryParams | void
    >({
      query: (params) => ({
        url: '/warehouse-stock',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<WarehouseStockListResponse>
          | WarehouseStockListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as WarehouseStockListResponse)
          : (response as ApiResponse<WarehouseStockListResponse>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.Inventory,
                id,
              })),
              { type: API_TAGS.Inventory, id: 'LIST' },
            ]
          : [{ type: API_TAGS.Inventory, id: 'LIST' }],
    }),

    getWarehouseStockDetail: builder.query<WarehouseStockDetailRecord, string>({
      query: (id) => ({
        url: `/warehouse-stock/${id}`,
        method: 'GET',
      }),
      transformResponse: (
        response: ApiResponse<WarehouseStockDetailRecord> | WarehouseStockDetailRecord,
      ) =>
        'data' in response && response.data && typeof response.data === 'object'
          ? response.data
          : (response as WarehouseStockDetailRecord),
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.Inventory, id },
      ],
    }),
  }),
})

export const {
  useGetWarehouseStockQuery,
  useGetWarehouseStockDetailQuery,
} = warehouseStockApi
