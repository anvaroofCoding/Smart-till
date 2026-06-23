import type { ApiResponse } from '@/types/api.types'
import type {
  CreateProductRequest,
  ProductRecord,
  ProductsListResponse,
  UpdateProductRequest,
} from '@/types/product.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

const catalogUsageInvalidationTags = [
  { type: API_TAGS.ProductCategory, id: 'LIST' },
  { type: API_TAGS.ProductBrand, id: 'LIST' },
] as const

export interface ProductsQueryParams {
  search?: string
  page?: number
  perPage?: number
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<
      ProductsListResponse,
      ProductsQueryParams | void
    >({
      query: (params) => ({
        url: '/products',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response: ApiResponse<ProductsListResponse> | ProductsListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as ProductsListResponse)
          : (response as ApiResponse<ProductsListResponse>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.Product,
                id,
              })),
              { type: API_TAGS.Product, id: 'LIST' },
            ]
          : [{ type: API_TAGS.Product, id: 'LIST' }],
    }),

    getProduct: builder.query<ProductRecord, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<ProductRecord>) => response.data,
      providesTags: (_result, _error, id) => [{ type: API_TAGS.Product, id }],
    }),

    createProduct: builder.mutation<ProductRecord, CreateProductRequest>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<ProductRecord>) => response.data,
      invalidatesTags: [
        { type: API_TAGS.Product, id: 'LIST' },
        ...catalogUsageInvalidationTags,
      ],
    }),

    updateProduct: builder.mutation<
      ProductRecord,
      { id: string; body: UpdateProductRequest }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<ProductRecord>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Product, id },
        { type: API_TAGS.Product, id: 'LIST' },
        ...catalogUsageInvalidationTags,
      ],
    }),

    setProductStatus: builder.mutation<
      ProductRecord,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/products/${id}/status`,
        method: 'PATCH',
        data: { isActive },
      }),
      transformResponse: (response: ApiResponse<ProductRecord>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.Product, id },
        { type: API_TAGS.Product, id: 'LIST' },
        ...catalogUsageInvalidationTags,
      ],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useSetProductStatusMutation,
} = productsApi
