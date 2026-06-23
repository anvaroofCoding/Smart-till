import type { ApiResponse } from '@/types/api.types'
import type {
  AcceptStockReceiptRequest,
  AddStockReceiptItemRequest,
  CreateStockReceiptRequest,
  StockReceiptRecord,
  StockReceiptsListResponse,
  UpdateStockReceiptItemRequest,
  UpdateStockReceiptRequest,
} from '@/types/stock-receipt.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface StockReceiptsQueryParams {
  search?: string
  page?: number
  perPage?: number
  id?: string
  name?: string
  status?: 'in_progress' | 'completed' | 'cancelled'
  paymentType?: 'cash' | 'card' | 'transfer' | 'debt'
  supplierName?: string
  supplierId?: string
  warehouseName?: string
  warehouseId?: string
  createdAt?: string
  exchangeRate?: number
  totalAmount?: number
  submitted?: boolean
}

export const stockReceiptsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStockReceipts: builder.query<
      StockReceiptsListResponse,
      StockReceiptsQueryParams | void
    >({
      query: (params) => ({
        url: '/stock-receipts',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<StockReceiptsListResponse>
          | StockReceiptsListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as StockReceiptsListResponse)
          : (response as ApiResponse<StockReceiptsListResponse>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.StockReceipt,
                id,
              })),
              { type: API_TAGS.StockReceipt, id: 'LIST' },
            ]
          : [{ type: API_TAGS.StockReceipt, id: 'LIST' }],
    }),

    getStockReceipt: builder.query<StockReceiptRecord, string>({
      query: (id) => ({
        url: `/stock-receipts/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<StockReceiptRecord>) =>
        response.data,
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.StockReceipt, id },
      ],
    }),

    createStockReceipt: builder.mutation<
      StockReceiptRecord,
      CreateStockReceiptRequest
    >({
      query: (body) => ({
        url: '/stock-receipts',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<StockReceiptRecord>) =>
        response.data,
      invalidatesTags: [{ type: API_TAGS.StockReceipt, id: 'LIST' }],
    }),

    updateStockReceipt: builder.mutation<
      StockReceiptRecord,
      { id: string; body: UpdateStockReceiptRequest }
    >({
      query: ({ id, body }) => ({
        url: `/stock-receipts/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<StockReceiptRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.StockReceipt, id },
        { type: API_TAGS.StockReceipt, id: 'LIST' },
      ],
    }),

    addStockReceiptItem: builder.mutation<
      StockReceiptRecord,
      { id: string; body: AddStockReceiptItemRequest }
    >({
      query: ({ id, body }) => ({
        url: `/stock-receipts/${id}/items`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<StockReceiptRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.StockReceipt, id },
        { type: API_TAGS.StockReceipt, id: 'LIST' },
        { type: API_TAGS.Inventory, id: 'LIST' },
      ],
    }),

    updateStockReceiptItem: builder.mutation<
      StockReceiptRecord,
      { id: string; itemId: string; body: UpdateStockReceiptItemRequest }
    >({
      query: ({ id, itemId, body }) => ({
        url: `/stock-receipts/${id}/items/${itemId}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<StockReceiptRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.StockReceipt, id },
        { type: API_TAGS.StockReceipt, id: 'LIST' },
      ],
    }),

    removeStockReceiptItem: builder.mutation<
      StockReceiptRecord,
      { id: string; itemId: string }
    >({
      query: ({ id, itemId }) => ({
        url: `/stock-receipts/${id}/items/${itemId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<StockReceiptRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.StockReceipt, id },
        { type: API_TAGS.StockReceipt, id: 'LIST' },
      ],
    }),

    acceptStockReceipt: builder.mutation<
      StockReceiptRecord,
      { id: string; body: AcceptStockReceiptRequest }
    >({
      query: ({ id, body }) => ({
        url: `/stock-receipts/${id}/accept`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<StockReceiptRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.StockReceipt, id },
        { type: API_TAGS.StockReceipt, id: 'LIST' },
        { type: API_TAGS.Inventory, id: 'LIST' },
      ],
    }),

    cancelStockReceipt: builder.mutation<StockReceiptRecord, string>({
      query: (id) => ({
        url: `/stock-receipts/${id}/cancel`,
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<StockReceiptRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.StockReceipt, id },
        { type: API_TAGS.StockReceipt, id: 'LIST' },
      ],
    }),

    submitStockReceipt: builder.mutation<StockReceiptRecord, string>({
      query: (id) => ({
        url: `/stock-receipts/${id}/submit`,
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<StockReceiptRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.StockReceipt, id },
        { type: API_TAGS.StockReceipt, id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetStockReceiptsQuery,
  useGetStockReceiptQuery,
  useCreateStockReceiptMutation,
  useUpdateStockReceiptMutation,
  useAddStockReceiptItemMutation,
  useUpdateStockReceiptItemMutation,
  useRemoveStockReceiptItemMutation,
  useAcceptStockReceiptMutation,
  useCancelStockReceiptMutation,
  useSubmitStockReceiptMutation,
} = stockReceiptsApi
