import type { ApiResponse } from '@/types/api.types'
import type { CreateOrderRequest, OrderRecord } from '@/types/order.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
})

export const { useCreateOrderMutation, useGetOrderQuery } = ordersApi
