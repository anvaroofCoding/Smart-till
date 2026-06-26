import type {
  AcceptWarehouseTransferRequest,
  CreateWarehouseTransferDraftRequest,
  CreateWarehouseTransferRequest,
  SendWarehouseTransferDraftRequest,
  TransferDestinationWarehouse,
  UpdateAcceptanceProgressRequest,
  UpdateWarehouseTransferDraftRequest,
  WarehouseTransferRecord,
  WarehouseTransfersListResponse,
} from '@/types/warehouse-transfer.types'
import type { ApiResponse } from '@/types/api.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

function extractTransferRecord(
  response:
    | ApiResponse<WarehouseTransferRecord | null>
    | WarehouseTransferRecord
    | null
    | undefined,
): WarehouseTransferRecord | null {
  if (!response) return null
  if (typeof response === 'object' && 'data' in response) {
    return response.data ?? null
  }
  return response
}

export const warehouseTransfersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWarehouseTransfers: builder.query<
      WarehouseTransfersListResponse,
      {
        page?: number
        perPage?: number
        status?: string
        direction?: 'incoming' | 'outgoing'
        fromWarehouseId?: string
        toWarehouseId?: string
        name?: string
        code?: string
        transferDate?: string
        itemsCount?: number
      }
    >({
      query: (params) => ({
        url: '/warehouse-transfers',
        method: 'GET',
        params,
      }),
      transformResponse: (
        response:
          | ApiResponse<WarehouseTransfersListResponse>
          | WarehouseTransfersListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as WarehouseTransfersListResponse)
          : (response as ApiResponse<WarehouseTransfersListResponse>).data,
      providesTags: [{ type: API_TAGS.WarehouseTransfer, id: 'LIST' }],
    }),
    getCurrentWarehouseTransferDraft: builder.query<
      WarehouseTransferRecord | null,
      string
    >({
      async queryFn(fromWarehouseId, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: '/warehouse-transfers/drafts/current',
          method: 'GET',
          params: { fromWarehouseId },
        })

        if ('error' in result && result.error) {
          const status = result.error.status ?? result.error.statusCode
          if (status === 404) {
            return { data: null }
          }
          return { error: result.error }
        }

        return {
          data: extractTransferRecord(
            result.data as
              | ApiResponse<WarehouseTransferRecord | null>
              | WarehouseTransferRecord
              | null,
          ),
        }
      },
      providesTags: [{ type: API_TAGS.WarehouseTransfer, id: 'DRAFT' }],
    }),
    getTransferDestinationWarehouses: builder.query<
      TransferDestinationWarehouse[],
      string
    >({
      query: (fromWarehouseId) => ({
        url: '/warehouse-transfers/destinations',
        method: 'GET',
        params: { fromWarehouseId },
      }),
      transformResponse: (
        response: ApiResponse<TransferDestinationWarehouse[]>,
      ) => response.data,
    }),
    getWarehouseTransfer: builder.query<WarehouseTransferRecord, string>({
      query: (id) => ({
        url: `/warehouse-transfers/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<WarehouseTransferRecord>) =>
        response.data,
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.WarehouseTransfer, id },
      ],
    }),
    createWarehouseTransfer: builder.mutation<
      WarehouseTransferRecord,
      CreateWarehouseTransferRequest
    >({
      query: (body) => ({
        url: '/warehouse-transfers',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<WarehouseTransferRecord>) =>
        response.data,
      invalidatesTags: [
        { type: API_TAGS.WarehouseTransfer, id: 'LIST' },
        { type: API_TAGS.WarehouseTransfer, id: 'DRAFT' },
        { type: API_TAGS.Inventory, id: 'LIST' },
      ],
    }),
    createWarehouseTransferDraft: builder.mutation<
      WarehouseTransferRecord,
      CreateWarehouseTransferDraftRequest
    >({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: '/warehouse-transfers/drafts',
          method: 'POST',
          data: body,
        })

        if ('error' in result && result.error) {
          return { error: result.error }
        }

        const record = extractTransferRecord(
          result.data as
            | ApiResponse<WarehouseTransferRecord>
            | WarehouseTransferRecord
            | null,
        )

        if (!record?.id) {
          return {
            error: {
              status: 500,
              statusCode: 500,
              message: 'Transfer javobi noto\'g\'ri',
              error: 'InvalidResponse',
            },
          }
        }

        return { data: record }
      },
      invalidatesTags: [
        { type: API_TAGS.WarehouseTransfer, id: 'LIST' },
        { type: API_TAGS.WarehouseTransfer, id: 'DRAFT' },
      ],
    }),
    updateWarehouseTransferDraft: builder.mutation<
      WarehouseTransferRecord | null,
      { id: string; body: UpdateWarehouseTransferDraftRequest }
    >({
      query: ({ id, body }) => ({
        url: `/warehouse-transfers/${id}/draft`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (
        response: ApiResponse<WarehouseTransferRecord | null> | WarehouseTransferRecord | null,
      ) => {
        if (!response) return null
        if (typeof response === 'object' && 'data' in response) {
          return response.data ?? null
        }
        return response
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.WarehouseTransfer, id },
        { type: API_TAGS.WarehouseTransfer, id: 'LIST' },
        { type: API_TAGS.WarehouseTransfer, id: 'DRAFT' },
      ],
    }),
    sendWarehouseTransferDraft: builder.mutation<
      WarehouseTransferRecord,
      { id: string; body: SendWarehouseTransferDraftRequest }
    >({
      query: ({ id, body }) => ({
        url: `/warehouse-transfers/${id}/send`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<WarehouseTransferRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.WarehouseTransfer, id },
        { type: API_TAGS.WarehouseTransfer, id: 'LIST' },
        { type: API_TAGS.WarehouseTransfer, id: 'DRAFT' },
        { type: API_TAGS.Inventory, id: 'LIST' },
        { type: API_TAGS.Notification, id: 'LIST' },
      ],
    }),
    acceptWarehouseTransfer: builder.mutation<
      WarehouseTransferRecord,
      { id: string; body: AcceptWarehouseTransferRequest }
    >({
      query: ({ id, body }) => ({
        url: `/warehouse-transfers/${id}/accept`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<WarehouseTransferRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.WarehouseTransfer, id },
        { type: API_TAGS.WarehouseTransfer, id: 'LIST' },
        { type: API_TAGS.Inventory, id: 'LIST' },
        { type: API_TAGS.Notification, id: 'LIST' },
      ],
    }),
    updateAcceptanceProgress: builder.mutation<
      WarehouseTransferRecord,
      { id: string; body: UpdateAcceptanceProgressRequest }
    >({
      query: ({ id, body }) => ({
        url: `/warehouse-transfers/${id}/acceptance-progress`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<WarehouseTransferRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.WarehouseTransfer, id },
      ],
    }),
  }),
})

export const {
  useGetWarehouseTransfersQuery,
  useGetCurrentWarehouseTransferDraftQuery,
  useGetTransferDestinationWarehousesQuery,
  useGetWarehouseTransferQuery,
  useCreateWarehouseTransferMutation,
  useCreateWarehouseTransferDraftMutation,
  useUpdateWarehouseTransferDraftMutation,
  useSendWarehouseTransferDraftMutation,
  useAcceptWarehouseTransferMutation,
  useUpdateAcceptanceProgressMutation,
} = warehouseTransfersApi
