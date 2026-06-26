import type { ApiResponse } from '@/types/api.types'
import type {
  CreateWarehouseRequest,
  WarehouseRecord,
  WarehousesListResponse,
  UpdateWarehouseRequest,
} from '@/types/warehouse.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface WarehousesQueryParams {
  search?: string
  page?: number
  perPage?: number
}

export const warehousesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouses: builder.query<
      WarehousesListResponse,
      WarehousesQueryParams | void
    >({
      query: (params) => ({
        url: '/warehouses',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<WarehousesListResponse>
          | WarehousesListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as WarehousesListResponse)
          : (response as ApiResponse<WarehousesListResponse>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.Warehouse,
                id,
              })),
              { type: API_TAGS.Warehouse, id: 'LIST' },
            ]
          : [{ type: API_TAGS.Warehouse, id: 'LIST' }],
    }),

    getWarehouse: builder.query<WarehouseRecord, string>({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<WarehouseRecord>) =>
        response.data,
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.Warehouse, id },
      ],
    }),

    createWarehouse: builder.mutation<WarehouseRecord, CreateWarehouseRequest>({
      query: (body) => ({
        url: '/warehouses',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<WarehouseRecord>) =>
        response.data,
      invalidatesTags: [{ type: API_TAGS.Warehouse, id: 'LIST' }, { type: API_TAGS.Order, id: 'SALES_REPORT' }],
    }),

    updateWarehouse: builder.mutation<
      WarehouseRecord,
      { id: string; body: UpdateWarehouseRequest }
    >({
      query: ({ id, body }) => ({
        url: `/warehouses/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<WarehouseRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Warehouse, id },
        { type: API_TAGS.Warehouse, id: 'LIST' },
        { type: API_TAGS.Order, id: 'SALES_REPORT' },
      ],
    }),

    setWarehouseStatus: builder.mutation<
      WarehouseRecord,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/warehouses/${id}/status`,
        method: 'PATCH',
        data: { isActive },
      }),
      transformResponse: (response: ApiResponse<WarehouseRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Warehouse, id },
        { type: API_TAGS.Warehouse, id: 'LIST' },
      ],
    }),

    deleteWarehouse: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/warehouses/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (
        response: ApiResponse<{ message: string }> | { message: string },
      ) =>
        'data' in response && response.data
          ? response.data
          : (response as { message: string }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.Warehouse, id },
        { type: API_TAGS.Warehouse, id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetWarehousesQuery,
  useGetWarehouseQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useSetWarehouseStatusMutation,
  useDeleteWarehouseMutation,
} = warehousesApi
