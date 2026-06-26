import type { ApiResponse } from '@/types/api.types'
import type { PaginatedResponse } from '@/types/api.types'
import type {
  CreateDraftOrderRequest,
  CreateOrderRequest,
  FulfillOrderRequest,
  OrderReceiptRequest,
  OrderRecord,
  UpdateOrderRequest,
} from '@/types/order.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface OrdersQueryParams {
  page?: number
  perPage?: number
  id?: string
  customerName?: string
  customerPhone?: string
  subtotal?: number
  total?: number
  discountTotal?: number
  status?: string
  createdByName?: string
  createdAt?: string
  search?: string
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
      invalidatesTags: [
        { type: API_TAGS.Order, id: 'LIST' },
        { type: API_TAGS.Order, id: 'SALES_REPORT' },
      ],
    }),

    createOrder: builder.mutation<OrderRecord, CreateOrderRequest>({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      invalidatesTags: [
        { type: API_TAGS.Order, id: 'LIST' },
        { type: API_TAGS.Order, id: 'SALES_REPORT' },
      ],
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
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            ordersApi.util.updateQueryData('getOrder', id, () => data),
          )
        } catch {
          // Auto-save failures are surfaced by explicit user actions.
        }
      },
      invalidatesTags: [{ type: API_TAGS.Order, id: 'LIST' }],
    }),

    confirmOrder: builder.mutation<OrderRecord, { id: string; body: UpdateOrderRequest }>({
      query: ({ id, body }) => ({
        url: `/orders/${id}/confirm`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            ordersApi.util.updateQueryData('getOrder', id, () => data),
          )
        } catch {
          // Confirmation errors are surfaced in the page handler.
        }
      },
      invalidatesTags: [{ type: API_TAGS.Order, id: 'LIST' }],
    }),

    recordOrderReceipt: builder.mutation<
      OrderRecord,
      { id: string; body: OrderReceiptRequest }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/receipt`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            ordersApi.util.updateQueryData('getOrder', id, () => data),
          )
        } catch {
          // Receipt errors are surfaced in the page handler.
        }
      },
      invalidatesTags: [{ type: API_TAGS.Order, id: 'LIST' }],
    }),

    fulfillOrder: builder.mutation<OrderRecord, { id: string; body: FulfillOrderRequest }>({
      query: ({ id, body }) => ({
        url: `/orders/${id}/fulfill`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            ordersApi.util.updateQueryData('getOrder', id, () => data),
          )
        } catch {
          // Fulfillment errors are surfaced in the page handler.
        }
      },
      invalidatesTags: [
        { type: API_TAGS.Order, id: 'LIST' },
        { type: API_TAGS.Order, id: 'SALES_REPORT' },
      ],
    }),

    cancelOrder: builder.mutation<OrderRecord, string>({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            ordersApi.util.updateQueryData('getOrder', id, () => data),
          )
        } catch {
          // Cancellation errors are surfaced in the page handler.
        }
      },
      invalidatesTags: [{ type: API_TAGS.Order, id: 'LIST' }],
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
  useRecordOrderReceiptMutation,
  useFulfillOrderMutation,
  useCancelOrderMutation,
} = ordersApi
