import type { ApiResponse } from '@/types/api.types'
import type {
  CreateProductBrandRequest,
  ProductBrandRecord,
  ProductBrandsListResponse,
  UpdateProductBrandRequest,
} from '@/types/product-brand.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface ProductBrandsQueryParams {
  search?: string
  page?: number
  perPage?: number
}

export const productBrandsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductBrands: builder.query<
      ProductBrandsListResponse,
      ProductBrandsQueryParams | void
    >({
      query: (params) => ({
        url: '/product-brands',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<ProductBrandsListResponse>
          | ProductBrandsListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as ProductBrandsListResponse)
          : (response as ApiResponse<ProductBrandsListResponse>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.ProductBrand,
                id,
              })),
              { type: API_TAGS.ProductBrand, id: 'LIST' },
            ]
          : [{ type: API_TAGS.ProductBrand, id: 'LIST' }],
    }),

    getProductBrand: builder.query<ProductBrandRecord, string>({
      query: (id) => ({
        url: `/product-brands/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<ProductBrandRecord>) =>
        response.data,
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.ProductBrand, id },
      ],
    }),

    createProductBrand: builder.mutation<
      ProductBrandRecord,
      CreateProductBrandRequest
    >({
      query: (body) => ({
        url: '/product-brands',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<ProductBrandRecord>) =>
        response.data,
      invalidatesTags: [{ type: API_TAGS.ProductBrand, id: 'LIST' }],
    }),

    updateProductBrand: builder.mutation<
      ProductBrandRecord,
      { id: string; body: UpdateProductBrandRequest }
    >({
      query: ({ id, body }) => ({
        url: `/product-brands/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<ProductBrandRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.ProductBrand, id },
        { type: API_TAGS.ProductBrand, id: 'LIST' },
      ],
    }),

    setProductBrandStatus: builder.mutation<
      ProductBrandRecord,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/product-brands/${id}/status`,
        method: 'PATCH',
        data: { isActive },
      }),
      transformResponse: (response: ApiResponse<ProductBrandRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.ProductBrand, id },
        { type: API_TAGS.ProductBrand, id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetProductBrandsQuery,
  useGetProductBrandQuery,
  useCreateProductBrandMutation,
  useUpdateProductBrandMutation,
  useSetProductBrandStatusMutation,
} = productBrandsApi
