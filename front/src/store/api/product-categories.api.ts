import type { ApiResponse } from '@/types/api.types'
import type {
  CreateProductCategoryRequest,
  ProductCategoriesListResponse,
  ProductCategoryRecord,
  UpdateProductCategoryRequest,
} from '@/types/product-category.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export interface ProductCategoriesQueryParams {
  search?: string
  page?: number
  perPage?: number
}

export const productCategoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductCategories: builder.query<
      ProductCategoriesListResponse,
      ProductCategoriesQueryParams | void
    >({
      query: (params) => ({
        url: '/product-categories',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<ProductCategoriesListResponse>
          | ProductCategoriesListResponse,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as ProductCategoriesListResponse)
          : (response as ApiResponse<ProductCategoriesListResponse>).data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.ProductCategory,
                id,
              })),
              { type: API_TAGS.ProductCategory, id: 'LIST' },
            ]
          : [{ type: API_TAGS.ProductCategory, id: 'LIST' }],
    }),

    getProductCategory: builder.query<ProductCategoryRecord, string>({
      query: (id) => ({
        url: `/product-categories/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<ProductCategoryRecord>) =>
        response.data,
      providesTags: (_result, _error, id) => [
        { type: API_TAGS.ProductCategory, id },
      ],
    }),

    createProductCategory: builder.mutation<
      ProductCategoryRecord,
      CreateProductCategoryRequest
    >({
      query: (body) => ({
        url: '/product-categories',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<ProductCategoryRecord>) =>
        response.data,
      invalidatesTags: [{ type: API_TAGS.ProductCategory, id: 'LIST' }],
    }),

    updateProductCategory: builder.mutation<
      ProductCategoryRecord,
      { id: string; body: UpdateProductCategoryRequest }
    >({
      query: ({ id, body }) => ({
        url: `/product-categories/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<ProductCategoryRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.ProductCategory, id },
        { type: API_TAGS.ProductCategory, id: 'LIST' },
      ],
    }),

    setProductCategoryStatus: builder.mutation<
      ProductCategoryRecord,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/product-categories/${id}/status`,
        method: 'PATCH',
        data: { isActive },
      }),
      transformResponse: (response: ApiResponse<ProductCategoryRecord>) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.ProductCategory, id },
        { type: API_TAGS.ProductCategory, id: 'LIST' },
      ],
    }),

    deleteProductCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/product-categories/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }> | { message: string }) =>
        'data' in response && response.data
          ? response.data
          : (response as { message: string }),
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.ProductCategory, id },
        { type: API_TAGS.ProductCategory, id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetProductCategoriesQuery,
  useGetProductCategoryQuery,
  useCreateProductCategoryMutation,
  useUpdateProductCategoryMutation,
  useSetProductCategoryStatusMutation,
  useDeleteProductCategoryMutation,
} = productCategoriesApi
