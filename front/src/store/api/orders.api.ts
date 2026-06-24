import type { ApiResponse } from '@/types/api.types'
import type { PaginatedResponse } from '@/types/api.types'
import type {
  CreateDraftOrderRequest,
  CreateOrderRequest,
  OrderRecord,
  UpdateOrderRequest,
} from '@/types/order.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface OrdersQueryParams {
  page?: number
  perPage?: number
  search?: string
  status?: string
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<PaginatedResponse<OrderRecord>, OrdersQueryParams | void>({
      query: (params) => ({
        url: '/orders',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response: ApiResponse<PaginatedResponse<OrderRecord>> | PaginatedResponse<OrderRecord>,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as PaginatedResponse<OrderRecord>)
          : (response as ApiResponse<PaginatedResponse<OrderRecord>>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: API_TAGS.Order, id })),
              { type: API_TAGS.Order, id: 'LIST' },
            ]
          : [{ type: API_TAGS.Order, id: 'LIST' }],
    }),

    createDraftOrder: builder.mutation<OrderRecord, CreateDraftOrderRequest>({
      query: (body) => ({
        url: '/orders/draft',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      invalidatesTags: [{ type: API_TAGS.Order, id: 'LIST' }],
    }),

    createOrder: builder.mutation<OrderRecord, CreateOrderRequest>({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      invalidatesTags: [{ type: API_TAGS.Order, id: 'LIST' }],
    }),

    getOrder: builder.query<OrderRecord, string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      providesTags: (_result, _error, id) => [{ type: API_TAGS.Order, id }],
    }),

    updateOrder: builder.mutation<OrderRecord, { id: string; body: UpdateOrderRequest }>({
      query: ({ id, body }) => ({
        url: `/orders/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Order, id },
        { type: API_TAGS.Order, id: 'LIST' },
      ],
    }),

    confirmOrder: builder.mutation<OrderRecord, { id: string; body: UpdateOrderRequest }>({
      query: ({ id, body }) => ({
        url: `/orders/${id}/confirm`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Order, id },
        { type: API_TAGS.Order, id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetOrdersQuery,
  useCreateDraftOrderMutation,
  useCreateOrderMutation,
  useGetOrderQuery,
  useUpdateOrderMutation,
  useConfirmOrderMutation,
} = ordersApi
