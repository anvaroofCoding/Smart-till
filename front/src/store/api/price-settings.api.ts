import type { ApiResponse } from '@/types/api.types'
import type {
  CreatePriceSettingRequest,
  PriceSettingRecord,
  PriceSettingsListResponse,
  UpdatePriceSettingRequest,
} from '@/types/price-setting.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface PriceSettingsQueryParams {
  search?: string
  page?: number
  perPage?: number
  id?: string
  settingType?: string
  warehouseId?: string
  categoryId?: string
  brandId?: string
  productId?: string
  mode?: string
  percentage?: number
  isActive?: boolean
  allWarehouses?: boolean
  createdAt?: string
}

export const priceSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPriceSettings: builder.query<
      PriceSettingsListResponse,
      PriceSettingsQueryParams | void
    >({
      query: (params) => ({
        url: '/price-settings',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<PriceSettingsListResponse>
          | PriceSettingsListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as PriceSettingsListResponse)
          : (response as ApiResponse<PriceSettingsListResponse>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.PriceSetting,
                id,
              })),
              { type: API_TAGS.PriceSetting, id: 'LIST' },
            ]
          : [{ type: API_TAGS.PriceSetting, id: 'LIST' }],
    }),

    getPriceSetting: builder.query<PriceSettingRecord, string>({
      query: (id) => ({
        url: `/price-settings/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<PriceSettingRecord>) =>
        response.data,
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.PriceSetting, id },
      ],
    }),

    createPriceSetting: builder.mutation<
      PriceSettingRecord,
      CreatePriceSettingRequest
    >({
      query: (body) => ({
        url: '/price-settings',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<PriceSettingRecord>) =>
        response.data,
      invalidatesTags: [
        { type: API_TAGS.PriceSetting, id: 'LIST' },
        { type: API_TAGS.Inventory, id: 'LIST' },
      ],
    }),

    updatePriceSetting: builder.mutation<
      PriceSettingRecord,
      { id: string; body: UpdatePriceSettingRequest }
    >({
      query: ({ id, body }) => ({
        url: `/price-settings/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<PriceSettingRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.PriceSetting, id },
        { type: API_TAGS.PriceSetting, id: 'LIST' },
        { type: API_TAGS.Inventory, id: 'LIST' },
      ],
    }),

    setPriceSettingStatus: builder.mutation<
      PriceSettingRecord,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/price-settings/${id}/status`,
        method: 'PATCH',
        data: { isActive },
      }),
      transformResponse: (response: ApiResponse<PriceSettingRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.PriceSetting, id },
        { type: API_TAGS.PriceSetting, id: 'LIST' },
        { type: API_TAGS.Inventory, id: 'LIST' },
      ],
    }),

    deletePriceSetting: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/price-settings/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.PriceSetting, id },
        { type: API_TAGS.PriceSetting, id: 'LIST' },
        { type: API_TAGS.Inventory, id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetPriceSettingsQuery,
  useGetPriceSettingQuery,
  useCreatePriceSettingMutation,
  useUpdatePriceSettingMutation,
  useSetPriceSettingStatusMutation,
  useDeletePriceSettingMutation,
} = priceSettingsApi
