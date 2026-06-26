import type { ApiResponse } from '@/types/api.types'
import type { OrderRecord } from '@/types/order.types'
import type {
  AddSellerCartItemRequest,
  SellerCartListResponse,
  SellerCartRecord,
  UpdateSellerCartItemRequest,
} from '@/types/seller-cart.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export const sellerCartsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMySellerCarts: builder.query<SellerCartListResponse, void>({
      query: () => ({
        url: '/seller-carts',
        method: 'GET',
      }),
      transformResponse: (
        response: ApiResponse<SellerCartListResponse> | SellerCartListResponse,
      ) =>
        'data' in response && Array.isArray((response as SellerCartListResponse).data)
          ? (response as SellerCartListResponse)
          : (response as ApiResponse<SellerCartListResponse>).data,
      providesTags: [{ type: API_TAGS.SellerCart, id: 'LIST' }],
    }),

    getSellerCartByCard: builder.query<SellerCartRecord, string>({
      query: (cardNumber) => ({
        url: `/seller-carts/by-card/${encodeURIComponent(cardNumber)}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<SellerCartRecord>) => response.data,
      providesTags: (_result, _error, cardNumber) => [
        { type: API_TAGS.SellerCart, id: cardNumber },
      ],
    }),

    reserveSellerCart: builder.mutation<SellerCartRecord, string>({
      query: (cardNumber) => ({
        url: `/seller-carts/by-card/${encodeURIComponent(cardNumber)}`,
        method: 'PUT',
      }),
      transformResponse: (response: ApiResponse<SellerCartRecord>) => response.data,
      invalidatesTags: [{ type: API_TAGS.SellerCart, id: 'LIST' }],
    }),

    addSellerCartItem: builder.mutation<
      SellerCartRecord,
      { cardNumber: string; body: AddSellerCartItemRequest }
    >({
      query: ({ cardNumber, body }) => ({
        url: `/seller-carts/by-card/${encodeURIComponent(cardNumber)}/items`,
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<SellerCartRecord>) => response.data,
      invalidatesTags: (_result, _error, { cardNumber }) => [
        { type: API_TAGS.SellerCart, id: 'LIST' },
        { type: API_TAGS.SellerCart, id: cardNumber },
      ],
    }),

    updateSellerCartItem: builder.mutation<
      SellerCartRecord,
      { cardNumber: string; productId: string; body: UpdateSellerCartItemRequest }
    >({
      query: ({ cardNumber, productId, body }) => ({
        url: `/seller-carts/by-card/${encodeURIComponent(cardNumber)}/items/${productId}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<SellerCartRecord>) => response.data,
      invalidatesTags: (_result, _error, { cardNumber }) => [
        { type: API_TAGS.SellerCart, id: 'LIST' },
        { type: API_TAGS.SellerCart, id: cardNumber },
      ],
    }),

    removeSellerCartItem: builder.mutation<
      SellerCartRecord,
      { cardNumber: string; productId: string }
    >({
      query: ({ cardNumber, productId }) => ({
        url: `/seller-carts/by-card/${encodeURIComponent(cardNumber)}/items/${productId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<SellerCartRecord>) => response.data,
      invalidatesTags: (_result, _error, { cardNumber }) => [
        { type: API_TAGS.SellerCart, id: 'LIST' },
        { type: API_TAGS.SellerCart, id: cardNumber },
      ],
    }),

    claimSellerCart: builder.mutation<OrderRecord, string>({
      query: (cardNumber) => ({
        url: `/seller-carts/by-card/${encodeURIComponent(cardNumber)}/claim`,
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<OrderRecord>) => response.data,
      invalidatesTags: [
        { type: API_TAGS.SellerCart, id: 'LIST' },
        { type: API_TAGS.Order, id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetMySellerCartsQuery,
  useGetSellerCartByCardQuery,
  useReserveSellerCartMutation,
  useAddSellerCartItemMutation,
  useUpdateSellerCartItemMutation,
  useRemoveSellerCartItemMutation,
  useClaimSellerCartMutation,
} = sellerCartsApi
