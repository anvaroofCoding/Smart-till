import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  NotificationRecord,
  NotificationUnreadCount,
} from '@/types/notification.types'
import { API_TAGS } from './api-tags'
import { baseApi } from './base-api'

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      PaginatedResponse<NotificationRecord>,
      { page?: number; perPage?: number } | void
    >({
      query: (params) => ({
        url: '/notifications',
        params: params ?? {},
      }),
      transformResponse: (
        response:
          | ApiResponse<PaginatedResponse<NotificationRecord>>
          | PaginatedResponse<NotificationRecord>,
      ) =>
        'data' in response && Array.isArray(response.data) && 'meta' in response
          ? (response as PaginatedResponse<NotificationRecord>)
          : (response as ApiResponse<PaginatedResponse<NotificationRecord>>)
              .data,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: API_TAGS.Notification,
                id,
              })),
              { type: API_TAGS.Notification, id: 'LIST' },
              { type: API_TAGS.Notification, id: 'UNREAD' },
            ]
          : [
              { type: API_TAGS.Notification, id: 'LIST' },
              { type: API_TAGS.Notification, id: 'UNREAD' },
            ],
    }),
    getNotificationUnreadCount: builder.query<NotificationUnreadCount, void>({
      query: () => ({ url: '/notifications/unread-count' }),
      transformResponse: (response: ApiResponse<NotificationUnreadCount>) =>
        response.data,
      providesTags: [{ type: API_TAGS.Notification, id: 'UNREAD' }],
    }),
    markNotificationRead: builder.mutation<NotificationRecord | null, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      transformResponse: (
        response: ApiResponse<NotificationRecord | null>,
      ) => response.data,
      invalidatesTags: (_result, _error, id) => [
        { type: API_TAGS.Notification, id },
        { type: API_TAGS.Notification, id: 'LIST' },
        { type: API_TAGS.Notification, id: 'UNREAD' },
      ],
    }),
    markAllNotificationsRead: builder.mutation<{ updated: number }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      transformResponse: (response: ApiResponse<{ updated: number }>) =>
        response.data,
      invalidatesTags: [
        { type: API_TAGS.Notification, id: 'LIST' },
        { type: API_TAGS.Notification, id: 'UNREAD' },
      ],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi
