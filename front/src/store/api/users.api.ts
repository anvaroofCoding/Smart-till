import { baseApi } from './base-api'
import { API_TAGS } from './api-tags'
import type { ApiResponse } from '@/types/api.types'
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserRecord,
  UsersListResponse,
  UsersStats,
} from '@/types/user.types'

export interface UsersQueryParams {
  page?: number
  perPage?: number
  search?: string
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsersStats: builder.query<UsersStats, void>({
      query: () => ({
        url: '/users/stats',
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<UsersStats>) => response.data,
      providesTags: [{ type: API_TAGS.User, id: 'STATS' }],
    }),

    getUsers: builder.query<UsersListResponse, UsersQueryParams | void>({
      query: (params) => ({
        url: '/users',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (response: UsersListResponse) => response,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.User,
                id,
              })),
              { type: API_TAGS.User, id: 'LIST' },
            ]
          : [{ type: API_TAGS.User, id: 'LIST' }],
    }),

    getUser: builder.query<UserRecord, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiResponse<UserRecord>) => response.data,
      providesTags: (_result, _error, id) => [{ type: API_TAGS.User, id }],
    }),

    createUser: builder.mutation<UserRecord, CreateUserRequest>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        data: body,
      }),
      transformResponse: (response: ApiResponse<UserRecord>) => response.data,
      invalidatesTags: [
        { type: API_TAGS.User, id: 'LIST' },
        { type: API_TAGS.User, id: 'STATS' },
      ],
    }),

    updateUser: builder.mutation<
      UserRecord,
      { id: string; body: UpdateUserRequest }
    >({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        data: body,
      }),
      transformResponse: (response: ApiResponse<UserRecord>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.User, id },
        { type: API_TAGS.User, id: 'LIST' },
        { type: API_TAGS.User, id: 'STATS' },
      ],
    }),

    setUserStatus: builder.mutation<
      UserRecord,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
        data: { isActive },
      }),
      transformResponse: (response: ApiResponse<UserRecord>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: API_TAGS.User, id },
        { type: API_TAGS.User, id: 'LIST' },
        { type: API_TAGS.User, id: 'STATS' },
      ],
    }),

    deactivateUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ message: string }>) =>
        response.data,
      invalidatesTags: [{ type: API_TAGS.User, id: 'LIST' }, { type: API_TAGS.User, id: 'STATS' }],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUsersStatsQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useSetUserStatusMutation,
  useDeactivateUserMutation,
} = usersApi
