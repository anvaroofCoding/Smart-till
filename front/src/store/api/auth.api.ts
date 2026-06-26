import { baseApi } from './base-api'
import { API_TAGS } from './api-tags'
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  UpdateProfileRequest,
} from '@/types/api.types'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<LoginResponse>) => response.data,
      invalidatesTags: [{ type: API_TAGS.Auth, id: 'ME' }],
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<MeResponse>) => response.data,
      providesTags: [{ type: API_TAGS.Auth, id: 'ME' }],
    }),

    updateProfile: builder.mutation<MeResponse, UpdateProfileRequest>({
      query: (body) => ({
        url: '/auth/me',
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<MeResponse>) => response.data,
      invalidatesTags: [{ type: API_TAGS.Auth, id: 'ME' }],
    }),

    healthCheck: builder.query<{ status: string }, void>({
      query: () => ({
        url: '/health',
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<{ status: string }>) => response.data,
      providesTags: [{ type: API_TAGS.Health, id: 'STATUS' }],
    }),
  }),
})

export const {
  useLoginMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateProfileMutation,
  useHealthCheckQuery,
} = authApi
