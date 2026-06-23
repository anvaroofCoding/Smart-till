import type { ApiResponse } from '@/types/api.types'
import type {
  CreateSupplierLedgerEntryRequest,
  SupplierLedgerEntryRecord,
  SupplierLedgerListResponse,
} from '@/types/supplier-ledger.types'
import type {
  CreateSupplierRequest,
  SupplierRecord,
  SuppliersListResponse,
  UpdateSupplierRequest,
} from '@/types/supplier.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface SuppliersQueryParams {
  search?: string
  page?: number
  perPage?: number
}

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<
      SuppliersListResponse,
      SuppliersQueryParams | void
    >({
      query: (params) => ({
        url: '/suppliers',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response: ApiResponse<SuppliersListResponse> | SuppliersListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as SuppliersListResponse)
          : (response as ApiResponse<SuppliersListResponse>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.Supplier,
                id,
              })),
              { type: API_TAGS.Supplier, id: 'LIST' },
            ]
          : [{ type: API_TAGS.Supplier, id: 'LIST' }],
    }),

    getSupplier: builder.query<SupplierRecord, string>({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<SupplierRecord>) => response.data,
      providesTags: (_result, _error, id) => [{ type: API_TAGS.Supplier, id }],
    }),

    createSupplier: builder.mutation<SupplierRecord, CreateSupplierRequest>({
      query: (body) => ({
        url: '/suppliers',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<SupplierRecord>) => response.data,
      invalidatesTags: [{ type: API_TAGS.Supplier, id: 'LIST' }],
    }),

    updateSupplier: builder.mutation<
      SupplierRecord,
      { id: string; body: UpdateSupplierRequest }
    >({
      query: ({ id, body }) => ({
        url: `/suppliers/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<SupplierRecord>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Supplier, id },
        { type: API_TAGS.Supplier, id: 'LIST' },
      ],
    }),

    setSupplierStatus: builder.mutation<
      SupplierRecord,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/suppliers/${id}/status`,
        method: 'PATCH',
        data: { isActive },
      }),
      transformResponse: (response: ApiResponse<SupplierRecord>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Supplier, id },
        { type: API_TAGS.Supplier, id: 'LIST' },
      ],
    }),

    getSupplierLedger: builder.query<
      SupplierLedgerListResponse,
      { supplierId: string; page?: number; perPage?: number }
    >({
      query: ({ supplierId, page, perPage }) => ({
        url: `/suppliers/${supplierId}/ledger`,
        method: 'GET',
        params: { page, perPage },
      }),
      transformResponse: (
        response:
          | ApiResponse<SupplierLedgerListResponse>
          | SupplierLedgerListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as SupplierLedgerListResponse)
          : (response as ApiResponse<SupplierLedgerListResponse>).data,
      providesTags: (_result, _error, { supplierId }) => [
        { type: API_TAGS.Supplier, id: `${supplierId}-ledger` },
      ],
    }),

    addSupplierDebt: builder.mutation<
      SupplierLedgerEntryRecord,
      { supplierId: string; body: CreateSupplierLedgerEntryRequest }
    >({
      query: ({ supplierId, body }) => ({
        url: `/suppliers/${supplierId}/ledger/debt`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<SupplierLedgerEntryRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { supplierId }) => [
        { type: API_TAGS.Supplier, id: `${supplierId}-ledger` },
      ],
    }),

    addSupplierPayment: builder.mutation<
      SupplierLedgerEntryRecord,
      { supplierId: string; body: CreateSupplierLedgerEntryRequest }
    >({
      query: ({ supplierId, body }) => ({
        url: `/suppliers/${supplierId}/ledger/payment`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<SupplierLedgerEntryRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { supplierId }) => [
        { type: API_TAGS.Supplier, id: `${supplierId}-ledger` },
      ],
    }),
  }),
})

export const {
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useSetSupplierStatusMutation,
  useGetSupplierLedgerQuery,
  useAddSupplierDebtMutation,
  useAddSupplierPaymentMutation,
} = suppliersApi
