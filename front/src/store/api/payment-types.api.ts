import type { ApiResponse } from '@/types/api.types'
import type {
  CreatePaymentTypeRequest,
  PaymentTypeRecord,
  PaymentTypesListResponse,
  UpdatePaymentTypeRequest,
} from '@/types/payment-type.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface PaymentTypesQueryParams {
  search?: string
  page?: number
  perPage?: number
  id?: string
  name?: string
  isActive?: boolean
  createdAt?: string
}

export const paymentTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentTypes: builder.query<
      PaymentTypesListResponse,
      PaymentTypesQueryParams | void
    >({
      query: (params) => ({
        url: '/payment-types',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<PaymentTypesListResponse>
          | PaymentTypesListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as PaymentTypesListResponse)
          : (response as ApiResponse<PaymentTypesListResponse>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.PaymentType,
                id,
              })),
              { type: API_TAGS.PaymentType, id: 'LIST' },
            ]
          : [{ type: API_TAGS.PaymentType, id: 'LIST' }],
    }),

    getPaymentType: builder.query<PaymentTypeRecord, string>({
      query: (id) => ({
        url: `/payment-types/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<PaymentTypeRecord>) =>
        response.data,
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.PaymentType, id },
      ],
    }),

    createPaymentType: builder.mutation<
      PaymentTypeRecord,
      CreatePaymentTypeRequest
    >({
      query: (body) => ({
        url: '/payment-types',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<PaymentTypeRecord>) =>
        response.data,
      invalidatesTags: [{ type: API_TAGS.PaymentType, id: 'LIST' }],
    }),

    updatePaymentType: builder.mutation<
      PaymentTypeRecord,
      { id: string; body: UpdatePaymentTypeRequest }
    >({
      query: ({ id, body }) => ({
        url: `/payment-types/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<PaymentTypeRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.PaymentType, id },
        { type: API_TAGS.PaymentType, id: 'LIST' },
      ],
    }),

    setPaymentTypeStatus: builder.mutation<
      PaymentTypeRecord,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/payment-types/${id}/status`,
        method: 'PATCH',
        data: { isActive },
      }),
      transformResponse: (response: ApiResponse<PaymentTypeRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.PaymentType, id },
        { type: API_TAGS.PaymentType, id: 'LIST' },
      ],
    }),

    deletePaymentType: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/payment-types/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.PaymentType, id },
        { type: API_TAGS.PaymentType, id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetPaymentTypesQuery,
  useGetPaymentTypeQuery,
  useCreatePaymentTypeMutation,
  useUpdatePaymentTypeMutation,
  useSetPaymentTypeStatusMutation,
  useDeletePaymentTypeMutation,
} = paymentTypesApi
